import { performance } from "node:perf_hooks";
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import type { TsundereConfig } from "../types.js";
import { buildProject } from "../compiler/project.js";
import { writeCommandManifest } from "../commands/discovery.js";
import { currentPlatform, platformLabel, runtimeChecks, tsunderePaths } from "../platform/index.js";
import { compareVersions, latestRelease, selfUpdate } from "../updater.js";
import { harvestProjectPackages, hydrateCachedPackages, pruneStore, resolveInstallConfig, syncTsunderePackageFiles } from "../package-optimizer.js";
import { runRuntimeStressTest, type RuntimeStressOptions } from "../distributed/stress.js";

export interface SystemStressOptions {
  runtime?: RuntimeStressOptions;
  packageCount?: number;
  yuriFiles?: number;
  commandFiles?: number;
  buildRepeats?: number;
  packageHydrationRepeats?: number;
  updaterChecks?: number;
  docsCheck?: boolean;
  keepTemp?: boolean;
}

export interface SystemStressCheck {
  name: string;
  status: "pass" | "warn" | "fail";
  operations: number;
  durationMs: number;
  operationsPerSecond: number;
  details: Record<string, string | number | boolean>;
  warnings: string[];
}

export interface SystemStressReport {
  status: "pass" | "warn" | "fail";
  tempRoot: string;
  durationMs: number;
  operations: number;
  operationsPerSecond: number;
  memory: {
    beforeBytes: number;
    afterBytes: number;
    deltaBytes: number;
  };
  checks: SystemStressCheck[];
  warnings: string[];
}

interface PackageFixture {
  project: string;
  store: string;
  entries: Parameters<typeof harvestProjectPackages>[0];
}

export async function runSystemStressTest(config: TsundereConfig, options: SystemStressOptions = {}, cwd = process.cwd()): Promise<SystemStressReport> {
  const stressOptions = normalizeSystemStressOptions(options);
  const tempRoot = await mkdtemp(join(tmpdir(), "tsundere-system-stress-"));
  const memoryBefore = process.memoryUsage().heapUsed;
  const started = performance.now();
  const checks: SystemStressCheck[] = [];
  try {
    checks.push(await measureCheck("distributed runtime", async () => runtimeCheck(config, stressOptions)));
    checks.push(await measureCheck("compiler and command discovery", async () => compilerCheck(tempRoot, stressOptions)));
    checks.push(await measureCheck("package optimizer", async () => packageOptimizerCheck(tempRoot, stressOptions)));
    checks.push(await measureCheck("platform runtime checks", async () => platformCheck()));
    checks.push(await measureCheck("updater simulation", async () => updaterCheck(stressOptions)));
    if (stressOptions.docsCheck) {
      checks.push(await measureCheck("local docs surface", async () => docsCheck(cwd)));
    }
  } finally {
    if (!stressOptions.keepTemp) {
      await rm(tempRoot, { recursive: true, force: true });
    }
  }
  const durationMs = performance.now() - started;
  const operations = checks.reduce((total, check) => total + check.operations, 0);
  const warnings = checks.flatMap((check) => check.warnings.map((warning) => `${check.name}: ${warning}`));
  const memoryAfter = process.memoryUsage().heapUsed;
  return {
    status: checks.some((check) => check.status === "fail") ? "fail" : checks.some((check) => check.status === "warn") ? "warn" : "pass",
    tempRoot: stressOptions.keepTemp ? tempRoot : "cleaned",
    durationMs,
    operations,
    operationsPerSecond: rate(operations, durationMs),
    memory: {
      beforeBytes: memoryBefore,
      afterBytes: memoryAfter,
      deltaBytes: memoryAfter - memoryBefore
    },
    checks,
    warnings
  };
}

function normalizeSystemStressOptions(options: SystemStressOptions): Required<SystemStressOptions> {
  return {
    runtime: options.runtime ?? {},
    packageCount: positiveInteger(options.packageCount, 40),
    yuriFiles: positiveInteger(options.yuriFiles, 25),
    commandFiles: positiveInteger(options.commandFiles, 12),
    buildRepeats: positiveInteger(options.buildRepeats, 2),
    packageHydrationRepeats: positiveInteger(options.packageHydrationRepeats, 2),
    updaterChecks: positiveInteger(options.updaterChecks, 5),
    docsCheck: options.docsCheck ?? true,
    keepTemp: options.keepTemp ?? false
  };
}

