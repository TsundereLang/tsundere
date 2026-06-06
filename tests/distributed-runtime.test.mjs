import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  createDistributedRuntime,
  createRuntimePlan,
  exportGrafanaDashboard,
  prometheusMetrics,
  serveMetrics
} from "../dist/distributed/index.js";

const baseConfig = {
  name: "runtime-test",
  source: "src",
  outDir: "build",
  target: "typescript",
  strict: true,
  sourceMaps: true
};

test("creates an automatic distributed runtime plan", () => {
  const plan = createRuntimePlan({
    ...baseConfig,
    runtime: {
      scale: "auto",
      shards: "auto",
      simulateShards: 16,
      metrics: {
        enabled: true,
        port: 9100,
        path: "/metrics",
        format: "prometheus"
      },
      tracing: {
        enabled: true,
        provider: "opentelemetry"
      }
    }
  });
  assert.equal(plan.mode, "auto");
  assert.equal(plan.shards, 16);
  assert.equal(plan.workers >= 1, true);
  assert.equal(plan.simulated, true);
  assert.equal(plan.metrics.path, "/metrics");
  assert.equal(plan.tracing.provider, "opentelemetry");
});

test("distributed runtime provides local IPC cache and metrics", () => {
  const runtime = createDistributedRuntime({
    ...baseConfig,
    runtime: {
      scale: "auto",
      simulateShards: 4
    }
  });
  let payload;
  runtime.onBroadcast("reloadConfig", (value) => {
    payload = value;
  });
  runtime.broadcast("reloadConfig", { ok: true });
  runtime.cache.set("guild", "123", { name: "Tsundere" });
  assert.deepEqual(runtime.cache.get("guild", "123"), { name: "Tsundere" });
  assert.equal(runtime.cache.get("guild", "missing"), undefined);
  const snapshot = runtime.metrics();
  assert.deepEqual(payload, { ok: true });
  assert.equal(snapshot.ipcMessages, 1);
  assert.equal(snapshot.cacheHits, 1);
  assert.equal(snapshot.cacheMisses, 1);
});

test("prometheus metrics include runtime counters", () => {
  const runtime = createDistributedRuntime(baseConfig);
  runtime.increment("commands", 3);
  const text = prometheusMetrics(runtime.metrics());
  assert.match(text, /tsundere_runtime_workers/u);
  assert.match(text, /tsundere_runtime_commands_total 3/u);
  assert.match(text, /tsundere_runtime_cache_hits_total/u);
});

test("exports a Grafana dashboard JSON", async () => {
  const root = await mkdtemp(join(tmpdir(), "tsundere-grafana-"));
  const file = join(root, "dashboard.json");
  await exportGrafanaDashboard(file);
  const dashboard = JSON.parse(await readFile(file, "utf8"));
  assert.equal(dashboard.title, "Tsundere Distributed Runtime");
  assert.equal(dashboard.panels.length >= 10, true);
  await rm(root, { recursive: true, force: true });
});

test("serves metrics over HTTP", async () => {
  const runtime = createDistributedRuntime({
    ...baseConfig,
    runtime: {
      metrics: {
        enabled: true,
        port: 0,
        path: "/metrics",
        format: "prometheus"
      }
    }
  });
  const { server } = await serveMetrics(runtime);
  const address = server.address();
  assert.equal(typeof address, "object");
  const response = await fetch(`http://127.0.0.1:${address.port}/metrics`);
  const text = await response.text();
  assert.equal(response.status, 200);
  assert.match(text, /tsundere_runtime_workers/u);
  await new Promise((resolve) => server.close(resolve));
});
