import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, "docs", "local", "book");
const author = {
  name: "Luckyz",
  avatar: "https://cdn.discordapp.com/avatars/1212798448525512785/3939e4e22234f3e7ce8247988ad43d3d.webp?size=1536"
};

const cliDetails = {
  create: {
    syntax: "tsundere create <name> [--template <template>]",
    purpose: "Scaffold a new Tsundere project with a starter layout, local runtime configuration, package metadata, and example .yuri files.",
    workflow: "Choose a template, create the project, install dependencies, then run `tsundere dev` from the new folder.",
    flags: ["--template discord", "--template empty", "--template cli", "--template rest", "--template websocket"],
    example: "tsundere create my-bot --template discord\ncd my-bot\ntsundere install\ntsundere dev",
    troubleshoot: "If creation succeeds but dependencies fail, run `tsundere install` again from the generated project root."
  },
  dev: {
    syntax: "tsundere dev",
    purpose: "Compile, run, watch, and restart a .yuri project during local development.",
    workflow: "Start it from the project root after `.env` and `tsundere.config.json` are ready. It watches source files and restarts the runtime build when they change.",
    flags: ["--no-sync", "--warnings=false", "--verbose"],
    example: "tsundere dev\n# edit src/main.yuri\n# the runtime rebuilds and restarts",
    troubleshoot: "If the process does not restart, confirm the source directory in `tsundere.config.json` points at the folder you are editing."
  },
  build: {
    syntax: "tsundere build [--protect <profile>]",
    purpose: "Compile .yuri source into runnable JavaScript or TypeScript output and prepare runtime artifacts.",
    workflow: "Run before deployment, CI checks, or `tsundere start`. Treat diagnostics as build feedback, not runtime noise.",
    flags: ["--protect standard", "--protect advanced", "--source-maps=false"],
    example: "tsundere build\nls build\nls .tsundere/runtime-build",
    troubleshoot: "If imports fail after build, run `tsundere runtime install` and `tsundere install` so the local @tsundere/discord package exists."
  },
  start: {
    syntax: "tsundere start",
    purpose: "Run the latest compiled runtime output through the Tsundere runtime entrypoint.",
    workflow: "Use it after `tsundere build` in production or smoke tests so users do not manually call `node build/main.ts`.",
    flags: ["--env <file>", "--check-updates=false"],
    example: "tsundere build\ntsundere start",
    troubleshoot: "If startup says the runtime build is missing, run `tsundere build` first."
  },
  install: {
    syntax: "tsundere install",
    purpose: "Install project dependencies with the Tsundere package optimizer while staying compatible with npm and pnpm packages.",
    workflow: "Run after cloning, creating a project, or changing package metadata.",
    flags: ["--copy", "--prefer-npm", "--frozen-lockfile"],
    example: "tsundere install\n# installs dependencies and refreshes Tsundere lock/workspace metadata",
    troubleshoot: "If package manager detection fails, install Node.js and npm first, then rerun the command from the project root."
  },
  add: {
    syntax: "tsundere add <package...>",
    purpose: "Add npm-compatible packages to a Tsundere project.",
    workflow: "Use it for Discord libraries, database clients, web packages, or local packages exactly like a Node project.",
    flags: ["--dev", "--exact"],
    example: "tsundere add discord.js mysql2 drizzle-orm",
    troubleshoot: "If a private package fails, verify the registry credentials in npm config before retrying."
  },
  remove: {
    syntax: "tsundere remove <package...>",
    purpose: "Remove packages from project metadata and refresh installed dependency state.",
    workflow: "Use it when cleaning unused runtime packages before CI or releases.",
    flags: ["--dev"],
    example: "tsundere remove unused-package\ntsundere install",
    troubleshoot: "If generated code still imports the package, search `src` before rebuilding."
  },
  update: {
    syntax: "tsundere update <package...>",
    purpose: "Update project packages. Self-updating the Tsundere toolchain uses `tsundere updater`, not this command.",
    workflow: "Use it for dependency maintenance, then run build and tests.",
    flags: ["--latest", "--interactive=false"],
    example: "tsundere update discord.js @tsundere/discord\ntsundere build",
    troubleshoot: "If a dependency breaks types, run `tsundere types sync` and inspect generated metadata."
  },
  doctor: {
    syntax: "tsundere doctor",
    purpose: "Inspect local setup, runtime package resolution, Discord metadata, package manager state, and common deployment issues.",
    workflow: "Run it after install failures, runtime crashes, or editor support problems.",
    flags: ["--fix", "--json"],
    example: "tsundere doctor\n# read warnings from top to bottom",
    troubleshoot: "If doctor cannot inspect a package, run `tsundere install` first."
  },
  metrics: {
    syntax: "tsundere metrics",
    purpose: "Inspect or expose Tsundere runtime and project metrics for observability workflows.",
    workflow: "Pair it with @tsundere/metrics, Prometheus scraping, and production dashboards.",
    flags: ["--prometheus", "--json", "--port <number>"],
    example: "tsundere metrics --prometheus\n# scrape output from your monitoring stack",
    troubleshoot: "If metrics are empty, confirm your app registers counters, gauges, or histograms at runtime."
  }
};

