const storedTheme = localStorage.getItem("tsundere-theme");
if (storedTheme === "dark") {
  document.documentElement.classList.add("dark");
}
if (storedTheme === "light") {
  document.documentElement.classList.add("light");
}

window.addEventListener("DOMContentLoaded", () => {
  const lucide = document.createElement("script");
  lucide.src = "https://unpkg.com/lucide@latest/dist/umd/lucide.min.js";
  lucide.onload = () => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  };
  document.head.appendChild(lucide);

  const nav = document.querySelector("aside nav");
  if (nav) {
    const search = document.createElement("div");
    search.className = "docs-search";
    search.innerHTML = `
      <i data-lucide="search" class="search-icon"></i>
      <input id="docs-search-input" type="search" placeholder="Search docs">
      <div id="docs-search-results" class="search-results"></div>
    `;
    nav.parentElement?.insertBefore(search, nav);

    const links = [
      ["templates.html", "Templates"],
      ["examples.html", "Examples"],
      ["transition.html", "Transition"],
      ["versions.html", "Versions"]
    ];
    const current = location.pathname.split("/").pop();
    for (const [href, label] of links) {
      if (nav.querySelector(`a[href="${href}"]`)) {
        continue;
      }
      const link = document.createElement("a");
      link.href = href;
      link.textContent = label;
      link.className = current === href
        ? "block rounded-md bg-pink-100 px-3 py-2 font-medium text-pink-800"
        : "block rounded-md px-3 py-2 text-slate-700 hover:bg-white";
      nav.appendChild(link);
    }

    addGettingStartedDropdown(nav);
    addDiscordDropdown(nav);
    addRoadmapDropdown(nav);
  }

  addAuthor();
  setupSearch();

  const button = document.createElement("button");
  button.type = "button";
  button.className = "theme-toggle";
  button.innerHTML = document.documentElement.classList.contains("dark")
    ? '<i data-lucide="sun"></i><span>Light</span>'
    : '<i data-lucide="moon"></i><span>Dark</span>';
  button.addEventListener("click", () => {
    const isDark = document.documentElement.classList.toggle("dark");
    document.documentElement.classList.remove("light");
    localStorage.setItem("tsundere-theme", isDark ? "dark" : "light");
    if (!isDark) {
      document.documentElement.classList.add("light");
    }
    button.innerHTML = isDark ? '<i data-lucide="sun"></i><span>Light</span>' : '<i data-lucide="moon"></i><span>Dark</span>';
    if (window.lucide) {
      window.lucide.createIcons();
    }
  });
  document.body.appendChild(button);
});

function addAuthor() {
  const main = document.querySelector("main");
  const title = main?.querySelector("h1");
  if (!main || !title || main.querySelector(".doc-author")) {
    return;
  }
  const author = document.createElement("div");
  author.className = "doc-author";
  author.innerHTML = `
    <img src="https://cdn.discordapp.com/avatars/1212798448525512785/3939e4e22234f3e7ce8247988ad43d3d.webp?size=1536" alt="Luckyz">
    <span>Written by <strong>Luckyz</strong></span>
  `;
  title.insertAdjacentElement("afterend", author);
}

const gettingStartedPages = [
  ["getting-started.html", "Introduction"],
  ["what-is-tsundere.html", "What Is Tsundere"],
  ["installation.html", "Installation"],
  ["first-project.html", "First Project"],
  ["project-structure.html", "Project Structure"],
  ["yuri-files.html", ".yuri Files"],
  ["development-mode.html", "Development Mode"],
  ["production-builds.html", "Production Builds"],
  ["installation-troubleshooting.html", "Installation Troubleshooting"],
  ["windows-setup.html", "Windows Setup"],
  ["linux-setup.html", "Linux Setup"],
  ["updating-tsundere.html", "Updating Tsundere"],
  ["opening-local-docs.html", "Opening Local Docs"],
  ["joining-community.html", "Joining The Community"],
  ["reading-release-notes.html", "Reading Release Notes"]
];

function addGettingStartedDropdown(nav) {
  if (nav.querySelector(".getting-started-dropdown")) {
    return;
  }
  const current = location.pathname.split("/").pop();
  const pages = new Set(gettingStartedPages.map(([href]) => href));
  const isGettingStartedPage = pages.has(current);
  const details = document.createElement("details");
  details.className = isGettingStartedPage ? "docs-dropdown getting-started-dropdown active" : "docs-dropdown getting-started-dropdown";
  details.open = isGettingStartedPage;
  details.innerHTML = `
    <summary>Getting Started</summary>
    ${gettingStartedPages.map(([href, label]) => `<a href="${href}" class="${current === href ? "active" : ""}">${label}</a>`).join("")}
  `;
  const gettingStartedLink = nav.querySelector('a[href="getting-started.html"]');
  gettingStartedLink?.replaceWith(details);
}

