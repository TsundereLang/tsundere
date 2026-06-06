# Admin Command Examples

This folder shows moderation-shaped command metadata without shipping a complete moderation system.

Tsundere should help developers build their own moderation workflows by providing:

- typed command options
- permission hints
- intent diagnostics
- interaction helpers
- clean command discovery
- testable command modules

It should not hide moderation policy, storage, appeals, audit logging, or server-specific behavior behind a prebuilt framework.

## Example Shape

```yuri
import { Slash } from "@tsundere/discord"

export default Slash.command("ban")
  .description("Ban a member")
  .option("user", "target", "Member to ban", { required: true })
  .option("string", "reason", "Reason for the ban", { required: false })
  .permission("BanMembers")
  .guildOnly()
```

## Common Mistakes

- Do not forget role hierarchy checks.
- Do not assume the bot has required permissions in every guild.
- Do not store warning or moderation data only in memory for production bots.
- Do not expose admin commands in DMs.

## Related Documentation

- `docs/local/discord-intelligence.html`
- `docs/local/security.html`
- `docs/local/testing.html`
