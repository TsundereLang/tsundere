import { EventEmitter } from "node:events";
import { createServer, type Server } from "node:http";
import { cpus, freemem, totalmem, uptime } from "node:os";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { RuntimeCacheBackend, RuntimeConfig, RuntimeMetricFormat, RuntimeScaleMode, TsundereConfig } from "../types.js";

export interface RuntimePlan {
  mode: RuntimeScaleMode;
  workers: number;
  shards: number;
  simulated: boolean;
  cacheBackend: RuntimeCacheBackend;
  redis?: string;
  metrics: {
    enabled: boolean;
    port: number;
    path: string;
    format: RuntimeMetricFormat;
  };
  tracing: {
    enabled: boolean;
    provider: string;
  };
}

export interface RuntimeMetricSnapshot {
  health: "ok" | "warning" | "error";
  workers: number;
  shards: number;
  guilds: number;
  users: number;
  memoryUsedBytes: number;
  memoryTotalBytes: number;
  cpuCount: number;
  uptimeSeconds: number;
  events: number;
  commands: number;
  restRequests: number;
  rateLimits: number;
  gatewayLatencyMs: number;
  websocketReconnects: number;
  workerRestarts: number;
  crashes: number;
  cacheHits: number;
  cacheMisses: number;
  ipcMessages: number;
  taskExecutions: number;
}

export interface RuntimeInspectReport extends RuntimeMetricSnapshot {
  mode: RuntimeScaleMode;
  cacheBackend: RuntimeCacheBackend;
  metricsPort: number;
  metricsPath: string;
}

export interface TaskHandle {
  name: string;
  stop(): void;
}

export class DistributedRuntime {
  readonly bus = new EventEmitter();
  readonly events = new EventEmitter();
  readonly cache = new DistributedCache();
  readonly tasks = new TaskRegistry(this);
  private readonly counters = new Map<string, number>();

  constructor(readonly plan: RuntimePlan) {
    const maxListeners = Math.max(10, plan.workers + plan.shards + 8);
    this.bus.setMaxListeners(maxListeners);
    this.events.setMaxListeners(maxListeners);
  }

  broadcast(name: string, payload?: unknown): void {
    this.increment("ipcMessages");
    this.bus.emit(name, payload);
  }

  onBroadcast(name: string, handler: (payload: unknown) => void): void {
    this.bus.on(name, handler);
  }

  emitGlobal(name: string, payload?: unknown): void {
    this.increment("events");
    this.events.emit(name, payload);
  }

  onGlobal(name: string, handler: (payload: unknown) => void): void {
    this.events.on(name, handler);
  }

  increment(metric: keyof Pick<RuntimeMetricSnapshot, "events" | "commands" | "restRequests" | "rateLimits" | "websocketReconnects" | "workerRestarts" | "crashes" | "cacheHits" | "cacheMisses" | "ipcMessages" | "taskExecutions">, amount = 1): void {
    this.counters.set(metric, (this.counters.get(metric) ?? 0) + amount);
  }

  metrics(): RuntimeMetricSnapshot {
    const memoryTotal = totalmem();
    return {
      health: "ok",
      workers: this.plan.workers,
      shards: this.plan.shards,
      guilds: Number(process.env.TSUNDERE_GUILD_COUNT ?? "0"),
      users: Number(process.env.TSUNDERE_USER_COUNT ?? "0"),
      memoryUsedBytes: memoryTotal - freemem(),
      memoryTotalBytes: memoryTotal,
      cpuCount: cpus().length,
      uptimeSeconds: Math.floor(uptime()),
      events: this.counters.get("events") ?? 0,
      commands: this.counters.get("commands") ?? 0,
      restRequests: this.counters.get("restRequests") ?? 0,
      rateLimits: this.counters.get("rateLimits") ?? 0,
      gatewayLatencyMs: Number(process.env.TSUNDERE_GATEWAY_LATENCY_MS ?? "0"),
      websocketReconnects: this.counters.get("websocketReconnects") ?? 0,
      workerRestarts: this.counters.get("workerRestarts") ?? 0,
      crashes: this.counters.get("crashes") ?? 0,
      cacheHits: this.counters.get("cacheHits") ?? this.cache.hits,
      cacheMisses: this.counters.get("cacheMisses") ?? this.cache.misses,
      ipcMessages: this.counters.get("ipcMessages") ?? 0,
      taskExecutions: this.counters.get("taskExecutions") ?? 0
    };
  }

  inspect(): RuntimeInspectReport {
    return {
      ...this.metrics(),
      mode: this.plan.mode,
      cacheBackend: this.plan.cacheBackend,
      metricsPort: this.plan.metrics.port,
      metricsPath: this.plan.metrics.path
    };
  }
}

