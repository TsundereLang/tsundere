import { homedir } from "node:os";
import { dirname, relative, resolve, sep } from "node:path";
import { rm } from "node:fs/promises";

export function isPathInside(parent: string, child: string): boolean {
  const root = resolve(parent);
  const target = resolve(child);
  const path = relative(root, target);
  return path === "" || Boolean(path) && !path.startsWith("..") && !isAbsoluteLike(path);
}

export function resolveInside(parent: string, target: string, label: string): string {
  const resolved = resolve(parent, target);
  assertPathInside(parent, resolved, label);
  return resolved;
}

export function assertPathInside(parent: string, target: string, label: string): void {
  if (!isPathInside(parent, target)) {
    throw new Error(`${label} must stay inside ${resolve(parent)}: ${target}`);
  }
}

export async function removeInside(parent: string, target: string, label: string): Promise<void> {
  assertSafeRemove(parent, target, label);
  await rm(resolve(target), { recursive: true, force: true });
}

export function assertSafeRemove(parent: string, target: string, label: string): void {
  const root = resolve(parent);
  const resolved = resolve(target);
  assertPathInside(root, resolved, label);
  if (resolved === root || dirname(resolved) === resolved || resolved === resolve(homedir())) {
    throw new Error(`Refusing to remove broad filesystem path for ${label}: ${target}`);
  }
  if (relative(root, resolved).split(sep).filter(Boolean).length === 0) {
    throw new Error(`Refusing to remove ${label} root: ${target}`);
  }
}

function isAbsoluteLike(path: string): boolean {
  return /^[A-Za-z]:[/\\]/u.test(path) || path.startsWith("/") || path.startsWith("\\");
}
