import test from "node:test";
import assert from "node:assert/strict";
import { createDefaultMetrics, createRegistry } from "../packages/metrics/src/index.js";

test("counter exports prometheus text", () => {
  const registry = createRegistry();
  registry.counter({
    name: "tsundere_commands_total",
    help: "Commands handled.",
    labels: ["command", "status"]
  }).inc(2, { command: "ping", status: "ok" });

  const output = registry.toPrometheus();
  assert.match(output, /# TYPE tsundere_commands_total counter/u);
  assert.match(output, /tsundere_commands_total\{command="ping",status="ok"\} 2/u);
});

test("gauge can set increment and decrement values", () => {
  const registry = createRegistry();
  const gauge = registry.gauge({ name: "tsundere_cache_entries", labels: ["store"] });
  gauge.set(10, { store: "global" }).inc(3, { store: "global" }).dec(2, { store: "global" });

  assert.match(registry.toPrometheus(), /tsundere_cache_entries\{store="global"\} 11/u);
});

test("histogram exports buckets sum and count", () => {
  const registry = createRegistry();
  const histogram = registry.histogram({
    name: "tsundere_command_duration_seconds",
    labels: ["command"],
    buckets: [0.1, 0.5, 1]
  });

  histogram.observe(0.2, { command: "ban" });
  histogram.observe(0.8, { command: "ban" });

  const output = registry.toPrometheus();
  assert.match(output, /tsundere_command_duration_seconds_bucket\{command="ban",le="0.5"\} 1/u);
  assert.match(output, /tsundere_command_duration_seconds_bucket\{command="ban",le="\+Inf"\} 2/u);
  assert.match(output, /tsundere_command_duration_seconds_sum\{command="ban"\} 1/u);
  assert.match(output, /tsundere_command_duration_seconds_count\{command="ban"\} 2/u);
});

test("metrics validate unknown labels", () => {
  const registry = createRegistry();
  const counter = registry.counter({ name: "tsundere_events_total", labels: ["event"] });

  assert.throws(() => counter.inc(1, { event: "ready", shard: "0" }), /Unknown metric labels/u);
});

test("default metrics include runtime and command metrics", () => {
  const registry = createDefaultMetrics();
  const output = registry.toPrometheus();

  assert.match(output, /tsundere_commands_total/u);
  assert.match(output, /tsundere_command_duration_seconds/u);
  assert.match(output, /tsundere_runtime_memory_bytes/u);
  assert.match(output, /tsundere_runtime_uptime_seconds/u);
});
