# Command Examples

This folder contains command-file examples for Tsundere command discovery.

Command files should usually export one command definition:

```yuri
import { Slash } from "@tsundere/discord"

export default Slash.command("ping")
  .description("Check bot latency")
```

## Layout

```text
src/
  commands/
    ping.yuri
    avatar.yuri
    admin/
      ban.yuri
```

With route-based discovery enabled, nested folders can become command groups.

With route-based discovery disabled, the command name exported inside the file is used.

## Best Practices

- Keep command metadata close to the command file.
- Put reusable logic in `src/services`.
- Test command metadata separately from handler logic.
- Prefer guild command sync during development and global sync for production bots.

## Related Documentation

- `docs/local/discord.html`
- `docs/local/discord-layouts.html`
- `docs/local/compiler.html`