const eventDetails = {
  "Ready": { event: "ready", params: "()", intents: ["Guilds"], use: "Initialize services, sync commands, schedule background jobs, and announce startup once the gateway is ready." },
  "Message Create": { event: "messageCreate", params: "(message)", intents: ["GuildMessages", "MessageContent when reading content"], use: "Handle prefix utilities, message logging, and lightweight message workflows." },
  "Message Update": { event: "messageUpdate", params: "(oldMessage, newMessage)", intents: ["GuildMessages", "MessageContent when reading content"], use: "Audit edits and refresh message-derived cache entries." },
  "Message Delete": { event: "messageDelete", params: "(message)", intents: ["GuildMessages", "Partials.Message for uncached deletes"], use: "Log deletions, clean command state, and handle cached or partial messages safely." },
  "Interaction Create": { event: "interactionCreate", params: "(interaction)", intents: ["Guilds"], use: "Route slash commands, buttons, selects, modals, autocomplete, and context menus." },
  "Guild Create": { event: "guildCreate", params: "(guild)", intents: ["Guilds"], use: "Prepare guild-specific configuration, cache, and command sync state." },
  "Guild Delete": { event: "guildDelete", params: "(guild)", intents: ["Guilds"], use: "Disable guild jobs and clean stale cache for a removed server." },
  "Member Add": { event: "guildMemberAdd", params: "(member)", intents: ["GuildMembers"], use: "Welcome users, apply autoroles, and run membership onboarding." },
  "Member Remove": { event: "guildMemberRemove", params: "(member)", intents: ["GuildMembers"], use: "Log departures and clean member-scoped cache." },
  "Member Update": { event: "guildMemberUpdate", params: "(oldMember, newMember)", intents: ["GuildMembers"], use: "Track nickname, role, timeout, and membership changes." },
  "Role Create": { event: "roleCreate", params: "(role)", intents: ["Guilds"], use: "Track permission surface changes and update role caches." },
  "Role Update": { event: "roleUpdate", params: "(oldRole, newRole)", intents: ["Guilds"], use: "Detect permission changes and hierarchy changes." },
  "Role Delete": { event: "roleDelete", params: "(role)", intents: ["Guilds"], use: "Clean stale role references from configuration." },
  "Channel Create": { event: "channelCreate", params: "(channel)", intents: ["Guilds"], use: "Track new channel structure and update channel helper caches." },
  "Channel Update": { event: "channelUpdate", params: "(oldChannel, newChannel)", intents: ["Guilds"], use: "Audit channel name, topic, permission, and category changes." },
  "Channel Delete": { event: "channelDelete", params: "(channel)", intents: ["Guilds"], use: "Clean stale channel IDs from command, log, and webhook configuration." },
  "Thread Create": { event: "threadCreate", params: "(thread)", intents: ["Guilds"], use: "Track support or discussion threads without building a ticket framework." },
  "Thread Update": { event: "threadUpdate", params: "(oldThread, newThread)", intents: ["Guilds"], use: "Observe archive, lock, and name changes." },
  "Thread Delete": { event: "threadDelete", params: "(thread)", intents: ["Guilds"], use: "Clean thread-scoped jobs and caches." },
  "Voice State Update": { event: "voiceStateUpdate", params: "(oldState, newState)", intents: ["GuildVoiceStates"], use: "Track joins, leaves, moves, mutes, and voice session metrics." },
  "Presence Update": { event: "presenceUpdate", params: "(oldPresence, newPresence)", intents: ["GuildPresences"], use: "Track presence-driven features only when the privileged intent is intentionally enabled." },
  "Error": { event: "error", params: "(error)", intents: ["None"], use: "Report gateway or runtime failures into logs and metrics." },
  "Warn": { event: "warn", params: "(message)", intents: ["None"], use: "Surface non-fatal gateway warnings for operators." },
  "Debug": { event: "debug", params: "(message)", intents: ["None"], use: "Inspect gateway internals during development without enabling noisy production logs." },
  "Shard Ready": { event: "shardReady", params: "(shardId)", intents: ["Guilds"], use: "Track shard health in large bots." },
  "Shard Disconnect": { event: "shardDisconnect", params: "(event, shardId)", intents: ["Guilds"], use: "Alert when a shard disconnects from the gateway." },
  "Shard Reconnecting": { event: "shardReconnecting", params: "(shardId)", intents: ["Guilds"], use: "Mark shard status as degraded while reconnecting." }
};

