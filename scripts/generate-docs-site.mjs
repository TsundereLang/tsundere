import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, "docs", "local", "book");
const author = {
  name: "Luckyz",
  avatar: "https://cdn.discordapp.com/avatars/1212798448525512785/3939e4e22234f3e7ce8247988ad43d3d.webp?size=1536"
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
  return shell({
    title: page.title,
    group: page.group,
    author: page.author,
    body: `
      <article class="doc-page">
        <p class="eyebrow">${escapeHtml(page.group)}</p>
        <h1>${escapeHtml(page.title)}</h1>
        ${authorBlock(page.author)}
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

function overview(page) {
  return `${escapeHtml(page.title)} is part of the ${escapeHtml(page.group)} area of Tsundere. This page explains the practical behavior, why it matters, and how it fits into a production-focused .yuri project.`;
}

function purpose(page) {
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
  return `The design favors small files, explicit imports, generated metadata where useful, and Node-compatible output. ${escapeHtml(page.title)} should remain compatible with npm packages and should not require hidden framework magic.`;
}

function beginnerExample(page) {
  if (page.groupSlug === "cli") {
    return `tsundere ${page.title.toLowerCase().replaceAll(" ", "-")} --help\n# Read the command output, then run it from your project root.`;
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
  if (page.groupSlug === "scaling-observability") {
    return `import { createLogger } from "@tsundere/logger"\nimport { createDefaultMetrics } from "@tsundere/metrics"\n\nconst log = createLogger({ service: "bot", format: "json" })\nconst metrics = createDefaultMetrics()\n\nlog.info("${page.title} enabled")\nserver.get("/metrics", (req, res) => res.send(metrics.toPrometheus()))`;
  }
  if (page.groupSlug.includes("discord")) {
    return `client.on("interactionCreate", async (interaction) => {\n  if (interaction.isCommand("ping")) {\n    await interaction.deferReply({ ephemeral: true })\n    await interaction.editReply({ content: "pong" })\n  }\n})`;
  }
  return `export async function run${identifier(page.title)}(ctx) {\n  try {\n    await ctx.execute()\n  } catch err {\n    log("Failed: " + err.message)\n  }\n}`;
}

function reference(page) {
  return `Reference details for ${escapeHtml(page.title)} should include accepted inputs, generated output, configuration keys, related CLI commands, diagnostics, and runtime behavior. Keep this page close to source examples and update it when APIs change.`;
}

function bestPractices(page) {
  return [
    `Keep ${escapeHtml(page.title)} usage explicit and easy to test.`,
    "Prefer small modules with clear imports and exports.",
    "Document project-specific configuration next to the code that uses it.",
    "Use diagnostics, tests, and examples before deploying to production."
  ];
}

function commonMistakes(page) {
  return [
    "Skipping configuration validation before production.",
    "Copying examples without replacing placeholder IDs, tokens, or paths.",
    "Ignoring warnings that point to Discord intents, permissions, or runtime setup.",
    "Mixing generated output with source files."
  ];
}

function troubleshooting(page) {
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
  return `window.TSUNDERE_BOOK = ${JSON.stringify({ groups, pages: pages.map(({ author: _author, ...page }) => page) }, null, 2)};\n`;
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
