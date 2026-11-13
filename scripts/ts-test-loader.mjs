/* Lets `node --test` run the repo's TypeScript tests: resolves the "@/" alias
 * and extension-less relative imports the way the app does. Test-only. */
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SUFFIXES = ['.ts', '.tsx', '/index.ts', '/index.tsx'];

function tryResolve(base) {
  if (existsSync(base) && statSync(base).isFile()) return base;
  for (const suffix of SUFFIXES) if (existsSync(base + suffix)) return base + suffix;
  return null;
}

export async function resolve(specifier, context, nextResolve) {
  let base = null;
  if (specifier.startsWith('@/')) {
    base = path.join(root, 'src', specifier.slice(2));
  } else if (
    (specifier.startsWith('./') || specifier.startsWith('../')) &&
    context.parentURL?.startsWith('file:')
  ) {
    base = path.resolve(path.dirname(fileURLToPath(context.parentURL)), specifier);
  }
  if (base) {
    const hit = tryResolve(base);
    if (hit) return nextResolve(pathToFileURL(hit).href, context);
  }
  return nextResolve(specifier, context);
}