const componentDetails = {
  Buttons: "Buttons are short-lived interaction triggers. Prefer typed custom IDs and keep labels clear.",
  "Select Menus": "Select menus collect one or more choices from users. Keep option sets small and validate values server-side.",
  Modals: "Modals collect structured text input from an interaction. Keep fields short, private, and validated.",
  "Text Inputs": "Text inputs live inside modals and should mirror the validation rules your handler expects.",
  "Action Rows": "Action rows group compatible components and enforce Discord layout limits.",
  "Typed Custom IDs": "Typed custom IDs replace manual string splitting with compact serialized data."
};

const groups = [
  {
    title: "Getting Started",
    slug: "getting-started",
    topics: [
      "Introduction", "What Is Tsundere", "Installation", "First Project", "Project Structure", ".yuri Files",
      "Development Mode", "Production Builds", "Installation Troubleshooting", "Windows Setup", "Linux Setup",
      "Updating Tsundere", "Opening Local Docs", "Joining The Community", "Reading Release Notes"
    ]
  },
  {
    title: "Yuri Language",
    slug: "yuri-language",
    topics: [
      "Syntax", "Variables", "Constants", "Types", "Objects", "Arrays", "Functions", "Async Await", "Imports",
      "Exports", "Modules", "Classes", "Interfaces", "Generics", "Enums", "Type Inference", "Union Types",
      "Optional Values", "Null Safety", "Error Handling", "Comments", "Formatting", "JS TS Interop",
      "Source Maps", "Runtime Globals", "Decorators", "Pattern Matching", "Strict Checks", "NPM Imports",
      "File Extensions", "Naming Conventions"
    ]
  },
  {
    title: "CLI",
    slug: "cli",
    topics: [
      "CLI Overview", "Configuration", "create", "dev", "build", "start", "lint", "format", "test", "doctor",
      "add", "remove", "install", "update", "metrics", "docs", "version", "updater", "runtime install",
      "commands sync", "types sync", "store path", "store prune", "cache clean", "plugin install",
      "fingerprint inspect", "help output", "environment variables"
    ]
  },
  {
    title: "Compiler",
    slug: "compiler",
    topics: [
      "Compiler Overview", "Lexer", "Parser", "AST", "Type Checker", "Transpilation", "Build Output",
      "Runtime Output", "Incremental Builds", "Runtime Architecture", "Configuration", "Hot Reload", "Caching",
      "Runtime Errors", "Performance Tuning", "Source Maps", "Diagnostics", "Discord Validation",
      "Command Discovery", "Type Metadata", "Build Protect", "Build Fingerprints", "Plugin Hooks"
    ]
  },
  {
    title: "Discord Basics",
    slug: "discord-basics",
    topics: [
      "Client Setup", "Login", "Intents", "Partials", "Presence", "Caching", "REST Client", "Gateway",
      "Rate Limits", "Typed Objects", "API Responses", "Permission Helpers", "Guild Helpers", "Member Helpers",
      "Role Helpers", "Channel Helpers", "Thread Helpers", "Message Helpers", "Invite Helpers",
      "Webhook Helpers", "Audit Log Helpers"
    ]
  },
  {
    title: "Discord Events",
    slug: "discord-events",
    topics: [
      "Ready", "Message Create", "Message Update", "Message Delete", "Interaction Create", "Guild Create",
      "Guild Delete", "Member Add", "Member Remove", "Member Update", "Role Create", "Role Update",
      "Role Delete", "Channel Create", "Channel Update", "Channel Delete", "Thread Create", "Thread Update",
      "Thread Delete", "Voice State Update", "Presence Update", "Error", "Warn", "Debug", "Shard Ready",
      "Shard Disconnect", "Shard Reconnecting"
    ]
  },
  {
    title: "Discord Commands",
    slug: "discord-commands",
    topics: [
      "Slash Commands", "Command Groups", "Subcommands", "Options", "Permissions", "Validation", "Cooldowns",
      "Autocomplete", "Context Menus", "Ephemeral Replies", "Deferred Replies", "Edit Replies", "Follow Ups",
      "Option Parsing", "Command Discovery", "Guild Sync", "Global Sync", "Stale Command Cleanup",
      "Route Based Commands", "Command Testing"
    ]
  },
  {
    title: "Discord Components",
    slug: "discord-components",
    topics: [
      "Buttons", "Button Styles", "Select Menus", "String Selects", "User Selects", "Role Selects",
      "Channel Selects", "Mentionable Selects", "Modals", "Text Inputs", "Action Rows", "Typed Custom IDs",
      "Component Rows", "Component Collectors", "Modal Collectors", "Timeout Handling", "Component Validation",
      "New Component Layouts", "Containers", "Sections", "Text Displays", "Thumbnails", "Media Galleries"
    ]
  },
  {
    title: "Discord Objects",
    slug: "discord-objects",
    topics: [
      "Embeds", "Attachments", "Webhooks", "Permissions", "Guilds", "Members", "Roles", "Channels", "Threads",
      "Messages", "Reactions", "Users", "Snowflakes", "Voice States", "Audit Logs", "Invites", "Emojis",
      "Stickers", "Files", "Mentions", "Message Flags"
    ]
  },
  {
    title: "Scaling And Observability",
    slug: "scaling-observability",
    topics: [
      "Scaling Overview", "Shards", "Clustering", "Workers", "Distributed Runtime", "IPC", "Global Events",
      "Global Cache", "Distributed Tasks", "Crash Recovery", "Zero Downtime Reloads", "Metrics", "Prometheus",
      "Grafana", "Loki", "OpenTelemetry", "Health Checks", "Structured Logging", "Request IDs",
      "Memory Metrics", "CPU Metrics", "Latency Metrics", "Command Metrics", "Cache Metrics", "Alerting"
    ]
  },
  {
    title: "Tooling",
    slug: "tooling",
    topics: [
      "VS Code Extension", "Cursor Support", "YuriLS", "Syntax Highlighting", "Semantic Highlighting",
      "IntelliSense", "Hover Docs", "Diagnostics", "Auto Imports", "Signature Help", "Formatting", "Linting",
      "Refactoring", "Rename Symbol", "Find References", "Go To Definition", "Inlay Hints",
      "Discord Type Generation", "Type Sync", "Troubleshooting Editor Support"
    ]
  },
  {
    title: "Testing",
    slug: "testing",
    topics: [
      "Testing Overview", "Unit Tests", "Runtime Tests", "Compiler Tests", "CLI Tests", "Package Manager Tests",
      "Discord Tests", "Stress Tests", "Snapshot Tests", "Writing Testable Code", "Mocking Interactions",
      "Mocking Commands", "Mocking REST", "Coverage", "CI Test Strategy", "Regression Tests"
    ]
  },
  {
    title: "Deployment",
    slug: "deployment",
    topics: [
      "Deployment Overview", "Build Artifacts", "Environment Variables", "Windows Deployment",
      "Linux Deployment", "Docker", "CI CD", "GitHub Actions", "Production Configuration", "Secrets",
      "Runtime Install", "Systemd", "Process Managers", "Health Checks", "Rollbacks", "Troubleshooting"
    ]
  },
  {
    title: "Examples",
    slug: "examples",
    topics: [
      "Empty Project", "CLI App", "Web Server", "Yuri Backend With EJS", "Discord Bot", "Slash Command Bot",
      "Components Bot", "Logger Example", "Grafana Metrics Example", "Package Manager Example",
      "Moderation Command Example", "Welcome Bot Example", "GitHub Role Sync Example", "Webhook Example",
      "Thread Helper Example", "Testing Example"
    ]
  },
  {
    title: "Contributor Workflows",
    slug: "contributors",
    topics: [
      "Contributing Overview", "Repository Layout", "Pull Requests", "Issue Templates", "Code Owners",
      "Release Workflow", "Security Reports", "Documentation Style", "Plugin Contributions",
      "Website Contributions", "Testing Contributions", "Review Checklist"
    ]
  }
];

