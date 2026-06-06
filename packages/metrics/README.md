# @tsundere/metrics

Prometheus-style metrics utilities for Tsundere projects.

This package gives Tsundere apps a small dependency-free metrics layer for counters, gauges, histograms, runtime memory, uptime, command latency, event counts, cache operations, and package manager timings.

## Example

```js
import { createDefaultMetrics } from "@tsundere/metrics"

const metrics = createDefaultMetrics()
const commands = metrics.get("tsundere_commands_total")

commands.inc(1, {
  command: "ping",
  status: "ok"
})

console.log(metrics.toPrometheus())
```

## Custom Registry

```js
import { createRegistry } from "@tsundere/metrics"

const registry = createRegistry()
const duration = registry.histogram({
  name: "tsundere_command_duration_seconds",
  help: "Command execution duration.",
  labels: ["command"],
  buckets: [0.05, 0.1, 0.25, 0.5, 1]
})

const stop = duration.time({ command: "ping" })
await runCommand()
stop()
```

## Export

Expose `registry.toPrometheus()` from your HTTP server at `/metrics` for Prometheus scraping.
