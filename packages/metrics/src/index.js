const METRIC_NAME = /^[a-zA-Z_:][a-zA-Z0-9_:]*$/u;
const LABEL_NAME = /^[a-zA-Z_][a-zA-Z0-9_]*$/u;

export class Registry {
  #metrics = new Map();

  counter(options) {
    return this.#register(new Counter(options));
  }

  gauge(options) {
    return this.#register(new Gauge(options));
  }

  histogram(options) {
    return this.#register(new Histogram(options));
  }

  collectRuntime(options = {}) {
    const prefix = options.prefix ?? "tsundere_runtime";
    const memory = process.memoryUsage();
    this.gauge({
      name: `${prefix}_memory_bytes`,
      help: "Node.js process memory usage in bytes.",
      labels: ["type"]
    }).set(memory.rss, { type: "rss" })
      .set(memory.heapUsed, { type: "heap_used" })
      .set(memory.heapTotal, { type: "heap_total" });

    this.gauge({
      name: `${prefix}_uptime_seconds`,
      help: "Node.js process uptime in seconds."
    }).set(process.uptime());

    return this;
  }

  metrics() {
    return [...this.#metrics.values()];
  }

  get(name) {
    return this.#metrics.get(name);
  }

  toPrometheus() {
    return this.metrics().map((metric) => metric.toPrometheus()).join("\n\n");
  }

  #register(metric) {
    if (this.#metrics.has(metric.name)) {
      return this.#metrics.get(metric.name);
    }
    this.#metrics.set(metric.name, metric);
    return metric;
  }
}

export class Counter {
  constructor(options) {
    this.name = validateMetricName(options.name);
    this.help = options.help ?? options.name;
    this.labels = validateLabelNames(options.labels ?? []);
    this.type = "counter";
    this.values = new Map();
  }

  inc(amount = 1, labels = {}) {
    if (amount < 0) {
      throw new Error("Counter increments must be non-negative.");
    }
    const key = labelKey(this.labels, labels);
    const current = this.values.get(key.id);
    this.values.set(key.id, {
      labels: key.labels,
      value: (current?.value ?? 0) + amount
    });
    return this;
  }

  toPrometheus() {
    return renderMetric(this, (entry) => `${this.name}${labelSuffix(entry.labels)} ${entry.value}`);
  }
}

export class Gauge {
  constructor(options) {
    this.name = validateMetricName(options.name);
    this.help = options.help ?? options.name;
    this.labels = validateLabelNames(options.labels ?? []);
    this.type = "gauge";
    this.values = new Map();
  }

  set(value, labels = {}) {
    const key = labelKey(this.labels, labels);
    this.values.set(key.id, { labels: key.labels, value });
    return this;
  }

  inc(amount = 1, labels = {}) {
    const key = labelKey(this.labels, labels);
    const current = this.values.get(key.id);
    this.values.set(key.id, {
      labels: key.labels,
      value: (current?.value ?? 0) + amount
    });
    return this;
  }

  dec(amount = 1, labels = {}) {
    return this.inc(-amount, labels);
  }

  toPrometheus() {
    return renderMetric(this, (entry) => `${this.name}${labelSuffix(entry.labels)} ${entry.value}`);
  }
}

export class Histogram {
  constructor(options) {
    this.name = validateMetricName(options.name);
    this.help = options.help ?? options.name;
    this.labels = validateLabelNames(options.labels ?? []);
    this.type = "histogram";
    this.buckets = [...(options.buckets ?? [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10])].sort((a, b) => a - b);
    this.values = new Map();
  }

  observe(value, labels = {}) {
    const key = labelKey(this.labels, labels);
    const state = this.values.get(key.id) ?? {
      labels: key.labels,
      count: 0,
      sum: 0,
      buckets: new Map(this.buckets.map((bucket) => [bucket, 0]))
    };
    state.count += 1;
    state.sum += value;
    for (const bucket of this.buckets) {
      if (value <= bucket) {
        state.buckets.set(bucket, state.buckets.get(bucket) + 1);
      }
    }
    this.values.set(key.id, state);
    return this;
  }