const pages = groups.flatMap((group) => group.topics.map((topic, index) => ({
  group: group.title,
  groupSlug: group.slug,
  title: topic,
  slug: `${group.slug}-${slug(topic)}`,
  index,
  author
})));

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

for (const page of pages) {
  fs.writeFileSync(path.join(outDir, `${page.slug}.html`), renderPage(page), "utf8");
}

fs.writeFileSync(path.join(outDir, "index.html"), renderIndex(), "utf8");
fs.writeFileSync(path.join(outDir, "book-data.js"), renderBookData(), "utf8");

console.log(`Generated ${pages.length} docs pages in docs/local/book.`);

function renderIndex() {
  const cards = groups.map((group) => {
    const groupPages = pages.filter((page) => page.groupSlug === group.slug);
    return `<section class="book-card"><h2>${escapeHtml(group.title)}</h2><p>${groupPages.length} pages covering ${escapeHtml(group.title.toLowerCase())}.</p><a href="${groupPages[0].slug}.html">Start section</a></section>`;
  }).join("\n");
  return shell({
    title: "Complete Documentation",
    group: "Documentation",
    body: `<section class="book-hero"><p class="eyebrow">Complete docs tree</p><h1>Tsundere Documentation</h1><p>A generated documentation catalog with ${pages.length} pages across language, runtime, Discord, tooling, deployment, testing, observability, and contributor workflows.</p></section><div class="book-grid">${cards}</div>`
  });
}