async function measureCheck(name: string, run: () => Promise<Omit<SystemStressCheck, "name" | "durationMs" | "operationsPerSecond">>): Promise<SystemStressCheck> {
  const started = performance.now();
  try {
    const result = await run();
    const durationMs = performance.now() - started;
    return {
      name,
      ...result,
      durationMs,
      operationsPerSecond: rate(result.operations, durationMs)
    };
  } catch (error) {
    const durationMs = performance.now() - started;
    return {
      name,
      status: "fail",
      operations: 0,
      durationMs,
      operationsPerSecond: 0,
      details: {
        error: error instanceof Error ? error.message : String(error)
      },
      warnings: []
    };
  }
}

async function runtimeCheck(config: TsundereConfig, options: Required<SystemStressOptions>): Promise<Omit<SystemStressCheck, "name" | "durationMs" | "operationsPerSecond">> {
  const report = await runRuntimeStressTest(config, options.runtime);
  return {
    status: report.status,
    operations: report.operations,
    details: {
      workers: report.plan.workers,
      shards: report.plan.shards,
      ipcDelivered: report.ipcDelivered,
      globalEventsDelivered: report.globalEventsDelivered,
      cacheEntries: report.cacheEntries,
      cacheHitRatePercent: Number((report.cacheHitRate * 100).toFixed(2)),
      taskExecutions: report.taskExecutions,
      metricsBytes: report.metricsBytes,
      grafanaPanels: report.grafanaPanelCount
    },
    warnings: report.warnings
  };
}

async function compilerCheck(root: string, options: Required<SystemStressOptions>): Promise<Omit<SystemStressCheck, "name" | "durationMs" | "operationsPerSecond">> {
  const project = join(root, "compiler-project");
  const source = join(project, "src");
  const commands = join(source, "commands");
  await mkdir(commands, { recursive: true });
  await writeFile(join(project, "package.json"), `${JSON.stringify({ name: "compiler-stress", type: "module" }, null, 2)}\n`, "utf8");
  for (let index = 0; index < options.yuriFiles; index += 1) {
    await writeFile(join(source, `module-${index}.yuri`), yuriModule(index), "utf8");
  }
  for (let index = 0; index < options.commandFiles; index += 1) {
    const group = join(commands, `group-${index % 4}`);
    await mkdir(group, { recursive: true });
    await writeFile(join(group, `cmd-${index}.yuri`), yuriCommand(index), "utf8");
  }
  await writeFile(join(source, "main.yuri"), `import { value0 } from "./module-0"\nlog(value0(1))\n`, "utf8");
  const projectConfig: TsundereConfig = {
    name: "compiler-stress",
    source: "src",
    outDir: "build",
    target: "typescript",
    strict: true,
    sourceMaps: true,
    commands: {
      discovery: true,
      routeBased: true,
      directory: "./src/commands"
    }
  };
  let buildCode = 0;
  for (let index = 0; index < options.buildRepeats; index += 1) {
    buildCode = await buildProject(projectConfig, project);
    if (buildCode !== 0) {
      break;
    }
  }
  const manifest = await writeCommandManifest(projectConfig, project);
  const runtimeEntry = join(project, ".tsundere", "runtime-build", "main.js");
  const expectedFiles = options.yuriFiles + options.commandFiles + 1;
  const warnings = [];
  if (buildCode !== 0) {
    warnings.push(`build exited with ${buildCode}`);
  }
  if (manifest.commands.length !== options.commandFiles) {
    warnings.push(`discovered ${manifest.commands.length} of ${options.commandFiles} commands`);
  }
  if (!existsSync(runtimeEntry)) {
    warnings.push("runtime entry was not emitted");
  }
  return {
    status: warnings.length > 0 ? "warn" : "pass",
    operations: expectedFiles * options.buildRepeats + manifest.commands.length,
    details: {
      yuriFiles: options.yuriFiles,
      commandFiles: options.commandFiles,
      buildRepeats: options.buildRepeats,
      discoveredCommands: manifest.commands.length,
      runtimeEntry: existsSync(runtimeEntry)
    },
    warnings
  };
}

