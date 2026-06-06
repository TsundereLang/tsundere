# @tsundere/logger

Structured logging utilities for Tsundere projects.

This package is intentionally small and dependency-free. It gives Tsundere apps a consistent logging shape before deeper OpenTelemetry, Prometheus, Grafana, and Loki integrations land.

## Features

- `trace`
- `debug`
- `info`
- `warn`
- `error`
- `fatal`
- JSON output
- pretty development output
- nested secret redaction
- service metadata
- worker metadata
- shard metadata
- request IDs
- child loggers
- memory sink for tests

## Example

```js
import { createLogger } from "@tsundere/logger"

const log = createLogger({
  service: "community-bot",
  format: "json",
  metadata: {
    shardId: 0,
    workerId: "worker-1"
  },
  redact: ["DISCORD_TOKEN", "GITHUB_TOKEN"]
})

log.info("Bot online", {
  guilds: 12,
  token: "never-print-this"
})
```

## Child Loggers

```js
const commandLog = log.child({
  requestId: "cmd_01HX",
  command: "ban"
})

commandLog.warn("Permission check failed", {
  permission: "BanMembers"
})
```

## Testing

```js
import { createLogger, createMemorySink } from "@tsundere/logger"

const sink = createMemorySink()
const log = createLogger({ sink, format: "json" })

log.info("test")

console.log(sink.entries)
```
