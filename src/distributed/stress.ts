import { performance } from "node:perf_hooks";
import type { RuntimeConfig, TsundereConfig } from "../types.js";
import { createDistributedRuntime, grafanaDashboard, prometheusMetrics, type RuntimeMetricSnapshot, type RuntimePlan, type TaskHandle } from "./runtime.js";

export interface RuntimeStressOptions {
  iterations?: number;
  shards?: number;
  workers?: number | "auto";
  cacheEntries?: number;
  taskExecutions?: number;
  metricsSamples?: number;
  payloadBytes?: number;
}

export interface RuntimeStressSection {
  name: string;
  operations: number;
  durationMs: number;
  operationsPerSecond: number;
}

export interface RuntimeStressReport {
  plan: RuntimePlan;
  status: "pass" | "warn";
  warnings: string[];
  durationMs: number;
  operations: number;
  operationsPerSecond: number;
  memory: {
    beforeBytes: number;
    afterBytes: number;
    deltaBytes: number;
  };
  ipcDelivered: number;
  globalEventsDelivered: number;
  cacheEntries: number;
  cacheHitRate: number;
  taskExecutions: number;
  metricsBytes: number;
  grafanaPanelCount: number;
  snapshot: RuntimeMetricSnapshot;
  sections: RuntimeStressSection[];
}

export async function runRuntimeStressTest(config: TsundereConfig, options: RuntimeStressOptions = {}): Promise<RuntimeStressReport> {
  const stressOptions = normalizeStressOptions(options);
  const runtime = createDistributedRuntime({
    ...config,
    runtime: stressRuntimeConfig(config.runtime, stressOptions)
  });
  const warnings: string[] = [];
  const memoryBefore = process.memoryUsage().heapUsed;
  const started = performance.now();
  const sections: RuntimeStressSection[] = [];
  const payload = {
    id: "stress",
    data: "x".repeat(stressOptions.payloadBytes)
  };

  let ipcDelivered = 0;
  runtime.onBroadcast("stress:ipc", () => {
    ipcDelivered += 1;
  });
  sections.push(measure("ipc broadcast", stressOptions.iterations, () => {
    for (let i = 0; i < stressOptions.iterations; i += 1) {
      runtime.broadcast("stress:ipc", payload);
    }
  }));
  if (ipcDelivered !== stressOptions.iterations) {
    warnings.push(`IPC delivered ${ipcDelivered} of ${stressOptions.iterations} messages`);
  }

  let globalEventsDelivered = 0;
  runtime.onGlobal("stress:event", () => {
    globalEventsDelivered += 1;
  });
  sections.push(measure("global events", stressOptions.iterations, () => {
    for (let i = 0; i < stressOptions.iterations; i += 1) {
      runtime.emitGlobal("stress:event", payload);
    }
  }));
  if (globalEventsDelivered !== stressOptions.iterations) {
    warnings.push(`Global events delivered ${globalEventsDelivered} of ${stressOptions.iterations}`);
  }

  const cacheOperations = stressOptions.cacheEntries * 3;
  sections.push(measure("cache set get miss", cacheOperations, () => {
    for (let i = 0; i < stressOptions.cacheEntries; i += 1) {
      runtime.cache.set("guild", String(i), { id: i, payload });
    }
    for (let i = 0; i < stressOptions.cacheEntries; i += 1) {
      runtime.cache.get("guild", String(i));
    }
    for (let i = 0; i < stressOptions.cacheEntries; i += 1) {
      runtime.cache.get("guild", `missing-${i}`);
    }
  }));

  const taskSection = await measureAsync("distributed tasks", stressOptions.taskExecutions, async () => {
    if (stressOptions.taskExecutions === 0) {
      return;
    }
    await runTaskStress(runtime, stressOptions.taskExecutions, warnings);
  });
  sections.push(taskSection);

  let metricsBytes = 0;
  sections.push(measure("metrics generation", stressOptions.metricsSamples, () => {
    for (let i = 0; i < stressOptions.metricsSamples; i += 1) {
      metricsBytes += prometheusMetrics(runtime.metrics()).length;
    }
  }));

  const dashboard = grafanaDashboard();
  const snapshot = runtime.metrics();
  const durationMs = performance.now() - started;
  const operations = sections.reduce((total, section) => total + section.operations, 0);
  const memoryAfter = process.memoryUsage().heapUsed;
  const cacheLookups = snapshot.cacheHits + snapshot.cacheMisses;
  return {
    plan: runtime.plan,
    status: warnings.length > 0 ? "warn" : "pass",
    warnings,
    durationMs,
    operations,
    operationsPerSecond: rate(operations, durationMs),
    memory: {
      beforeBytes: memoryBefore,
      afterBytes: memoryAfter,
      deltaBytes: memoryAfter - memoryBefore
    },
    ipcDelivered,
    globalEventsDelivered,
    cacheEntries: runtime.cache.size(),
    cacheHitRate: cacheLookups === 0 ? 0 : snapshot.cacheHits / cacheLookups,
    taskExecutions: snapshot.taskExecutions,
    metricsBytes,
    grafanaPanelCount: Array.isArray(dashboard.panels) ? dashboard.panels.length : 0,
    snapshot,
    sections
  };
}