function addDiscordDropdown(nav) {
  if (nav.querySelector(".docs-dropdown")) {
    return;
  }
  const current = location.pathname.split("/").pop();
  const isDiscordPage = current === "discord.html" || current === "discord-events.html" || current === "discord-layouts.html";
  const details = document.createElement("details");
  details.className = isDiscordPage ? "docs-dropdown active" : "docs-dropdown";
  details.open = isDiscordPage;
  details.innerHTML = `
    <summary>Discord Guide</summary>
    <a href="discord.html" class="${current === "discord.html" ? "active" : ""}">Overview</a>
    <a href="discord-events.html" class="${current === "discord-events.html" ? "active" : ""}">Events</a>
    <a href="discord-layouts.html" class="${current === "discord-layouts.html" ? "active" : ""}">Layouts</a>
  `;
  const discordLink = nav.querySelector('a[href="discord.html"]');
  discordLink?.replaceWith(details);
}

function addRoadmapDropdown(nav) {
  if (nav.querySelector(".roadmap-dropdown")) {
    return;
  }
  const current = location.pathname.split("/").pop();
  const pages = new Set(["roadmap.html", "protect.html", "discord-intelligence.html", "visualizer.html", "plugins.html"]);
  const isRoadmapPage = pages.has(current);
  const details = document.createElement("details");
  details.className = isRoadmapPage ? "docs-dropdown roadmap-dropdown active" : "docs-dropdown roadmap-dropdown";
  details.open = isRoadmapPage;
  details.innerHTML = `
    <summary>Roadmap</summary>
    <a href="roadmap.html" class="${current === "roadmap.html" ? "active" : ""}">Overview</a>
    <a href="protect.html" class="${current === "protect.html" ? "active" : ""}">Protect</a>
    <a href="discord-intelligence.html" class="${current === "discord-intelligence.html" ? "active" : ""}">Discord Intelligence</a>
    <a href="visualizer.html" class="${current === "visualizer.html" ? "active" : ""}">Visualizer</a>
    <a href="plugins.html" class="${current === "plugins.html" ? "active" : ""}">Plugins</a>
  `;
  nav.appendChild(details);
}

