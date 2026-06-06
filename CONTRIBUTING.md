# Contributing to Tsundere

Thanks for helping build Tsundere. This repo is early, but contributions should still be easy to review, safe to run, and clear about what changed.

## Setup

```powershell
npm install
npm run build
npm run test:unit
```

Useful checks:

```powershell
npm run stress:runtime
node dist/cli.js doctor
node dist/cli.js metrics doctor
```

## Repository Areas

- `src/cli.ts`: CLI command routing and project scaffolding.
- `src/compiler/`: Yuri transpilation, build output, runtime emission, protected builds.
- `src/discord/`: Bundled Discord wrapper runtime source.
- `src/platform/`: Cross-platform command, path, permission, and runtime checks.
- `src/package-optimizer.ts`: npm-compatible install optimization and Tsundere YAML lock/workspace generation.
- `src/distributed/`: Distributed runtime planning, metrics, IPC/cache/task primitives, and stress testing.
- `src/security/`: Shared security utilities for path and filesystem safety.
- `packages/discord/`: Published local Discord runtime package output.
- `packages/yurils/`: Yuri language server package.
- `packages/vscode-tsundere/`: VS Code extension.
- `packages/testing/`: Testing helpers.
- `docs/`: Local docs, architecture docs, and audit notes.
- `scripts/`: Release, installer, and runtime preparation scripts.
- `installer/`: Windows and Electron installer code.

## Pull Request Rules

- Keep changes scoped to one feature or fix.
- Add or update tests when behavior changes.
- Run `npm run test:unit` before opening a PR.
- Run `npm run stress:runtime` when touching `src/distributed`, package optimization, CLI startup, or cache code.
- Do not commit generated `dist/`, `node_modules/`, `.tsundere/`, `.yuri-cache/`, or local release artifacts unless the release process explicitly requires it.
- Do not mutate `package.json` from CLI code unless the command explicitly exists to do that.
- Preserve npm compatibility and `package-lock.json`.

## Security Expectations

- Keep file writes and deletes inside the intended project, store, or installer directory.
- Use `src/security/path-safety.ts` for project-bounded paths.
- Prefer `spawn(command, args, { shell: false })`.
- Never log tokens or secrets.
- Validate config-driven paths before scanning, copying, deleting, or writing.
- Treat installers and updaters as high-risk code.

## Release Workflow

1. Update version metadata.
2. Run `npm run test:unit`.
3. Run `npm run stress:runtime`.
4. Build release artifacts with `npm run dist:release`.
5. Use the GitHub release script or `gh release create` only after artifacts are verified.

