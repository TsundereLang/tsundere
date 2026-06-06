import assert from "node:assert/strict";
import test from "node:test";
import { runSystemStressTest } from "../dist/stress/system.js";

const baseConfig = {
  name: "system-stress-test",
  source: "src",
  outDir: "build",
  target: "typescript",
  strict: true,
  sourceMaps: true
};

test("system stress tester exercises the major Tsundere feature surfaces", async () => {
  const report = await runSystemStressTest(baseConfig, {
    runtime: {
      iterations: 20,
      shards: 4,
      cacheEntries: 10,
      taskExecutions: 2,
      metricsSamples: 2,
      payloadBytes: 16
    },
    packageCount: 4,
    yuriFiles: 4,
    commandFiles: 3,
    buildRepeats: 1,
    packageHydrationRepeats: 1,
    updaterChecks: 2,
    docsCheck: false
  });
  assert.notEqual(report.status, "fail");
  assert.equal(report.tempRoot, "cleaned");
  assert.equal(report.checks.some((check) => check.name === "distributed runtime"), true);
  assert.equal(report.checks.some((check) => check.name === "compiler and command discovery"), true);
  assert.equal(report.checks.some((check) => check.name === "package optimizer"), true);
  assert.equal(report.checks.some((check) => check.name === "platform runtime checks"), true);
  assert.equal(report.checks.some((check) => check.name === "updater simulation"), true);
  assert.equal(report.operations > 0, true);
});
