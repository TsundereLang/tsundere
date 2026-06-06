# Security Policy

Security matters because Tsundere installs packages, runs generated code, manages release updates, handles Discord bot tokens, and ships installers.

## Supported Versions

Tsundere is pre-1.0. Security fixes are prioritized for the latest public release and the active development branch.

## Reporting A Vulnerability

Please do not open a public issue for sensitive security reports.

Send a private report to the maintainers through GitHub security advisories when available, or contact the project team through the Tsundere Discord and request a private maintainer channel.

Discord:

https://discord.gg/Gpxj5xVXBZ

## What To Include

- Affected version or commit.
- Operating system.
- Reproduction steps.
- Expected behavior.
- Actual behavior.
- Impact.
- Whether secrets, file deletion, command execution, updater behavior, installer behavior, or dependency resolution are involved.

## Security-Sensitive Areas

- Path cleanup and recursive deletion.
- Installer and uninstaller behavior.
- Updater downloads and release asset selection.
- Package cache validation.
- Shell command execution.
- Environment variable and secret handling.
- Discord token storage.
- Generated runtime output.
- Protected build output and source maps.

## Project Expectations

- Do not commit real `.env` files.
- Do not print tokens in logs.
- Do not delete user-created projects during uninstall or cleanup.
- Do not trust plugin source without review.
- Do not publish protected-build source maps unless intentionally private.