export class DistributedCache {
  private readonly values = new Map<string, unknown>();
  hits = 0;
  misses = 0;

  set(namespace: string, id: string, value: unknown): void {
    this.values.set(cacheKey(namespace, id), value);
  }

  get<T = unknown>(namespace: string, id: string): T | undefined {
    const key = cacheKey(namespace, id);
    if (this.values.has(key)) {
      this.hits += 1;
      return this.values.get(key) as T;
    }
    this.misses += 1;
    return undefined;
  }

  delete(namespace: string, id: string): boolean {
    return this.values.delete(cacheKey(namespace, id));
  }

  size(): number {
    return this.values.size;
  }
}

export class TaskRegistry {
  private readonly handles = new Map<string, NodeJS.Timeout>();

  constructor(private readonly runtime: DistributedRuntime) {}

  every(name: string, ms: number, handler: () => Promise<void> | void): TaskHandle {
    if (this.handles.has(name)) {
      throw new Error(`Distributed task already exists: ${name}`);
    }
    const run = async (): Promise<void> => {
      this.runtime.increment("taskExecutions");
      await handler();
    };
    const handle = setInterval(() => void run(), ms);
    this.handles.set(name, handle);
    return {
      name,
      stop: () => {
        clearInterval(handle);
        this.handles.delete(name);
      }
    };
  }
}

export function createDistributedRuntime(config: TsundereConfig): DistributedRuntime {
  return new DistributedRuntime(createRuntimePlan(config));
}

export function createRuntimePlan(config: TsundereConfig, env = process.env): RuntimePlan {
  const runtime = normalizeRuntimeConfig(config.runtime);
  const simulatedShards = numberValue(runtime.simulateShards);
  const recommendedShards = simulatedShards ?? numberValue(env.DISCORD_SHARD_COUNT) ?? numberValue(env.TSUNDERE_RECOMMENDED_SHARDS) ?? 1;
  const shards = runtime.shards === "auto" || runtime.shards === undefined ? recommendedShards : Math.max(1, Number(runtime.shards));
  const autoWorkers = Math.max(1, Math.min(cpus().length, shards));
  const workers = runtime.workers === "auto" || runtime.workers === undefined
    ? (runtime.scale === "auto" ? autoWorkers : 1)
    : Math.max(1, Number(runtime.workers));
  const mode = runtime.scale === "auto" ? "auto" : workers > 1 || shards > 1 ? "manual" : "off";
  return {
    mode,
    workers,
    shards,
    simulated: simulatedShards !== undefined,
    cacheBackend: runtime.cache?.backend ?? (runtime.redis ? "redis" : "memory"),
    ...(runtime.redis ? { redis: runtime.redis } : {}),
    metrics: {
      enabled: runtime.metrics?.enabled ?? false,
      port: runtime.metrics?.port ?? 9100,
      path: runtime.metrics?.path ?? "/metrics",
      format: runtime.metrics?.format ?? "prometheus"
    },
    tracing: {
      enabled: runtime.tracing?.enabled ?? false,
      provider: runtime.tracing?.provider ?? "none"
    }
  };
}

