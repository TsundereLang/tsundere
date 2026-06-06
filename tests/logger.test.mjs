import test from "node:test";
import assert from "node:assert/strict";
import { createLogger, createMemorySink, redact } from "../packages/logger/src/index.js";

test("logger writes JSON entries with metadata", () => {
  const sink = createMemorySink();
  const log = createLogger({
    service: "bot",
    format: "json",
    sink,
    metadata: {
      shardId: 2,
      workerId: "worker-a"
    }
  });

  log.info("online", { guilds: 3 });

  assert.equal(sink.entries.length, 1);
  const entry = JSON.parse(sink.entries[0]);
  assert.equal(entry.level, "info");
  assert.equal(entry.service, "bot");
  assert.equal(entry.message, "online");
  assert.equal(entry.shardId, 2);
  assert.equal(entry.workerId, "worker-a");
  assert.equal(entry.guilds, 3);
});

test("logger filters below configured level", () => {
  const sink = createMemorySink();
  const log = createLogger({ level: "warn", sink });

  log.info("ignored");
  log.warn("kept");

  assert.equal(sink.entries.length, 1);
  assert.match(sink.entries[0], /kept/u);
});

test("logger redacts nested secrets", () => {
  const value = redact({
    token: "abc",
    nested: {
      githubToken: "def",
      safe: "visible"
    }
  });

  assert.equal(value.token, "[redacted]");
  assert.equal(value.nested.githubToken, "[redacted]");
  assert.equal(value.nested.safe, "visible");
});

test("child logger merges request metadata", () => {
  const sink = createMemorySink();
  const log = createLogger({
    service: "bot",
    level: "debug",
    format: "json",
    sink,
    metadata: { shardId: 0 }
  });

  log.child({ requestId: "cmd_1", command: "ping" }).debug("started");

  const entry = JSON.parse(sink.entries[0]);
  assert.equal(entry.shardId, 0);
  assert.equal(entry.requestId, "cmd_1");
  assert.equal(entry.command, "ping");
});

test("logger serializes errors", () => {
  const sink = createMemorySink();
  const log = createLogger({ format: "json", sink });

  log.error("failed", new Error("boom"));

  const entry = JSON.parse(sink.entries[0]);
  assert.equal(entry.error.name, "Error");
  assert.equal(entry.error.message, "boom");
});