const docsIndex = [
  {
    href: "index.html",
    title: "Overview",
    text: "Tsundere is a TypeScript-style .yuri language toolchain and optimized Discord wrapper for Node.js. It has a local runtime, distributed runtime planning, bundled @tsundere/discord package, command discovery, local docs, examples, templates, light mode, dark mode, search, and version-aware updater support. Use it for Discord bots when you want familiar code with cleaner bot workflow."
  },
  {
    href: "getting-started.html",
    title: "Getting Started Introduction",
    text: "Getting Started introduces Tsundere as a npm-compatible .yuri coding wrapper and Discord runtime. It explains the real workflow from installation to creating a Discord template, running tsundere install, editing .env, using tsundere dev, building with tsundere build, starting with tsundere start, opening local docs, and reading release notes."
  },
  {
    href: "what-is-tsundere.html",
    title: "What Is Tsundere",
    text: "Tsundere is a local CLI and runtime for .yuri projects. It wraps npm installs, keeps package.json and package-lock.json compatibility, emits runtime JavaScript into .tsundere/runtime-build, provides a bundled @tsundere/discord bridge, supports templates, plugins, updater commands, distributed runtime helpers, and local documentation."
  },
  {
    href: "installation.html",
    title: "Installation",
    text: "Installation explains release zip setup, npm install, npm run build, npm link, PowerShell and shell install scripts, Node and npm requirements, tsundere version, tsundere doctor, tsundere docs, and how Tsundere stores user-level files under the home directory."
  },
  {
    href: "first-project.html",
    title: "First Project",
    text: "First Project covers tsundere create my-bot --template discord, npm install, tsundere install, DISCORD_TOKEN in .env, src/main.yuri, src/commands/ping.yuri, tsundere dev, tsundere build, tsundere start, command discovery, command sync, and local runtime install when @tsundere/discord is missing."
  },
  {
    href: "project-structure.html",
    title: "Project Structure",
    text: "Project Structure explains package.json, package-lock.json, tsundere.config.json, tsundere-lock.yaml, tsundere-workspace.yaml, .env, src/main.yuri, src/commands, src/events, src/components, templates, docs, dist, .tsundere/runtime-build, .tsundere/runtime, and the difference between source files, generated runtime files, and global store cache files."
  },
  {
    href: "yuri-files.html",
    title: ".yuri Files",
    text: ".yuri Files describes Tsundere source files and the current transpiler behavior, including import/export preservation, async function forms, class declarations, let const var declarations, Event helper rewriting, Discord imports, source diagnostics, build output, and why Yuri code should stay close to JavaScript and TypeScript patterns."
  },
  {
    href: "development-mode.html",
    title: "Development Mode",
    text: "Development Mode explains tsundere dev, watch and restart behavior, .env loading, .tsundere/runtime-build output, local @tsundere/discord runtime emission, Discord bot startup, Ctrl+C cleanup, runtime diagnostics, command sync, and when to rerun tsundere install or tsundere runtime install."
  },
  {
    href: "production-builds.html",
    title: "Production Builds",
    text: "Production Builds covers tsundere build, tsundere start, npm run build, npm run start, generated runtime output, distribution files, release layout, package optimizer compatibility, package-lock preservation, environment variables, runtime checks, and protection and fingerprint commands."
  },
  {
    href: "installation-troubleshooting.html",
    title: "Installation Troubleshooting",
    text: "Installation Troubleshooting covers tsundere command not found, PowerShell execution policy, npm missing, Node missing, package install failures, corrupt Tsundere cache, missing @tsundere/discord runtime, permission denied, Linux chmod, Windows path issues, package-lock preservation, tsundere doctor, tsundere cache clean, and tsundere runtime install."
  },
  {
    href: "windows-setup.html",
    title: "Windows Setup",
    text: "Windows Setup explains PowerShell installer usage, install-tsundere-windows.ps1, execution policy bypass, npm and Node checks, AppData and user home storage, paths with spaces, tsundere doctor, global npm links, local docs opening, and Windows-safe install behavior."
  },
  {
    href: "linux-setup.html",
    title: "Linux Setup",
    text: "Linux Setup explains Node and npm checks, scripts/install-tsundere-linux.sh, scripts/install-linux.sh, chmod +x, bash and sh support, ~/.tsundere/config.json, ~/.tsundere/cache, ~/.tsundere/store, ~/.tsundere/logs, permission errors, command lookup, tsundere doctor, npm wrapping, and cross-platform path handling."
  },
  {
    href: "updating-tsundere.html",
    title: "Updating Tsundere",
    text: "Updating Tsundere explains tsundere updater check, tsundere updater self --yes, tsundere updater self --dry-run, tsundere updater cron, TSUNDERE_UPDATE_REPO, GitHub releases, release asset selection, npm package updates, tsundere update package, and automation behavior."
  },
  {
    href: "opening-local-docs.html",
    title: "Opening Local Docs",
    text: "Opening Local Docs explains tsundere docs, docs/local/index.html, platform open helpers, Windows start, macOS open, Linux xdg-open or browser fallback behavior, docsEntry package metadata, and reading the docs directly from the repository."
  },
  {
    href: "joining-community.html",
    title: "Joining The Community",
    text: "Joining The Community explains where to ask for help, what project information to include, tsundere doctor output, Node and npm versions, OS details, package.json, tsundere.config.json, .yuri source, package-lock behavior, logs, Discord bot errors, and GitHub issue or Discord support etiquette."
  },
  {
    href: "reading-release-notes.html",
    title: "Reading Release Notes",
    text: "Reading Release Notes explains updates.md, GitHub releases, version commands, package.json version, Tsundere Runtime version output, release layout, installer changes, updater changes, Linux support, package optimizer changes, clustering and sharding updates, and how to decide whether a release affects a project."
  },
  {
    href: "discord.html",
    title: "Discord Guide",
    text: "Discord guide covers the real @tsundere/discord runtime exports including Client setup, Intents, Partials, Slash, Embed, Button, SelectMenu, Modal, TextInput, Row, Components helpers, interaction replies, interaction narrowing, typed Component.define custom IDs, runtime managers, member role add and remove helpers, REST-backed command registration, and mock gateway behavior for tests."
  },
  {
    href: "discord-layouts.html",
    title: "Discord Layouts",
    text: "Discord layouts explain recommended Tsundere project structure with src main.yuri, src commands, src events, components, services, command discovery, routeBased command routes, .yuri-cache discord.commands.json, Slash.command metadata, InteractionRouter, shared router, typed component routing, and clean file splitting."
  },
  {
    href: "discord-events.html",
    title: "Discord Events",
    text: "Discord events explain the runtime-supported Client.on surface from DiscordEvents: ready, interactionCreate, messageCreate, messageDelete, messageUpdate, guildCreate, guildDelete, guildMemberAdd, guildMemberRemove, channelCreate, channelDelete, channelUpdate, voiceStateUpdate, and error. It covers callback parameters, intents, partial data, mapped runtime objects, and the difference between runtime support and broader editor suggestions."
  },
  {
    href: "cli.html",
    title: "CLI and Runtime",
    text: "CLI and Runtime explains source-backed command behavior for tsundere create, install, add, remove, update, store path, store prune, cache clean, dev, build, start, format, lint, test, commands sync, runtime install, docs, inspect, reload, stress runtime, stress system, metrics doctor, metrics serve, metrics export-grafana, updater, version, types sync, plugin install, generate, and fingerprint inspect. It covers runtime output in .tsundere/runtime-build, .env loading, Tsundere Runtime branding, distributed runtime planning, local IPC, global events, memory cache, task registry, Prometheus metrics, Grafana export, package optimizer stress checks, compiler stress checks, updater stress checks, and current limits of reload and clustering."
  },
  {
    href: "templates.html",
    title: "Templates",
    text: "Templates explains tsundere create and the current templateFiles and templateMain implementation in src cli. Templates include discord, rest, websocket, microservice, cli, and empty. Generated projects receive package.json, tsundere.config.json, .env.example, .gitignore, src/main.yuri, scripts for dev build start lint format test, and a file dependency on @tsundere/discord at .tsundere/runtime/discord. The Discord starter also writes src/commands/ping.yuri. The page explains that the templates folder is reference material but create currently generates files from CLI source."
  },
  {
    href: "examples.html",
    title: "Examples",
    text: "Examples explains docs/examples as both learning material and compiler samples because tsundere.config.json points source to docs/examples and command discovery to docs/examples/commands. Example files include main.yuri, starter-bot.yuri, embeds.yuri, components.yuri, collectors.yuri, modal-flow.yuri, slash-options.yuri, typed-router.yuri, cache-and-helpers.yuri, prefix-utils.yuri, rest-commands.yuri, sharding-and-gateway.yuri, webhook-thread-audit.yuri, type-bridge-notes.yuri, commands ping avatar and admin ban. It covers starter bot, typed router, components, modals, slash options, runtime helpers, gateway sharding, and safe copy patterns."
  },
  {
    href: "transition.html",
    title: "Transition to Yuri",
    text: "Transition to Yuri explains how JavaScript TypeScript and Python bot developers can move into .yuri files using the real compiler behavior in src compiler transpile. It covers targeted source transforms, env log print runtime prelude helpers, import rewriting from tsundere discord to @tsundere discord, parenthesis-light if statements, fn and async fn lowering, client bot and on event blocks, embed blocks, object call blocks, Spanglish aliases such as usar verdad falso nulo sea retorna espera si sino para mientras, strict diagnostics YURI101 DISCORD010 DISCORD005 DISCORD002 DISCORD003 DISCORD020, command discovery, .yuri-cache discord.commands.json, build output, .tsundere runtime-build, tsundere runtime install, tsundere build, tsundere dev, tsundere commands sync, and current limits because Yuri is transform-based rather than a full parser."
  },
  {
    href: "updates.html",
    title: "Updates",
    text: "Updates explains the difference between project package updates, CLI self-updates, automatic update checks, security update notices, and maintainer release publishing. It covers tsundere update, tsundere add, tsundere remove, tsundere install, tsundere updater check, tsundere updater info, tsundere updater self --dry-run, tsundere updater self --yes, updater cron install remove status, TSUNDERE_UPDATE_REPO, TSUNDERE_NO_UPDATE_NOTICE, security-update-cache.json, npm run dist:release, scripts build-distribution.ps1, scripts create-github-release.ps1, release bundles, tsundere-cli tgz assets, tsundere-discord tgz assets, VSIX files, checksums, release-manifest.json, GitHub CLI, and updates.md release note usage."
  },
  {
    href: "versions.html",
    title: "Versions",
    text: "Versions explains tsundere version, packageVersion from package.json, updateRepo resolution through TSUNDERE_UPDATE_REPO package tsundere.githubRepo and default TsundereLang tsundere, tsundere updater check info self cron, GitHub releases latest API, release tag normalization, version comparison, tsundere-cli tgz asset selection, self update dry-run yes force behavior, npm install -g tarball installs, security update notice caching in ~/.tsundere/security-update-cache.json, TSUNDERE_NO_UPDATE_NOTICE, Windows schtasks, Unix crontab marker tsundere-daily-update-check, cron install status remove, project package updates through tsundere install add update remove, and troubleshooting missing release assets or 0.0.0 version output."
  },
  {
    href: "roadmap.html",
    title: "Roadmap",
    text: "Roadmap is a source-backed status map for Tsundere features. It separates shipped foundations from experimental work and planned features. It covers CLI workflow, .yuri compiler status, transform-based transpile implementation, Discord wrapper, package optimizer, Tsundere Protect, Discord Intelligence, command visualizer, plugin marketplace, distributed runtime, release updater, type bridge, VS Code extension, docs check, unit tests, stress runtime, stress system, current commands, source paths, audit remaining work, release trust, installer hardening, plugin hook limits, local stress test limits, and why Yuri is still close to JavaScript and TypeScript until a full parser lands."
  },
  {
    href: "protect.html",
    title: "Tsundere Protect",
    text: "Tsundere Protect explains the actual protected build pipeline in src compiler protect and src compiler project. It covers tsundere build --protect standard advanced maximum, --seed behavior, buildProject runtime emission, protectJavaScript, source map comment stripping, comment stripping, static string encoding, decoder helper, import preservation, build IDs, standard profile, advanced guard code and integrity token, maximum wrapper gate, whitespace minification, .tsundere/runtime-build/tsundere-protect.json metadata, generatedAt profile seed files buildId, tsundere fingerprint inspect directory and file scanning, project-bounded path safety, Windows and Linux usage, why Protect is obfuscation not cryptography, why secrets must stay in env variables, and troubleshooting missing metadata or unchanged fingerprints."
  },
  {
    href: "discord-intelligence.html",
    title: "Discord Intelligence",
    text: "Discord Intelligence covers intent analyzer, permission intelligence, role hierarchy analysis, invite scope analysis, compatibility checker, tsundere doctor, deprecated API detection, migration assistant, Discord version reports, hover warnings, required intents, GuildMessages, MessageContent, GuildMembers, GuildPresences, BanMembers, ModerateMembers, ManageChannels, OAuth scopes, permission dashboard, and deployment warnings."
  },
  {
    href: "visualizer.html",
    title: "Command Visualizer",
    text: "Discord Command Visualizer is a planned VS Code panel for commands, command groups, subcommands, components, modals, events, click navigation, dependency graph, command to service to database to API relationships, search, dead command detection, duplicate detection, and source navigation."
  },
  {
    href: "plugins.html",
    title: "Plugin Marketplace",
    text: "Compiler Plugin Marketplace covers TsundereLang tsundere-plugins, fork and pull request workflow, registry.json, plugin.json, tsundere plugin add, tsundere plugin install, GitHub plugin links, local plugin installs, framework plugins, database plugins, Discord plugins, compiler plugins, language plugins, parser hooks, AST hooks, type system hooks, compiler hooks, build pipeline hooks, language server hooks, CLI hooks, diagnostics, lint rules, code generation, and official registry plans."
  }
];

