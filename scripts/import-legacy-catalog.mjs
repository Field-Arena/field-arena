import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const envText = readFileSync('/home/haris-awais/devminified/FA/Field-Arena/.env.local', 'utf8');
const env = Object.fromEntries(
  envText
    .split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => {
      const idx = l.indexOf('=');
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
    }),
);

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const raw = JSON.parse(
  readFileSync(
    '/home/haris-awais/devminified/FA/field-and-arena-main/public/data/test-defs.json',
    'utf8',
  ),
);

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