export function prometheusMetrics(snapshot: RuntimeMetricSnapshot): string {
  const metrics: Array<[string, number, string]> = [
    ["tsundere_runtime_workers", snapshot.workers, "Configured Tsundere runtime workers"],
    ["tsundere_runtime_shards", snapshot.shards, "Configured Tsundere runtime shards"],
    ["tsundere_runtime_guilds", snapshot.guilds, "Observed Discord guild count"],
    ["tsundere_runtime_users", snapshot.users, "Observed Discord user count"],
    ["tsundere_runtime_memory_used_bytes", snapshot.memoryUsedBytes, "Runtime memory used"],
    ["tsundere_runtime_memory_total_bytes", snapshot.memoryTotalBytes, "Runtime memory total"],
    ["tsundere_runtime_cpu_count", snapshot.cpuCount, "Runtime CPU count"],
    ["tsundere_runtime_uptime_seconds", snapshot.uptimeSeconds, "Host uptime in seconds"],
    ["tsundere_runtime_events_total", snapshot.events, "Distributed event count"],
    ["tsundere_runtime_commands_total", snapshot.commands, "Command execution count"],
    ["tsundere_runtime_rest_requests_total", snapshot.restRequests, "Discord REST request count"],
    ["tsundere_runtime_rate_limits_total", snapshot.rateLimits, "Discord rate limit count"],
    ["tsundere_runtime_gateway_latency_ms", snapshot.gatewayLatencyMs, "Gateway latency in milliseconds"],
    ["tsundere_runtime_websocket_reconnects_total", snapshot.websocketReconnects, "WebSocket reconnect count"],
    ["tsundere_runtime_worker_restarts_total", snapshot.workerRestarts, "Worker restart count"],
    ["tsundere_runtime_crashes_total", snapshot.crashes, "Runtime crash count"],
    ["tsundere_runtime_cache_hits_total", snapshot.cacheHits, "Distributed cache hit count"],
    ["tsundere_runtime_cache_misses_total", snapshot.cacheMisses, "Distributed cache miss count"],
    ["tsundere_runtime_ipc_messages_total", snapshot.ipcMessages, "IPC message count"],
    ["tsundere_runtime_task_executions_total", snapshot.taskExecutions, "Distributed task execution count"]
  ];
  return `${metrics.flatMap(([name, value, help]) => [
    `# HELP ${name} ${help}`,
    `# TYPE ${name} gauge`,
    `${name} ${Number.isFinite(value) ? value : 0}`
  ]).join("\n")}\n`;
}

export function grafanaDashboard(): Record<string, unknown> {
  const panels = [
    "Runtime health",
    "Shard status",
    "Worker status",
    "Gateway latency",
    "Event throughput",
    "Command throughput",
    "REST rate limits",
    "Memory usage",
    "CPU usage",
    "Crash and restart history",
    "Cache performance",
    "IPC performance",
    "Task execution"
  ];
  return {
    title: "Tsundere Distributed Runtime",
    schemaVersion: 39,
    refresh: "10s",
    tags: ["tsundere", "discord", "runtime"],
    timezone: "browser",
    panels: panels.map((title, index) => ({
      id: index + 1,
      title,
      type: "timeseries",
      gridPos: { x: index % 2 === 0 ? 0 : 12, y: Math.floor(index / 2) * 8, w: 12, h: 8 },
      targets: [{ expr: dashboardExpression(title), refId: String.fromCharCode(65 + index) }]
    }))
  };
}

export async function exportGrafanaDashboard(path: string): Promise<string> {
  const output = resolve(path);
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(grafanaDashboard(), null, 2)}\n`, "utf8");
  return output;
}

export function serveMetrics(runtime: DistributedRuntime): Promise<{ server: Server; url: string }> {
  const server = createServer((request, response) => {
    const path = request.url?.split("?")[0] ?? "/";
    if (path !== runtime.plan.metrics.path) {
      response.writeHead(404, { "content-type": "text/plain" });
      response.end("not found\n");
      return;
    }
    response.writeHead(200, { "content-type": runtime.plan.metrics.format === "json" ? "application/json" : "text/plain; version=0.0.4" });
    response.end(runtime.plan.metrics.format === "json"
      ? `${JSON.stringify(runtime.metrics(), null, 2)}\n`
      : prometheusMetrics(runtime.metrics()));
  });
  return new Promise((resolveServer) => {
    server.listen(runtime.plan.metrics.port, () => {
      resolveServer({ server, url: `http://127.0.0.1:${runtime.plan.metrics.port}${runtime.plan.metrics.path}` });
    });
  });
}

function normalizeRuntimeConfig(runtime: TsundereConfig["runtime"]): RuntimeConfig {
  if (!runtime) {
    return { target: "node" };
  }
  if (typeof runtime === "string") {
    return { target: runtime };
  }
  return runtime;
}

function numberValue(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "auto") {
    return undefined;
  }
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : undefined;
}

function cacheKey(namespace: string, id: string): string {
  return `${namespace}:${id}`;
}

function dashboardExpression(title: string): string {
  const expressions: Record<string, string> = {
    "Runtime health": "tsundere_runtime_workers",
    "Shard status": "tsundere_runtime_shards",
    "Worker status": "tsundere_runtime_workers",
    "Gateway latency": "tsundere_runtime_gateway_latency_ms",
    "Event throughput": "rate(tsundere_runtime_events_total[1m])",
    "Command throughput": "rate(tsundere_runtime_commands_total[1m])",
    "REST rate limits": "rate(tsundere_runtime_rate_limits_total[1m])",
    "Memory usage": "tsundere_runtime_memory_used_bytes",
    "CPU usage": "tsundere_runtime_cpu_count",
    "Crash and restart history": "tsundere_runtime_crashes_total + tsundere_runtime_worker_restarts_total",
    "Cache performance": "tsundere_runtime_cache_hits_total / clamp_min(tsundere_runtime_cache_hits_total + tsundere_runtime_cache_misses_total, 1)",
    "IPC performance": "rate(tsundere_runtime_ipc_messages_total[1m])",
    "Task execution": "rate(tsundere_runtime_task_executions_total[1m])"
  };
  return expressions[title] ?? "tsundere_runtime_workers";
}
