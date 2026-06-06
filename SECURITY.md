# Security Policy

## Supported Versions

Tsundere is pre-alpha. Security fixes should target the current `master` branch and any active release branch used for the next public build.

## Reporting a Vulnerability

Please report security issues privately before opening a public issue. Include:

- Affected command, package, installer, or workflow.
- Reproduction steps.
- Impact.
- Suggested fix if known.

Do not include real Discord tokens, GitHub tokens, npm tokens, or private bot secrets in reports.

## Security Rules for Contributors

- Keep project file operations inside the project root.
- Keep store cleanup inside the configured Tsundere store.
- Keep installer cleanup inside the selected install/config/cache directories.
- Avoid `shell: true` unless a command cannot work without it and the arguments are fixed.
- Do not use `eval` or `new Function`.
- Do not download and execute remote content without explicit version and integrity checks.
- Do not print `.env` values, Discord tokens, GitHub tokens, npm tokens, or telemetry payload secrets.
- Prefer least-privilege GitHub Actions permissions.
- Treat update, release, installer, and package-manager code as high-risk.

## Local Security Checks

```powershell
npm run test:unit
rg -n "eval\\(|new Function|shell:\\s*true|Remove-Item|rm\\(" src scripts updater installer packages
node dist/cli.js doctor
```

`tests/security-safety.test.mjs` covers path traversal and recursive deletion boundaries for the core Node code.

