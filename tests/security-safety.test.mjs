import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { buildProject } from "../dist/compiler/project.js";
import { discoverCommands } from "../dist/commands/discovery.js";
import { cleanDiscordTypes } from "../dist/type-bridge/cache.js";
import { assertSafeRemove, isPathInside, removeInside, resolveInside } from "../dist/security/path-safety.js";

const baseConfig = {
  name: "security-fixture",
  source: "src",
  outDir: "build",
  target: "typescript",
  strict: true,
  sourceMaps: true
};

test("path safety rejects traversal outside the project root", async () => {
  const root = await mkdtemp(join(tmpdir(), "tsundere-path-safe-"));
  assert.equal(isPathInside(root, join(root, "src", "main.yuri")), true);
  assert.throws(() => resolveInside(root, "..", "bad path"), /must stay inside/u);
  assert.throws(() => assertSafeRemove(root, root, "project root"), /Refusing to remove/u);
  await mkdir(join(root, "safe"), { recursive: true });
  await writeFile(join(root, "safe", "file.txt"), "ok\n", "utf8");
  await removeInside(root, join(root, "safe"), "safe child");
  assert.equal(existsSync(join(root, "safe")), false);
  await rm(root, { recursive: true, force: true });
});

test("compiler rejects source and output directories outside the project", async () => {
  const root = await mkdtemp(join(tmpdir(), "tsundere-build-safe-"));
  await mkdir(join(root, "src"), { recursive: true });
  await writeFile(join(root, "src", "main.yuri"), "export const value = 1\n", "utf8");
  await assert.rejects(() => buildProject({ ...baseConfig, outDir: "../outside" }, root, { emitRuntime: false }), /output directory must stay inside/u);
  await assert.rejects(() => buildProject({ ...baseConfig, source: "../outside" }, root, { emitRuntime: false }), /source directory must stay inside/u);
  await rm(root, { recursive: true, force: true });
});

test("command discovery rejects directories outside the project", async () => {
  const root = await mkdtemp(join(tmpdir(), "tsundere-command-safe-"));
  await assert.rejects(() => discoverCommands({
    ...baseConfig,
    commands: {
      discovery: true,
      routeBased: true,
      directory: "../commands"
    }
  }, root), /command discovery directory must stay inside/u);
  await rm(root, { recursive: true, force: true });
});

test("type cache cleanup only removes the project cache folder", async () => {
  const root = await mkdtemp(join(tmpdir(), "tsundere-type-cache-safe-"));
  const outside = join(root, "..", "outside-cache-marker.txt");
  await mkdir(join(root, ".yuri-cache"), { recursive: true });
  await writeFile(join(root, ".yuri-cache", "discord.cache.json"), "{}\n", "utf8");
  await writeFile(outside, "keep\n", "utf8");
  await cleanDiscordTypes(root);
  assert.equal(existsSync(join(root, ".yuri-cache")), false);
  assert.equal(await readFile(outside, "utf8"), "keep\n");
  await rm(root, { recursive: true, force: true });
  await rm(outside, { force: true });
});
