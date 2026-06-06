import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const docsDir = path.join(root, "docs", "local");
const requiredPages = [
  "getting-started.html",
  "what-is-tsundere.html",
  "installation.html",
  "first-project.html",
  "project-structure.html",
  "yuri-files.html",
  "development-mode.html",
  "production-builds.html",
  "installation-troubleshooting.html",
  "windows-setup.html",
  "linux-setup.html",
  "updating-tsundere.html",
  "opening-local-docs.html",
  "joining-community.html",
  "reading-release-notes.html"
];

const localReferencePattern = /\b(?:href|src)=["']([^"']+)["']/g;
const htmlFiles = (await readdir(docsDir)).filter((file) => file.endsWith(".html")).sort();
const errors = [];

for (const page of requiredPages) {
  await expectFile(path.join(docsDir, page), `Missing required Getting Started page: ${page}`);
}

for (const file of htmlFiles) {
  const absoluteFile = path.join(docsDir, file);
  const html = await readFile(absoluteFile, "utf8");
  const references = [...html.matchAll(localReferencePattern)].map((match) => match[1]);
  for (const reference of references) {
    if (isExternalReference(reference)) {
      continue;
    }
    const target = reference.split("#")[0].split("?")[0];
    if (!target) {
      continue;
    }
    const resolved = path.resolve(docsDir, target);
    if (!resolved.startsWith(root)) {
      errors.push(`${file} references path outside the repository: ${reference}`);
      continue;
    }
    await expectFile(resolved, `${file} has a broken local reference: ${reference}`);
  }
}

const theme = await readFile(path.join(docsDir, "theme.js"), "utf8");
for (const page of requiredPages) {
  if (!theme.includes(page)) {
    errors.push(`theme.js is missing ${page}`);
  }
}

if (errors.length > 0) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exit(1);
}

console.log(`Checked ${htmlFiles.length} local docs pages and ${requiredPages.length} Getting Started pages.`);

async function expectFile(filePath, message) {
  try {
    await access(filePath);
  } catch {
    errors.push(message);
  }
}

function isExternalReference(reference) {
  return /^(?:[a-z]+:)?\/\//i.test(reference)
    || reference.startsWith("mailto:")
    || reference.startsWith("tel:")
    || reference.startsWith("data:")
    || reference.startsWith("#");
}
