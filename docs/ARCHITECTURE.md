# Tsundere Architecture

## Current Shape

Tsundere currently uses a hybrid layout:

```text
src/
  cli.ts
  compiler/
  commands/
  discord/
  distributed/
  platform/
  security/
  type-bridge/
packages/
  discord/
  testing/
  vscode-tsundere/
  yurils/
docs/
examples/
scripts/
assets/
.github/
```

The active TypeScript build compiles `src/` into `dist/`. Some package directories already exist, but compiler, CLI, runtime, distributed runtime, platform, package-manager, and shared utilities still live in `src/`.

## Responsibilities

- CLI: command routing, scaffolding, install/update wrappers, docs, doctor, metrics, stress commands.
- Compiler: `.yuri` transpilation, diagnostics, protected runtime builds, runtime output generation.
- Discord runtime: Tsundere wrapper API and Discord.js compatibility layer.
- Distributed runtime: scale planning, simulated shards, IPC/events/cache/tasks, metrics, Grafana export, stress reports.
- Platform: OS detection, command lookup, path expansion, permissions, Linux/macOS/Windows storage locations.
- Package optimizer: npm-compatible package install optimization, global store validation, hardlink/copy materialization, YAML workspace/lock snapshots.
- Type bridge: Discord type extraction, IntelliSense metadata, type cache generation.
- Security: shared path safety and filesystem boundary helpers.
- Stress: disposable fixture-based runtime, compiler, package optimizer, platform, updater, and docs surface stress checks.

## Target Package Layout

The long-term package split should move toward:

```text
packages/
  cli/
  compiler/
  runtime/
  discord/
  yurils/
  vscode-extension/
  shared/
  testing/
docs/
examples/
scripts/
assets/
.github/
```

Recommended migration order:

1. Move platform, security, formatting, and path utilities into `packages/shared`.
2. Move compiler modules into `packages/compiler`.
3. Move distributed runtime modules into `packages/runtime`.
4. Move CLI command handlers into `packages/cli`.
5. Keep `packages/discord`, `packages/yurils`, `packages/vscode-tsundere`, and `packages/testing` as package-owned surfaces.
6. Update exports, build references, tests, docs, and release scripts after each package move.

## Boundary Rules

- Package code should not reach into another package's private files.
- Shared helpers belong in `packages/shared` or, during migration, `src/security` and `src/platform`.
- Runtime code must not depend on CLI code.
- Compiler code must not depend on installer or release scripts.
- Package optimizer code must preserve npm behavior and `package-lock.json`.
- Installer code must not depend on project source internals.

## Verification

Use these commands after structural changes:

```powershell
npm run build
npm run test:unit
npm run stress:runtime
npm run stress:system
node dist/cli.js doctor
node dist/cli.js inspect
```
