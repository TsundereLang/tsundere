# Contributing to Tsundere

Thanks for helping build Tsundere.

Tsundere is early, fast-moving, and intentionally practical. The project goal is to make `.yuri` development feel like a serious language ecosystem with excellent Discord tooling, Node compatibility, strong docs, and a welcoming contributor path.

## Good First Contributions

- Improve documentation clarity.
- Add examples with small READMEs.
- Fix confusing compiler errors.
- Add tests around package manager, updater, installer, or runtime behavior.
- Improve Discord IntelliSense metadata.
- Improve VS Code and Cursor extension behavior.

## Development Setup

```powershell
npm install
npm run build
npm run test:unit
```

For local CLI testing:

```powershell
node dist/cli.js help
node dist/cli.js build
```

## Repository Areas

- `src` contains the CLI, compiler, package manager, updater, and runtime tooling.
- `packages/discord` contains the bundled Discord runtime wrapper.
- `packages/yurils` contains language server work.
- `packages/vscode-tsundere` contains editor integration.
- `docs/local` contains local HTML documentation.
- `docs/examples` contains `.yuri` examples.
- `installer` contains Windows and Electron installer work.
- `templates` contains project starters.

## Pull Request Expectations

- Keep changes focused.
- Add or update docs for user-facing behavior.
- Add tests for compiler, package manager, updater, runtime, or security-sensitive changes.
- Do not commit real tokens, local `.env` files, generated caches, VSIX files, tarballs, or release output.
- Explain what changed and how it was verified.

## Code Style

- Prefer small, boring functions.
- Keep generated output out of source logic.
- Preserve npm and Node compatibility.
- Avoid prebuilt bot systems in core Tsundere.
- Favor useful diagnostics over clever abstractions.

## Documentation Style

Every major doc page should include:

- Overview
- Why it exists
- When to use it
- Examples
- Advanced examples
- Common mistakes
- Performance notes
- Related documentation

## Community

Join the Discord:

https://discord.gg/Gpxj5xVXBZ
