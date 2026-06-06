const LEVELS = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60
};

const DEFAULT_REDACTION_KEYS = [
  "token",
  "password",
  "secret",
  "authorization",
  "apiKey",
  "api_key",
  "clientSecret",
  "client_secret",
  "webhook",
  "databaseUrl",
  "database_url"
];

export function createLogger(options = {}) {
  const state = {
    service: options.service ?? "tsundere",
    level: normalizeLevel(options.level ?? "info"),
    format: options.format ?? (process.env.NODE_ENV === "production" ? "json" : "pretty"),
    metadata: { ...(options.metadata ?? {}) },
    redact: [...DEFAULT_REDACTION_KEYS, ...(options.redact ?? [])],
    sink: options.sink ?? defaultSink
  };

  return buildLogger(state);
}

export const logger = createLogger;

export function createMemorySink() {
  const entries = [];
  return {
    entries,
    write(entry) {
      entries.push(entry);
    }
  };
}

export function redact(value, keys = DEFAULT_REDACTION_KEYS) {
  return redactValue(value, new Set(keys.map((key) => key.toLowerCase())));
}

function buildLogger(state) {
  const api = {
    child(metadata = {}) {
      return buildLogger({
        ...state,
        metadata: { ...state.metadata, ...metadata }
      });
    },
    log(level, message, fields = {}) {
      writeLog(state, normalizeLevel(level), message, fields);
    }
  };

  for (const level of Object.keys(LEVELS)) {
    api[level] = (message, fields = {}) => writeLog(state, level, message, fields);
  }

  return api;
}

function writeLog(state, level, message, fields) {
  if (LEVELS[level] < LEVELS[state.level]) {
    return;
  }

  const entry = redactValue({
    level,
    time: new Date().toISOString(),
    service: state.service,
    message,
    ...state.metadata,
    ...normalizeFields(fields)
  }, new Set(state.redact.map((key) => key.toLowerCase())));

  state.sink.write(formatEntry(entry, state.format), entry);
}

function normalizeFields(fields) {
  if (fields instanceof Error) {
    return {
      error: {
        name: fields.name,
        message: fields.message,
        stack: fields.stack
      }
    };
  }

  return fields && typeof fields === "object" ? fields : { value: fields };
}

function normalizeLevel(level) {
  if (!Object.hasOwn(LEVELS, level)) {
    throw new Error(`Unknown log level: ${level}`);
  }
  return level;
}

function formatEntry(entry, format) {
  if (format === "json") {
    return JSON.stringify(entry);
  }

  if (format !== "pretty") {
    throw new Error(`Unknown log format: ${format}`);
  }

  const meta = Object.entries(entry)
    .filter(([key]) => !["level", "time", "service", "message"].includes(key))
    .map(([key, value]) => `${key}=${formatValue(value)}`)
    .join(" ");
  const suffix = meta ? ` ${meta}` : "";
  return `${entry.time} ${entry.level.toUpperCase()} ${entry.service}: ${entry.message}${suffix}`;
}

function formatValue(value) {
  if (typeof value === "string") {
    return JSON.stringify(value);
  }
  return JSON.stringify(value);
}

function redactValue(value, keys) {
  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item, keys));
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const output = {};
  for (const [key, item] of Object.entries(value)) {
    output[key] = shouldRedact(key, keys) ? "[redacted]" : redactValue(item, keys);
  }
  return output;
}

function shouldRedact(key, keys) {
  const normalized = key.toLowerCase();
  for (const candidate of keys) {
    if (normalized === candidate || normalized.includes(candidate)) {
      return true;
    }
  }
  return false;
}

function defaultSink(line) {
  process.stdout.write(`${line}\n`);
}

defaultSink.write = defaultSink;
