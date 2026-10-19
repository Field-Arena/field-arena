#!/usr/bin/env node
/**
 * Executes a .sql file against the linked Supabase project.
 *
 * Why this exists rather than `supabase db reset --linked`: reset drops and
 * rebuilds everything including auth.users, which destroys real accounts. This
 * runs a single SQL file against the existing database, leaving auth untouched —
 * the right tool for applying supabase/seed.sql to a project that already has
 * users signed up.
 *
 * Requires SUPABASE_ACCESS_TOKEN and a linked project (supabase/.temp/project-ref,
 * written by `supabase link`). Reads .env.local if the token is not already in
 * the environment.
 *
 * Always a hosted project (it goes through the Management API by ref), so it
 * only runs when that ref is in FA_SCRIPT_ALLOWED_PROJECT_REFS and
 * --i-know-this-is-not-prod is passed (scripts/lib/target-guard.mjs). Never
 * allowlist production: supabase/seed.sql publishes demo organizations.
 *
 * Usage:
 *   node scripts/apply-sql.mjs supabase/seed.sql --i-know-this-is-not-prod
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertSafeTarget } from './lib/target-guard.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function loadEnvLocal() {
  try {
    const text = readFileSync(join(ROOT, '.env.local'), 'utf8');
    for (const line of text.split('\n')) {
      const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
      if (!match) continue;
      const [, key, rawValue] = match;
      if (process.env[key]) continue;
      process.env[key] = rawValue.replace(/^["']|["']$/g, '');
    }
  } catch {
    // .env.local is optional when the token is already exported.
  }
}

function projectRef() {
  if (process.env.SUPABASE_PROJECT_REF) return process.env.SUPABASE_PROJECT_REF;
  try {
    return readFileSync(join(ROOT, 'supabase', '.temp', 'project-ref'), 'utf8').trim();
  } catch {
    return null;
  }
}

const sqlPath = process.argv.slice(2).find((arg) => !arg.startsWith('--'));
if (!sqlPath) {
  console.error('usage: node scripts/apply-sql.mjs <file.sql> --i-know-this-is-not-prod');
  process.exit(1);
}

loadEnvLocal();

const token = process.env.SUPABASE_ACCESS_TOKEN;
const ref = projectRef();

if (!token) {
  console.error('SUPABASE_ACCESS_TOKEN is not set (and not found in .env.local).');
  process.exit(1);
}
if (!ref) {
  console.error('No project ref. Run `supabase link --project-ref <ref>` first.');
  process.exit(1);
}

assertSafeTarget({ script: 'apply-sql', ref });

const sql = readFileSync(resolve(sqlPath), 'utf8');
console.log(`Applying ${sqlPath} (${sql.length} bytes) to project ${ref}...`);

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: sql }),
});

const body = await res.text();

if (!res.ok) {
  console.error(`\nFailed (HTTP ${res.status}):\n${body}`);
  process.exit(1);
}

console.log('OK.');
if (body && body !== '[]') console.log(body.slice(0, 2000));