function renderPage(page) {
  const related = relatedPages(page).map((item) => `<a href="${item.slug}.html">${escapeHtml(item.title)}</a>`).join(" - ");
  const adjacent = pageNavigation(page);
  return shell({
    title: page.title,
    group: page.group,
    author: page.author,
    body: `
      <article class="doc-page">
        <p class="eyebrow">${escapeHtml(page.group)}</p>
        <h1>${escapeHtml(page.title)}</h1>
        ${authorBlock(page.author)}
        ${metaGrid(page)}
        ${section("Overview", overview(page))}
        ${section("Purpose And Use Cases", purpose(page))}
        ${section("Architecture Or Design Notes", architecture(page))}
        ${codeSection("Beginner Example", beginnerExample(page))}
        ${codeSection("Advanced Example", advancedExample(page))}
        ${section("Reference And API Details", reference(page))}
        ${listSection("Best Practices", bestPractices(page))}
        ${listSection("Common Mistakes", commonMistakes(page))}
        ${listSection("Troubleshooting", troubleshooting(page))}
        <section class="doc-section related"><h2>Related Pages</h2><p>${related}</p></section>
        ${adjacent}
      </article>`
  });
}

function shell({ title, group, author: pageAuthor, body }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)} - Tsundere Docs</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="../theme.css">
  <script src="../theme.js" defer></script>
  <script src="book-data.js" defer></script>
</head>
<body class="bg-white text-slate-900 docs-book" data-doc-title="${escapeHtml(title)}" data-doc-group="${escapeHtml(group)}" data-doc-author="${escapeHtml(pageAuthor?.name ?? author.name)}">
  <div class="min-h-screen lg:grid lg:grid-cols-[320px_1fr]">
    <aside class="border-r border-slate-200 bg-slate-50 px-6 py-6 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
      <div class="flex items-center gap-3">
        <img src="../../../assets/tsundere-logo.png" alt="Tsundere logo" class="h-12 w-12 rounded-lg object-cover">
        <div><div class="text-lg font-semibold">Tsundere</div><div class="text-xs text-slate-500">Documentation</div></div>
      </div>
      <div class="docs-search">
        <i data-lucide="search" class="search-icon"></i>
        <input id="book-search-input" type="search" placeholder="Search 200+ docs">
        <div id="book-search-results" class="search-results"></div>
      </div>
      <nav id="book-nav" class="mt-6 space-y-1 text-sm"></nav>
    </aside>
    <main class="mx-auto w-full max-w-5xl px-6 py-10">${body}</main>
  </div>
