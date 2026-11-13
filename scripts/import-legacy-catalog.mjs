/**
 * One-off import of the legacy static app's test definitions
 * (public/data/test-defs.json) into scoring_catalog. It DELETES catalog rows
 * it replaces, so it only runs against a local Supabase, or an allowlisted
 * scratch project with --i-know-this-is-not-prod (scripts/lib/target-guard.mjs).
 *
 * Usage:
 *   LEGACY_TEST_DEFS_PATH=/path/to/test-defs.json node scripts/import-legacy-catalog.mjs
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY from the
 * environment or this repo's .env.local.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertSafeTarget } from './lib/target-guard.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function loadEnvLocal() {
  let text;
  try {
    text = readFileSync(join(ROOT, '.env.local'), 'utf8');
  } catch {
    return;
  }
  for (const line of text.split('\n')) {
    if (!line.includes('=') || line.trim().startsWith('#')) continue;
    const idx = line.indexOf('=');
    const key = line.slice(0, idx).trim();
    if (key && !process.env[key]) {
      process.env[key] = line
        .slice(idx + 1)
        .trim()
        .replace(/^["']|["']$/g, '');
    }
  }
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error('Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (env or .env.local).');
  process.exit(1);
}

assertSafeTarget({ script: 'import-legacy-catalog', url });

const defsPath = process.env.LEGACY_TEST_DEFS_PATH;
if (!defsPath) {
  console.error('Set LEGACY_TEST_DEFS_PATH to the legacy public/data/test-defs.json file.');
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const raw = JSON.parse(readFileSync(resolve(defsPath), 'utf8'));

function titleCase(s) {
  return s
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bUsef\b/g, 'USEF')
    .replace(/\bUsdf\b/g, 'USDF')
    .replace(/\bFei\b/g, 'FEI')
    .replace(/\bDsm\b/g, 'DSM')
    .replace(/\bDse\b/g, 'DSE')
    .replace(/\bCvi\b/g, 'CVI')
    .replace(/\bPsg\b/g, 'PSG')
    .replace(/\bB\/c\b/g, 'B/C')
    .replace(/\d+(st|nd|rd|th)\b/gi, (m) => m.toLowerCase());
}

function deriveTitle(key, def) {
  const code = (def.code || '').trim();
  if (code) {
    // "2023 USEF TRAINING LEVEL TEST 1" -> "Training Level Test 1"
    const stripped = code
      .replace(/^\d{4}\s*/, '')
      .replace(/^USEF\/?USDF\s*/i, '')
      .replace(/^USDF\s*/i, '')
      .replace(/^USEF\s*/i, '')
      .replace(/^FEI\s*/i, '')
      .trim();
    return titleCase(stripped || code);
  }
  return titleCase(key.replace(/^s-/, '').replace(/_/g, ' '));
}

function deriveLevel(title) {
  const t = title.toLowerCase();
  const patterns = [
    ['introductory', 'Introductory'],
    ['intro', 'Introductory'],
    ['training level', 'Training'],
    ['first level', 'First'],
    ['second level', 'Second'],
    ['third level', 'Third'],
    ['fourth level', 'Fourth'],
    ['prix st', 'PSG'],
    ['intermediate i freestyle', 'Intermediate I'],
    ['intermediate ii', 'Intermediate II'],
    ['intermediate i', 'Intermediate I'],
    ['intermediate a/b', 'Intermediate A/B'],
    ['intermediate a', 'Intermediate A'],
    ['intermediate b', 'Intermediate B'],
    ['grand prix special', 'Grand Prix'],
    ['grand prix freestyle', 'Grand Prix'],
    ['grand prix 16-25', 'Grand Prix'],
    ['short grand prix', 'Grand Prix'],
    ['grand prix', 'Grand Prix'],
    ['developing horse', 'Developing'],
    ['4-year-old', 'Young Horse'],
    ['4-year old', 'Young Horse'],
    ['5-year old', 'Young Horse'],
    ['6-year old', 'Young Horse'],
    ['7-year old', 'Young Horse'],
    ['four-year-old', 'Young Horse'],
    ['young horses', 'Young Horse'],
    ['children', 'Children'],
    ['pony riders', 'Pony Rider'],
    ['juniors', 'Junior'],
    ['young riders', 'Young Rider'],
    ['quadrille', 'Quadrille'],
    ['pas de deux', 'Pas de Deux'],
    ['pas-de-deux', 'Pas de Deux'],
  ];
  for (const [needle, label] of patterns) {
    if (t.includes(needle)) return label;
  }
  return null;
}

function deriveGoverningBody(def) {
  const gb = (def.governingBody || '').toUpperCase();
  if (gb.includes('FEI')) return 'FEI';
  if (gb.includes('USEF') || gb.includes('USDF')) return 'USEF';
  return null;
}

function convertMovements(movements) {
  return (movements || []).map((m) => ({
    n: m.num,
    coef: m.coef ?? 1,
    text: (m.test || '').replace(/\n/g, ' ').trim(),
    directive: (m.directives || '').trim() || undefined,
  }));
}

function convertCollectives(collectives) {
  return (collectives || []).map((c) => ({
    key: (c.name || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, ''),
    coef: c.coef ?? 1,
    label: titleCase((c.name || '').toLowerCase()),
    note: (c.note || '').trim() || undefined,
  }));
}

const rows = [];
const skipped = [];

for (const [key, def] of Object.entries(raw)) {
  if (!def.movements || def.movements.length === 0) {
    skipped.push(key);
    continue;
  }
  const title = deriveTitle(key, def);
  const level = deriveLevel(title);
  const governingBody = deriveGoverningBody(def);

  rows.push({
    title,
    level,
    discipline: 'Dressage',
    family: 'movement',
    governing_body: governingBody,
    source: 'legacy-import',
    source_file: key,
    def: {
      arena: def.arena || null,
      rideTime: def.rideTime || null,
      maxPoints: def.maxPoints ?? null,
      errorSchedule: def.errorScheduleText || null,
      movements: convertMovements(def.movements),
      collectives: convertCollectives(def.collectives),
    },
  });
}

console.log(`Prepared ${rows.length} rows to import, skipped ${skipped.length}:`, skipped);

// Remove the old placeholder/demo rows (source is null) before inserting the real catalog,
// so we don't end up with duplicate/half-real titles sitting next to the official set.
const { data: existing, error: exErr } = await admin
  .from('scoring_catalog')
  .select('id, title, source');
if (exErr) throw exErr;

const toDelete = existing.filter((r) => r.source === null).map((r) => r.id);
console.log(`Deleting ${toDelete.length} placeholder rows...`);
if (toDelete.length > 0) {
  const { error: delErr } = await admin.from('scoring_catalog').delete().in('id', toDelete);
  if (delErr) throw delErr;
}

// Insert in batches
const BATCH = 20;
let inserted = 0;
for (let i = 0; i < rows.length; i += BATCH) {
  const batch = rows.slice(i, i + BATCH);
  const { error } = await admin.from('scoring_catalog').insert(batch);
  if (error) {
    console.error('Insert error at batch', i, ':', error.message);
    process.exit(1);
  }
  inserted += batch.length;
}
console.log(`Inserted ${inserted} tests into scoring_catalog.`);
