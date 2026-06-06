# Tsundere Examples

These examples are documentation companions. They are written as small `.yuri` files that show one idea at a time rather than full production bots.

Use them when you want to copy a pattern into a real project:

- `starter-bot.yuri` shows a small Discord bot entry point.
- `embeds.yuri` shows embed builder usage.
- `components.yuri` shows buttons and rows.
- `modal-flow.yuri` shows modal construction and handling shape.
- `collectors.yuri` shows collector utilities.
- `typed-router.yuri` shows interaction routing patterns.
- `logging.yuri` shows structured logger usage with request metadata.
- `slash-options.yuri` shows slash command option definitions.
- `rest-commands.yuri` shows REST helper usage.
- `sharding-and-gateway.yuri` shows gateway and sharding concepts.
- `webhook-thread-audit.yuri` shows webhook, thread, and audit helper ideas.
- `cache-and-helpers.yuri` shows cache and helper usage.
- `prefix-utils.yuri` shows prefix utility helpers without turning Tsundere into a full command framework.
- `type-bridge-notes.yuri` shows Discord type metadata design notes.

## How To Use An Example

Create a project:

```powershell
tsundere create my-bot --template discord
cd my-bot
```

Copy the example into `src` or adapt the relevant functions into your own files.

Run:

```powershell
tsundere install
tsundere dev
```

## Common Mistakes

- Do not paste every example into one file.
- Do not keep placeholder tokens or channel IDs.
- Do not enable message content code without the MessageContent intent.
- Do not treat examples as prebuilt bot systems.

## Related Documentation

- `docs/local/examples.html`
- `docs/local/discord.html`
- `docs/local/discord-layouts.html`
- `docs/local/testing.html`