</body>
</html>`;
}

function section(title, text) {
  return `<section class="doc-section"><h2>${title}</h2><p>${text}</p></section>`;
}

function codeSection(title, code) {
  return `<section class="doc-section"><h2>${title}</h2><pre class="overflow-x-auto rounded-lg bg-slate-950 p-5 text-sm text-slate-100"><code>${escapeHtml(code)}</code></pre></section>`;
}

function listSection(title, items) {
  return `<section class="doc-section"><h2>${title}</h2><ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul></section>`;
}

function authorBlock(item) {
  return `<div class="doc-author"><img src="${item.avatar}" alt="${escapeHtml(item.name)}"><span>Written by <strong>${escapeHtml(item.name)}</strong></span></div>`;
}

function metaGrid(page) {
  const items = [
    ["Section", page.group],
    ["Level", learningLevel(page)],
    ["Primary Command", primaryCommand(page)],
    ["Production Focus", productionFocus(page)]
  ];
  return `<div class="doc-meta-grid">${items.map(([label, value]) => `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join("")}</div>`;
}

function overview(page) {
  const cli = cliDetails[page.title];
  if (cli) {
    return `${escapeHtml(page.title)} is a Tsundere CLI command. ${escapeHtml(cli.purpose)} The command is designed for normal project folders, CI jobs, and local development terminals.`;
  }
  const event = eventDetails[page.title];
  if (event) {
    return `${escapeHtml(page.title)} documents the Discord gateway event \`${event.event}\`. Tsundere exposes it through \`client.on("${event.event}", ...)\` and uses generated Discord metadata so editor completions, callback parameters, and intent warnings stay close to Discord.js behavior.`;
  }
  if (page.groupSlug === "discord-components" && componentDetails[page.title]) {
    return `${escapeHtml(page.title)} covers Discord component authoring in Tsundere. ${escapeHtml(componentDetails[page.title])} The goal is less manual payload wiring while keeping the Discord API shape visible.`;
  }
  if (page.groupSlug === "deployment") {
    return `${escapeHtml(page.title)} explains how to move a Tsundere project from local development into a production environment. It focuses on reproducible builds, runtime startup, secrets, and operational recovery.`;
  }
  if (page.groupSlug === "scaling-observability") {
    return `${escapeHtml(page.title)} explains how Tsundere projects stay observable and resilient as the bot or backend grows. It connects logs, metrics, health checks, cache behavior, and runtime operations.`;
  }
  return `${escapeHtml(page.title)} is part of the ${escapeHtml(page.group)} area of Tsundere. This page explains practical behavior, production usage, and how the topic fits into a real .yuri project.`;
}

function purpose(page) {
  const cli = cliDetails[page.title];
  if (cli) {
    return `${escapeHtml(cli.workflow)} This matters because Tsundere is meant to feel like a normal developer runtime: commands should work in any project folder, produce readable output, and leave source code separate from generated runtime files.`;
  }
  const event = eventDetails[page.title];
  if (event) {
    return `${escapeHtml(event.use)} Required intent guidance: ${escapeHtml(event.intents.join(", "))}. Use this page when deciding whether an event belongs in your bot, which partials are needed, and how to avoid noisy production listeners.`;
  }
  if (page.groupSlug.includes("discord")) {
    return `Use this topic when building Discord bots that need predictable API behavior, strong editor help, and fewer runtime surprises. It keeps the Discord API visible while documenting the workflow Tsundere expects.`;
  }
  if (page.groupSlug === "cli") {
    return `Use this topic when running Tsundere from a terminal or automation. It covers command shape, project workflow, flags, and failure modes so the CLI stays understandable.`;
  }
  if (page.groupSlug === "examples") {
    return `Use this example as a starting point, not as a locked-in framework. Copy the structure, replace placeholders, and keep project-specific behavior inside your own services.`;
  }
  return `Use this topic when you need a reliable mental model for Tsundere projects. It connects beginner usage with production concerns like configuration, diagnostics, testing, and deployment.`;
}

function architecture(page) {
  const cli = cliDetails[page.title];
  if (cli) {
    return `Command architecture: input is read from the current working directory, configuration is resolved from \`tsundere.config.json\`, package/runtime state is kept in normal project files plus \`.tsundere\`, and output is designed to be scriptable. Syntax: \`${escapeHtml(cli.syntax)}\`.`;
  }
  const event = eventDetails[page.title];
  if (event) {
    return `Gateway architecture: Discord.js receives the raw gateway event, @tsundere/discord maps it into a Tsundere-friendly typed object, YuriLS uses metadata for completions, and diagnostics warn when required intents or partials are missing. Callback signature: \`${event.params}\`.`;
  }
  if (page.groupSlug === "discord-commands") {
    return `Command architecture uses builders and optional discovery. Files under \`src/commands\` can export command builders, route-based grouping can create paths like \`/admin ban\`, and \`tsundere dev\` can sync changed commands during development.`;
  }
  if (page.groupSlug === "tooling") {
    return `Tooling architecture is split between the VS Code/Cursor extension, YuriLS, generated \`.yuri-cache\` metadata, and the CLI. This keeps editor features fast without requiring a separate package ecosystem.`;
  }
  return `The design favors small files, explicit imports, generated metadata where useful, and Node-compatible output. ${escapeHtml(page.title)} should remain compatible with npm packages and should not require hidden framework magic.`;
}

function beginnerExample(page) {
  const cli = cliDetails[page.title];
  if (cli) {
    return cli.example;
  }
  const event = eventDetails[page.title];
  if (event) {
    return `import { Client, Intents } from "@tsundere/discord"\n\nconst client = new Client({\n  token: env.DISCORD_TOKEN,\n  intents: [${event.intents.includes("None") ? "Intents.Guilds" : event.intents.filter((item) => !item.includes("when") && !item.includes("Partials")).map((item) => `Intents.${item}`).join(", ") || "Intents.Guilds"}]\n})\n\nclient.on("${event.event}", async ${event.params} => {\n  log("${event.event} received")\n})\n\nclient.login()`;
  }
  if (page.groupSlug === "cli") {
    return `tsundere ${page.title.toLowerCase().replaceAll(" ", "-")} --help\n# Read the command output, then run it from your project root.`;
  }
  if (page.groupSlug === "discord-commands") {
    return `import { Slash } from "@tsundere/discord"\n\nexport default Slash.command("ping")\n  .description("Check bot latency")`;
  }
  if (page.groupSlug === "discord-components") {
    return `import { Button, Row } from "@tsundere/discord"\n\nconst confirm = Button.success("confirm:1").label("Confirm")\nconst actions = Row.of(confirm)`;
  }
  if (page.groupSlug.includes("discord")) {
    return `import { Client, Intents } from "@tsundere/discord"\n\nconst client = new Client({\n  token: env.DISCORD_TOKEN,\n  intents: [Intents.Guilds]\n})\n\nclient.login()`;
  }
  if (page.groupSlug === "examples") {
    return `tsundere create my-example --template empty\ncd my-example\ntsundere install\ntsundere dev`;
  }
  return `// ${page.title}\nconst enabled = true\n\nif (enabled) {\n  log("Tsundere is ready")\n}`;
}

function advancedExample(page) {
  const cli = cliDetails[page.title];
  if (cli) {
    return `${cli.example}\n\n# Production check\n${page.title === "start" ? "tsundere doctor && tsundere start" : "tsundere build && npm test"}`;
  }
  const event = eventDetails[page.title];
  if (event) {
    return `client.on("${event.event}", async ${event.params} => {\n  try {\n    await metrics.counter("discord_events_total").inc({ event: "${event.event}" })\n    await audit.write({ event: "${event.event}", receivedAt: new Date().toISOString() })\n  } catch err {\n    log("Event handler failed: " + err.message)\n  }\n})`;
  }
  if (page.groupSlug === "scaling-observability") {
    return `import { createLogger } from "@tsundere/logger"\nimport { createDefaultMetrics } from "@tsundere/metrics"\n\nconst log = createLogger({ service: "bot", format: "json" })\nconst metrics = createDefaultMetrics()\n\nlog.info("${page.title} enabled")\nserver.get("/metrics", (req, res) => res.send(metrics.toPrometheus()))`;
  }
  if (page.groupSlug === "discord-commands") {
    return `router.command("admin ban", async (ctx) => {\n  await ctx.deferReply({ ephemeral: true })\n  const target = ctx.options.user("target")\n  await ctx.guild.members.ban(target, { reason: ctx.options.string("reason") ?? "No reason" })\n  await ctx.editReply({ content: "Action complete" })\n})`;
  }
  if (page.groupSlug === "discord-components") {
    return `const BanButton = Component.define<{ userId: Snowflake }>("ban")\n\nclient.component(BanButton, async (ctx) => {\n  await ctx.guild.members.ban(ctx.data.userId)\n  await ctx.reply({ content: "Done", ephemeral: true })\n})`;
  }
  if (page.groupSlug.includes("discord")) {
    return `client.on("interactionCreate", async (interaction) => {\n  if (interaction.isCommand("ping")) {\n    await interaction.deferReply({ ephemeral: true })\n    await interaction.editReply({ content: "pong" })\n  }\n})`;
  }
  return `export async function run${identifier(page.title)}(ctx) {\n  try {\n    await ctx.execute()\n  } catch err {\n    log("Failed: " + err.message)\n  }\n}`;
}

function reference(page) {
  const cli = cliDetails[page.title];
  if (cli) {
    return `Syntax: \`${escapeHtml(cli.syntax)}\`. Common flags: ${escapeHtml(cli.flags.join(", "))}. Typical workflow: ${escapeHtml(cli.workflow)} Related files include \`package.json\`, \`tsundere.config.json\`, \`tsundere-lock.yaml\`, \`tsundere-workspace.yaml\`, \`.tsundere/runtime-build\`, and \`build\` depending on the command.`;
  }
  const event = eventDetails[page.title];
  if (event) {
    return `Event name: \`${event.event}\`. Callback parameters: \`${event.params}\`. Required or recommended intents: ${escapeHtml(event.intents.join(", "))}. Use partials when Discord can emit incomplete cached data, especially for message delete and update flows.`;
  }
  if (page.groupSlug === "discord-components") {
    return `Reference this page with Discord's component limits: custom IDs should stay under 100 characters, action rows have strict component counts, modals have input limits, and typed component helpers should serialize only the data needed by the handler.`;
  }
  return `Reference details for ${escapeHtml(page.title)} should include accepted inputs, generated output, configuration keys, related CLI commands, diagnostics, and runtime behavior. Keep this page close to source examples and update it when APIs change.`;
}

function bestPractices(page) {
  const event = eventDetails[page.title];
  if (event) {
    return [
      `Register only the ${escapeHtml(event.event)} listener when the bot actually needs it.`,
      `Enable the smallest required intent set: ${escapeHtml(event.intents.join(", "))}.`,
      "Keep event handlers thin and move business logic into services.",
      "Log failures with enough context to debug without leaking tokens or private data."
    ];
  }
  const cli = cliDetails[page.title];
  if (cli) {
    return [
      `Run \`${escapeHtml(cli.syntax.split(" ")[0])} ${escapeHtml(page.title)}\` from the project root unless the command says otherwise.`,
      "Keep generated output out of source edits.",
      "Use command output in CI so failures are visible in logs.",
      "Pair CLI changes with `tsundere doctor`, build, and tests before release."
    ];
  }
  return [
    `Keep ${escapeHtml(page.title)} usage explicit and easy to test.`,
    "Prefer small modules with clear imports and exports.",
    "Document project-specific configuration next to the code that uses it.",
    "Use diagnostics, tests, and examples before deploying to production."
  ];
}

function commonMistakes(page) {
  const event = eventDetails[page.title];
  if (event) {
    return [
      "Forgetting the required gateway intent or privileged intent toggle.",
      "Assuming uncached messages or members always include every field.",
      "Doing heavy database work directly inside the event callback.",
      "Logging message content or user data without a clear moderation need."
    ];
  }
  const cli = cliDetails[page.title];
  if (cli) {
    return [
      "Running the command from the wrong folder.",
      "Ignoring a failed install or build before starting the runtime.",
      "Confusing `tsundere update <package>` with `tsundere updater` for toolchain updates.",
      `Skipping the command-specific troubleshooting note: ${escapeHtml(cli.troubleshoot)}`
    ];
  }
  return [
    "Skipping configuration validation before production.",
    "Copying examples without replacing placeholder IDs, tokens, or paths.",
    "Ignoring warnings that point to Discord intents, permissions, or runtime setup.",
    "Mixing generated output with source files."
  ];
}

function troubleshooting(page) {
  const cli = cliDetails[page.title];
  if (cli) {
    return [
      cli.troubleshoot,
      "Run `tsundere doctor` for environment and runtime checks.",
      "Run with verbose diagnostics when command output is too short.",
      "Check project config, package metadata, and generated runtime directories."
    ];
  }
  const event = eventDetails[page.title];
  if (event) {
    return [
      `Confirm the bot is listening for \`${event.event}\` and that the gateway connection reached ready.`,
      `Verify required intents: ${escapeHtml(event.intents.join(", "))}.`,
      "Check Discord developer portal privileged intent settings when member, presence, or content data is missing.",
      "Use structured logs to confirm whether the event did not fire or the handler failed."
    ];
  }
  return [
    "Run `tsundere doctor` to inspect environment and project setup.",
    "Run `tsundere build` and read the first compiler diagnostic before changing multiple files.",
    "Check `.env`, `tsundere.config.json`, and local runtime package resolution.",
    `Search the docs for ${escapeHtml(page.title)} and related terms.`
  ];
}

function relatedPages(page) {
  const groupPages = pages.filter((item) => item.groupSlug === page.groupSlug && item.slug !== page.slug);
  const same = groupPages.slice(0, 3);
  const index = pages.find((item) => item.slug !== page.slug && item.groupSlug !== page.groupSlug);
  return [...same, index].filter(Boolean);
}

function renderBookData() {
  return `window.TSUNDERE_BOOK = ${JSON.stringify({ groups, pages: pages.map(({ author: _author, ...page }) => ({ ...page, summary: plainText(overview(page)), body: pageSearchText(page) })) }, null, 2)};\n`;
}

function learningLevel(page) {
  if (page.groupSlug === "getting-started" || page.groupSlug === "examples") {
    return "Beginner to production";
  }
  if (page.groupSlug === "compiler" || page.groupSlug === "scaling-observability") {
    return "Advanced";
  }
  return "Practical";
}

function primaryCommand(page) {
  if (page.groupSlug === "cli") {
    return `tsundere ${page.title}`;
  }
  if (page.groupSlug === "deployment") {
    return "tsundere build";
  }
  if (page.groupSlug === "tooling") {
    return "tsundere types sync";
  }
  if (page.groupSlug.includes("discord")) {
    return "tsundere dev";
  }
  return "tsundere doctor";
}

function productionFocus(page) {
  if (page.groupSlug.includes("discord")) {
    return "Intents, permissions, API limits";
  }
  if (page.groupSlug === "cli") {
    return "Repeatable project commands";
  }
  if (page.groupSlug === "testing") {
    return "Reliable CI feedback";
  }
  return "Clear runtime behavior";
}

function pageNavigation(page) {
  const current = pages.findIndex((item) => item.slug === page.slug);
  const previous = pages[current - 1];
  const next = pages[current + 1];
  if (!previous && !next) {
    return "";
  }
  return `<nav class="page-neighbors">${previous ? `<a href="${previous.slug}.html"><span>Previous</span><strong>${escapeHtml(previous.title)}</strong></a>` : "<span></span>"}${next ? `<a href="${next.slug}.html"><span>Next</span><strong>${escapeHtml(next.title)}</strong></a>` : "<span></span>"}</nav>`;
}

function pageSearchText(page) {
  return plainText([
    overview(page),
    purpose(page),
    architecture(page),
    reference(page),
    ...bestPractices(page),
    ...commonMistakes(page),
    ...troubleshooting(page)
  ].join(" "));
}

function plainText(value) {
  return String(value).replace(/<[^>]*>/gu, "").replace(/\s+/gu, " ").trim();
}

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/gu, "-").replace(/^-|-$/gu, "");
}

function identifier(value) {
  return value.replace(/[^a-zA-Z0-9]+/gu, " ").trim().split(/\s+/u).map((part) => part[0].toUpperCase() + part.slice(1)).join("");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;");
}
