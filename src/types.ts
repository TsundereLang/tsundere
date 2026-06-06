export type TsundereTarget = "javascript" | "typescript";
export type ProtectProfile = "standard" | "advanced" | "maximum";
export type RuntimeKind = "node" | "bun" | "deno" | "cloudflare" | "vercel" | "netlify" | "aws-lambda" | "azure-functions";
export type RuntimeScaleMode = "off" | "auto" | "manual";
export type RuntimeMetricFormat = "prometheus" | "json";
export type RuntimeCacheBackend = "memory" | "redis" | "valkey" | "custom";

export interface TsundereConfig {
  name: string;
  source: string;
  outDir: string;
  target: TsundereTarget;
  strict: boolean;
  sourceMaps: boolean;
  storePath?: string;
  linkMode?: "auto" | "hardlink" | "copy";
  strictDependencies?: boolean;
  themeLogs?: boolean;
  runtime?: RuntimeKind | RuntimeConfig;
  plugins?: string[];
  enterprise?: {
    monorepo?: boolean;
    workspaceRoot?: string;
    internalRegistry?: string;
    productionOptimizations?: boolean;
  };
  discord?: {
    tokenEnv?: string;
    defaultIntents?: string[];
  };
  commands?: CommandDiscoveryConfig;
  diagnostics?: DiagnosticConfig;
}

export interface RuntimeConfig {
  target?: RuntimeKind;
  scale?: RuntimeScaleMode | "auto";
  workers?: number | "auto";
  shards?: number | "auto";
  simulateShards?: number;
  redis?: string;
  cache?: {
    backend?: RuntimeCacheBackend;
    namespace?: string;
  };
  metrics?: {
    enabled?: boolean;
    port?: number;
    path?: string;
    format?: RuntimeMetricFormat;
  };
  tracing?: {
    enabled?: boolean;
    provider?: "opentelemetry" | "none" | string;
  };
}

export interface DiagnosticConfig {
  warnings?: boolean;
  verbose?: boolean;
  color?: boolean;
  disabled?: string[];
}

export interface CommandDiscoveryConfig {
  discovery?: boolean;
  routeBased?: boolean;
  directory?: string;
  groups?: Record<string, CommandGroupOverride>;
}

export interface CommandGroupOverride {
  routeBased?: boolean;
  groupName?: string;
}

export interface CompileOptions {
  filename: string;
  source: string;
  target: TsundereTarget;
  sourceMaps: boolean;
  strict: boolean;
}

export interface CompileResult {
  code: string;
  map?: string;
  diagnostics: Diagnostic[];
}

export interface Diagnostic {
  code: string;
  message: string;
  filename: string;
  line: number;
  column: number;
  severity: "error" | "warning";
  hint?: string;
}