function normalizeStressOptions(options: RuntimeStressOptions): Required<RuntimeStressOptions> {
  return {
    iterations: positiveInteger(options.iterations, 25_000),
    shards: positiveInteger(options.shards, 32),
    workers: options.workers ?? "auto",
    cacheEntries: positiveInteger(options.cacheEntries, 10_000),
    taskExecutions: positiveInteger(options.taskExecutions, 100),
    metricsSamples: positiveInteger(options.metricsSamples, 100),
    payloadBytes: positiveInteger(options.payloadBytes, 256)
  };
}

function stressRuntimeConfig(runtime: TsundereConfig["runtime"], options: Required<RuntimeStressOptions>): RuntimeConfig {
  const base = runtimeConfigFrom(runtime);
  return {
    ...base,
    scale: "auto",
    workers: options.workers,
    shards: "auto",
    simulateShards: options.shards,
    cache: {
      ...base.cache,
      backend: base.cache?.backend ?? "memory"
    },
    metrics: {
      ...base.metrics,
      enabled: true,
      port: base.metrics?.port ?? 9100,
      path: base.metrics?.path ?? "/metrics",
      format: base.metrics?.format ?? "prometheus"
    },
    tracing: {
      ...base.tracing,
      enabled: base.tracing?.enabled ?? false,
      provider: base.tracing?.provider ?? "opentelemetry"
    }
  };
}

function runtimeConfigFrom(runtime: TsundereConfig["runtime"]): RuntimeConfig {
  if (!runtime) {
    return { target: "node" };
  }
  if (typeof runtime === "string") {
    return { target: runtime };
  }
  return runtime;
}

function measure(name: string, operations: number, action: () => void): RuntimeStressSection {
  const started = performance.now();
  action();
  const durationMs = performance.now() - started;
  return {
    name,
    operations,
    durationMs,
    operationsPerSecond: rate(operations, durationMs)
  };
}

async function measureAsync(name: string, operations: number, action: () => Promise<void>): Promise<RuntimeStressSection> {
  const started = performance.now();
  await action();
  const durationMs = performance.now() - started;
  return {
    name,
    operations,
    durationMs,
    operationsPerSecond: rate(operations, durationMs)
  };
}

async function runTaskStress(runtime: { tasks: { every(name: string, ms: number, handler: () => void): TaskHandle } }, target: number, warnings: string[]): Promise<void> {
  await new Promise<void>((resolve) => {
    let executions = 0;
    let handle: TaskHandle | undefined;
    const timeout = setTimeout(() => {
      handle?.stop();
      warnings.push(`Distributed task stress reached ${executions} of ${target} executions before timeout`);
      resolve();
    }, Math.max(2000, target * 20));
    handle = runtime.tasks.every("stress:task", 1, () => {
      executions += 1;
      if (executions >= target) {
        clearTimeout(timeout);
        handle?.stop();
        resolve();
      }
    });
  });
}

function positiveInteger(value: number | undefined, fallback: number): number {
  if (value === undefined || !Number.isFinite(value) || value < 0) {
    return fallback;
  }
  return Math.floor(value);
}

function rate(operations: number, durationMs: number): number {
  return durationMs <= 0 ? operations : operations / (durationMs / 1000);
}