async function packageOptimizerCheck(root: string, options: Required<SystemStressOptions>): Promise<Omit<SystemStressCheck, "name" | "durationMs" | "operationsPerSecond">> {
  const fixture = await createPackageFixture(root, options.packageCount);
  const installConfig = resolveInstallConfig({ storePath: fixture.store, linkMode: "copy", strictDependencies: true, themeLogs: false }, fixture.project);
  const harvest = await harvestProjectPackages(fixture.entries, installConfig);
  await syncTsunderePackageFiles(fixture.project, installConfig, fixture.entries);
  const workspaceExists = existsSync(join(fixture.project, "tsundere-workspace.yaml"));
  const lockExists = existsSync(join(fixture.project, "tsundere-lock.yaml"));
  let reused = 0;
  let copied = 0;
  let linked = 0;
  for (let index = 0; index < options.packageHydrationRepeats; index += 1) {
    await rm(join(fixture.project, "node_modules"), { recursive: true, force: true });
    const hydrated = await hydrateCachedPackages(fixture.entries, installConfig, fixture.project);
    reused += hydrated.reused;
    copied += hydrated.copied;
    linked += hydrated.linked;
  }
  await rm(join(fixture.project, "node_modules"), { recursive: true, force: true });
  const metadataPaths = await findMetadataPaths(fixture.store);
  let corruptMisses = 0;
  const firstEntry = fixture.entries[0];
  if (metadataPaths[0] && firstEntry) {
    const metadata = JSON.parse(await readFile(metadataPaths[0], "utf8")) as Record<string, unknown>;
    await writeFile(metadataPaths[0], `${JSON.stringify({ ...metadata, directoryHash: "corrupt" }, null, 2)}\n`, "utf8");
    const corrupt = await hydrateCachedPackages([firstEntry], installConfig, fixture.project);
    corruptMisses = corrupt.corrupt;
  }
  const prune = await pruneStore(installConfig, fixture.project);
  const warnings = [];
  if (harvest.stored !== options.packageCount) {
    warnings.push(`stored ${harvest.stored} of ${options.packageCount} packages`);
  }
  if (reused < options.packageCount) {
    warnings.push(`reused ${reused} packages across hydration passes`);
  }
  if (!workspaceExists || !lockExists) {
    warnings.push("Tsundere YAML workspace or lock file was not written");
  }
  if (options.packageCount > 0 && corruptMisses !== 1) {
    warnings.push("corrupt cache validation did not report one corrupt entry");
  }
  if (prune.removedEntries < 1) {
    warnings.push("store prune did not remove unreferenced entries");
  }
  return {
    status: warnings.length > 0 ? "warn" : "pass",
    operations: options.packageCount * (options.packageHydrationRepeats + 2),
    details: {
      packages: options.packageCount,
      stored: harvest.stored,
      reused,
      copied,
      linked,
      workspaceYaml: workspaceExists,
      lockYaml: lockExists,
      corruptEntries: corruptMisses,
      prunedEntries: prune.removedEntries,
      prunedBytes: prune.removedBytes
    },
    warnings
  };
}

async function platformCheck(): Promise<Omit<SystemStressCheck, "name" | "durationMs" | "operationsPerSecond">> {
  const checks = await runtimeChecks();
  const paths = tsunderePaths();
  const missing = checks.filter((check) => !check.available);
  return {
    status: missing.length > 0 ? "warn" : "pass",
    operations: checks.length + 4,
    details: {
      platform: platformLabel(currentPlatform()),
      node: checks.find((check) => check.name === "node")?.available ?? false,
      npm: checks.find((check) => check.name === "npm")?.available ?? false,
      home: paths.root,
      cache: paths.cache,
      store: paths.store,
      logs: paths.logs
    },
    warnings: missing.map((check) => `${check.name} was not found via ${check.command}`)
  };
}