  time(labels = {}) {
    const started = performance.now();
    return () => {
      const seconds = (performance.now() - started) / 1000;
      this.observe(seconds, labels);
      return seconds;
    };
  }

  toPrometheus() {
    const lines = header(this);
    for (const state of this.values.values()) {
      for (const bucket of this.buckets) {
        lines.push(`${this.name}_bucket${labelSuffix(state.labels, { le: String(bucket) })} ${state.buckets.get(bucket)}`);
      }
      lines.push(`${this.name}_bucket${labelSuffix(state.labels, { le: "+Inf" })} ${state.count}`);
      lines.push(`${this.name}_sum${labelSuffix(state.labels)} ${state.sum}`);
      lines.push(`${this.name}_count${labelSuffix(state.labels)} ${state.count}`);
    }
    return lines.join("\n");
  }
}

export function createRegistry() {
  return new Registry();
}

export function createDefaultMetrics(options = {}) {
  const registry = new Registry();
  const prefix = options.prefix ?? "tsundere";

  registry.counter({
    name: `${prefix}_commands_total`,
    help: "Total Discord commands handled.",
    labels: ["command", "status"]
  });

  registry.histogram({
    name: `${prefix}_command_duration_seconds`,
    help: "Discord command execution duration in seconds.",
    labels: ["command"],
    buckets: [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5]
  });

  registry.counter({
    name: `${prefix}_events_total`,
    help: "Total Discord gateway events handled.",
    labels: ["event"]
  });

  registry.counter({
    name: `${prefix}_cache_operations_total`,
    help: "Total Tsundere cache operations.",
    labels: ["operation", "status"]
  });

  registry.histogram({
    name: `${prefix}_package_install_duration_seconds`,
    help: "Package manager install duration in seconds.",
    labels: ["manager"],
    buckets: [0.5, 1, 2.5, 5, 10, 30, 60]
  });

  registry.collectRuntime({ prefix: `${prefix}_runtime` });
  return registry;
}

function renderMetric(metric, renderValue) {
  const lines = header(metric);
  for (const entry of metric.values.values()) {
    lines.push(renderValue(entry));
  }
  return lines.join("\n");
}

function header(metric) {
  return [
    `# HELP ${metric.name} ${escapeHelp(metric.help)}`,
    `# TYPE ${metric.name} ${metric.type}`
  ];
}

function labelKey(labelNames, labels) {
  const unknown = Object.keys(labels).filter((label) => !labelNames.includes(label));
  if (unknown.length > 0) {
    throw new Error(`Unknown metric labels: ${unknown.join(", ")}`);
  }
  const normalized = labelNames.map((name) => [name, String(labels[name] ?? "")]);
  return {
    id: JSON.stringify(normalized),
    labels: normalized
  };
}

function labelSuffix(entries, extra = {}) {
  const labels = [...entries, ...Object.entries(extra)];
  if (labels.length === 0) {
    return "";
  }
  return `{${labels.map(([key, value]) => `${key}="${escapeLabel(value)}"`).join(",")}}`;
}

function validateMetricName(name) {
  if (!METRIC_NAME.test(name)) {
    throw new Error(`Invalid metric name: ${name}`);
  }
  return name;
}

function validateLabelNames(names) {
  for (const name of names) {
    if (!LABEL_NAME.test(name)) {
      throw new Error(`Invalid metric label name: ${name}`);
    }
  }
  return [...names];
}

function escapeHelp(value) {
  return String(value).replaceAll("\\", "\\\\").replaceAll("\n", "\\n");
}

function escapeLabel(value) {
  return String(value)
    .replaceAll("\\", "\\\\")
    .replaceAll("\n", "\\n")
    .replaceAll("\"", "\\\"");
}