function setupSearch() {
  const input = document.querySelector("#docs-search-input");
  const results = document.querySelector("#docs-search-results");
  if (!input || !results) {
    return;
  }
  input.addEventListener("input", () => {
    const query = input.value.trim().toLowerCase();
    if (!query) {
      results.innerHTML = "";
      results.classList.remove("open");
      return;
    }
    const terms = query.split(/\s+/u).filter(Boolean);
    const matches = docsIndex
      .map((entry) => ({ entry, score: searchScore(entry, terms) }))
      .filter((match) => match.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
    results.innerHTML = matches
      .map(({ entry }) => `<a href="${entry.href}"><strong>${entry.title}</strong><span>${snippet(entry.text, terms)}</span></a>`)
      .join("");
    results.classList.toggle("open", matches.length > 0);
  });
}

function searchScore(entry, terms) {
  const title = entry.title.toLowerCase();
  const text = entry.text.toLowerCase();
  return terms.reduce((score, term) => {
    if (title.includes(term)) {
      return score + 10;
    }
    if (text.includes(term)) {
      return score + 2;
    }
    return score;
  }, 0);
}

function snippet(text, terms) {
  const lower = text.toLowerCase();
  const index = terms
    .map((term) => lower.indexOf(term))
    .filter((value) => value >= 0)
    .sort((a, b) => a - b)[0] ?? 0;
  const start = Math.max(0, index - 48);
  const end = Math.min(text.length, index + 130);
  const prefix = start > 0 ? "..." : "";
  const suffix = end < text.length ? "..." : "";
  return `${prefix}${text.slice(start, end).trim()}${suffix}`;
}