async function updaterCheck(options: Required<SystemStressOptions>): Promise<Omit<SystemStressCheck, "name" | "durationMs" | "operationsPerSecond">> {
  const fetchImpl: typeof fetch = async () => new Response(JSON.stringify({
    tag_name: "v9.9.9",
    html_url: "https://github.com/TsundereLang/tsundere/releases/tag/v9.9.9",
    assets: [
      {
        name: "tsundere-cli-9.9.9.tgz",
        browser_download_url: "https://example.invalid/tsundere-cli-9.9.9.tgz"
      }
    ],
    body: "security hotfix"
  }), { status: 200 });
  let latestVersion = "";
  for (let index = 0; index < options.updaterChecks; index += 1) {
    const release = await latestRelease("TsundereLang/tsundere", "0.1.1", fetchImpl);
    latestVersion = release?.version ?? "";
  }
  const dryRun = await selfUpdate({
    currentVersion: "0.1.1",
    repo: "TsundereLang/tsundere",
    dryRun: true,
    fetchImpl
  });
  const compare = compareVersions("9.9.9", "0.1.1");
  const warnings = [];
  if (latestVersion !== "9.9.9") {
    warnings.push("latest release simulation did not return 9.9.9");
  }
  if (dryRun.code !== 0 || !dryRun.asset) {
    warnings.push("self-update dry run did not select a CLI tarball asset");
  }
  if (compare <= 0) {
    warnings.push("version comparison did not detect a newer release");
  }
  return {
    status: warnings.length > 0 ? "warn" : "pass",
    operations: options.updaterChecks + 2,
    details: {
      latestVersion,
      dryRunCode: dryRun.code,
      selectedAsset: dryRun.asset?.name ?? "none",
      compareNewer: compare > 0
    },
    warnings
  };
}

async function docsCheck(cwd: string): Promise<Omit<SystemStressCheck, "name" | "durationMs" | "operationsPerSecond">> {
  const files = [
    "docs/local/index.html",
    "docs/local/cli.html",
    "docs/local/discord.html",
    "docs/local/templates.html",
    "docs/local/examples.html",
    "README.md",
    "docs/ARCHITECTURE.md"
  ];
  const missing = files.filter((file) => !existsSync(resolve(cwd, file)));
  return {
    status: missing.length > 0 ? "warn" : "pass",
    operations: files.length,
    details: {
      checkedFiles: files.length,
      missingFiles: missing.length
    },
    warnings: missing.map((file) => `missing ${file}`)
  };
}

async function createPackageFixture(root: string, count: number): Promise<PackageFixture> {
  const project = join(root, "package-project");
  const store = join(root, "store");
  await mkdir(project, { recursive: true });
  const dependencies: Record<string, string> = {};
  const packages: Record<string, unknown> = {
    "": {
      name: "package-stress",
      version: "1.0.0",
      dependencies
    }
  };
  const entries: PackageFixture["entries"] = [];
  for (let index = 0; index < count; index += 1) {
    const name = `stress-pkg-${index}`;
    const version = `1.0.${index}`;
    const lockPath = `node_modules/${name}`;
    dependencies[name] = version;
    packages[lockPath] = {
      version,
      resolved: `https://registry.npmjs.org/${name}/-/${name}-${version}.tgz`,
      integrity: `sha512-stress-${index}`
    };
    const diskPath = join(project, "node_modules", name);
    entries.push({
      name,
      version,
      integrity: `sha512-stress-${index}`,
      lockPath,
      diskPath,
      direct: true
    });
    await mkdir(diskPath, { recursive: true });
    await writeFile(join(diskPath, "package.json"), `${JSON.stringify({ name, version }, null, 2)}\n`, "utf8");
    await writeFile(join(diskPath, "index.js"), `export const id = ${index}\n`, "utf8");
  }
  await writeFile(join(project, "package.json"), `${JSON.stringify({
    name: "package-stress",
    version: "1.0.0",
    packageManager: "npm@10.0.0",
    dependencies
  }, null, 2)}\n`, "utf8");
  await writeFile(join(project, "package-lock.json"), `${JSON.stringify({
    name: "package-stress",
    lockfileVersion: 3,
    packages
  }, null, 2)}\n`, "utf8");
  return { project, store, entries };
}

async function findMetadataPaths(root: string): Promise<string[]> {
  const found: string[] = [];
  await findMetadataPathsInner(root, found);
  return found;
}

async function findMetadataPathsInner(root: string, found: string[]): Promise<void> {
  if (!existsSync(root)) {
    return;
  }
  const entries = await readdir(root, { withFileTypes: true });
  for (const entry of entries) {
    const child = join(root, entry.name);
    if (entry.isFile() && entry.name === "metadata.json") {
      found.push(child);
    }
    if (entry.isDirectory()) {
      await findMetadataPathsInner(child, found);
    }
  }
}

function yuriModule(index: number): string {
  return `export function value${index}(input: number): number {
  if (input > ${index}) {
    log("module ${index}")
    return input + ${index}
  }
  return ${index}
}
`;
}

function yuriCommand(index: number): string {
  return `import { Slash } from "@tsundere/discord"

export const command = Slash.command("cmd-${index}")
  .description("Stress command ${index}")
`;
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
