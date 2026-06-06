# Tsundere Audit Notes

## Scope

This audit tracks security, optimization, maintainability, package-management, runtime, docs, and open-source readiness work across the Tsundere codebase.

## Completed In This Pass

- Added `src/security/path-safety.ts` for project-bounded path resolution and recursive deletion checks.
- Bounded compiler `source`, `outDir`, `.tsundere/runtime-build`, and bundled runtime refresh paths to the project root.
- Bounded CLI project creation, format, generate, generated types, and fingerprint inspection paths to the project root.
- Bounded command discovery directories and group overrides to the project root.
- Bounded Discord type cache cleanup and metadata reads to the project root.
- Bounded package hydration cleanup to the current project's `node_modules`.
- Replaced the Discord type extractor dynamic `new Function` import with normal dynamic import.
- Removed `shell: true` from Electron installer command/status execution and registry writes.
- Added stress testing for distributed runtime IPC, global events, cache, tasks, metrics, and Grafana output.
- Added tests for path traversal, unsafe delete prevention, compiler/config path safety, command discovery safety, type cache cleanup, and package hydration destination safety.
- Added `CONTRIBUTING.md`, `SECURITY.md`, and `docs/ARCHITECTURE.md`.

## Security Findings

### Fixed

- Config-driven compiler paths could point outside the project.
- CLI-generated paths could escape the project through `..`.
- Command discovery could scan outside the project through config.
- Discord type extraction used `new Function` for dynamic import.
- Package hydration fallback cleanup could delete an unchecked destination.
- Electron installer command execution used shell execution for fixed commands.

### Remaining

- PowerShell and shell installer scripts still need a full signed-release and checksum verification pass.
- Release scripts still contain broad `Remove-Item` usage that should be wrapped in explicit path checks.
- Windows uninstaller removes install/cache/config roots and needs additional guardrails for empty or broad paths.
- Electron installer install path validation should be strengthened before copy/remove operations.
- Updater downloads release assets by URL and should add checksum or signature verification when release metadata supports it.

## Performance Findings

### Improved

- Distributed runtime stress testing now reports total operations, operations per second, per-section timings, memory delta, cache hit rate, task executions, generated metrics size, and Grafana panel count.
- Distributed runtime event emitters now scale listener limits based on worker and shard plan size to reduce noisy warnings during simulated scale tests.

### Remaining

- Compiler build still scans all `.yuri` files on each build.
- Dev mode snapshot polling still rescans source trees.
- Discord type extraction can scan many declaration files and should cache by package version and lockfile before rebuilding the graph.
- Package optimizer hashes whole package directories; large packages may need incremental metadata or file-level cache indexes.
- CLI startup still imports most command handlers eagerly through `src/cli.ts`.

## Code Quality Findings

### Improved

- Shared path safety logic reduces duplicated deletion/path validation checks.
- Stress testing moved into `src/distributed/stress.ts` instead of bloating the CLI.
- New docs define current and target package responsibilities.

### Remaining

- `src/cli.ts` is still too large and should be split into command modules under a future `packages/cli`.
- `src/package-optimizer.ts` is still too large and should split store, lockfile, YAML, npm runner, and metrics responsibilities.
- `src/compiler/transpile.ts` remains regex-heavy and should move toward a real parser/AST.
- Package layout is still hybrid rather than fully moved to `packages/cli`, `packages/compiler`, `packages/runtime`, and `packages/shared`.

## Verification

Run:

```powershell
npm run test:unit
npm run stress:runtime
npm run stress:runtime:heavy
node dist/cli.js doctor
```

