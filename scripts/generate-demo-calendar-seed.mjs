#!/usr/bin/env node
/**
 * Generates the date-relative "show calendar" part of the Peachtree Dressage
 * Association sales demo:
 *
 *   supabase/seed/demo-shows-calendar.sql          (one transaction, re-runnable)
 *   supabase/seed/demo-shows-calendar-cleanup.sql  (removes only what it added)
 *   supabase/seed/demo-shows-calendar-verify.sql   (read-only state per show)
 *
 * Six published shows whose dates are offsets from the day the SQL RUNS
 * (today in America/New_York), not from when this script ran:
 *
 *   live         starts today, 2 days, tickets closed, schedule approved, 56 paid orders, staff + judge panel
 *   last-chance  starts today+2, tickets close tomorrow 8pm, 32 paid orders
 *   two-weeks    starts today+14, on sale since a week ago, 30 paid orders
 *   four-weeks   starts today+28 (1-day schooling show), on sale since 3 days ago, 8 paid orders
 *   seven-weeks  starts today+49, tickets open today+14, no orders
 *   ten-weeks    starts today+70, tickets open today+30, no orders
 *
 * Re-running the SQL later moves every date (show dates, ticket window,
 * published_at, class dates, order / waiver / stall timestamps, arrival and
 * departure) to the new "today" without adding a single row: every id is a
 * fixed md5-derived uuid and every insert is ON CONFLICT on it.
 *
 * Orders reuse the riders / horses of the main demo seed (imported from
 * generate-demo-seed.mjs, which must already be applied) and are priced in
 * SQL from the live catalog rows with the app's own formulas, exactly like
 * the main seed.
 *
 * Usage: node scripts/generate-demo-calendar-seed.mjs
 */
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  TAG as RIDER_TAG,
  ORG_ID,
  BLUE_RIDGE_ID,
  riders,
  VENUES,
  STABLING_NOTES,
} from './generate-demo-seed.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'supabase', 'seed');
const TAG = 'demo-calendar-2026-10';
const TZ = 'America/New_York';
// Only used to make sure a rider's account predates the orders picked for
// them. The SQL anchors every date on the day it runs, which is never earlier
// than this, so the ordering holds on every re-run.
const BASE_TODAY = '2026-10-07';

// ---------------------------------------------------------------------------
// Deterministic helpers (same shapes as the main generator, own seed / tag)
// ---------------------------------------------------------------------------
function uuid(key) {
  const h = createHash('md5').update(`${TAG}:${key}`).digest('hex').split('');
  h[12] = '4';
  h[16] = ((parseInt(h[16], 16) & 0x3) | 0x8).toString(16);
  const s = h.join('');
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20)}`;
}
function token(key, len) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = createHash('sha256').update(`${TAG}:${key}`).digest();
  let out = '';
  for (let i = 0; i < len; i++) out += alphabet[bytes[i % bytes.length] % alphabet.length];
  return out;
}
let prngState = 0xca1e2026;
function rand() {
  prngState |= 0;
  prngState = (prngState + 0x6d2b79f5) | 0;
  let t = Math.imul(prngState ^ (prngState >>> 15), 1 | prngState);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const int = (min, max) => min + Math.floor(rand() * (max - min + 1));
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const chance = (p) => rand() < p;
function weighted(entries) {
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = rand() * total;
  for (const [value, w] of entries) {
    r -= w;
    if (r < 0) return value;
  }
  return entries[entries.length - 1][0];
}
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const q = (v) => (v === null || v === undefined ? 'null' : `'${String(v).replace(/'/g, "''")}'`);
const qj = (v) => (v === null || v === undefined ? 'null' : `${q(JSON.stringify(v))}::jsonb`);
const DAY = 86400000;
const BASE_MS = Date.parse(`${BASE_TODAY}T00:00:00Z`);
function valuesBlock(rows, fn) {
  return rows.map((r) => `  (${fn(r).join(', ')})`).join(',\n');
}

// ---------------------------------------------------------------------------
// Venues (ids + rings as the main seed set them on the Peachtree venues)
// ---------------------------------------------------------------------------
const VENUE = Object.fromEntries(VENUES.map((v) => [v.id, v]));
const WILLS = 'b0000000-0000-4000-8000-000000000007';
const PEACHTREE_PARK = 'b0000000-0000-4000-8000-000000000008';
const CHATTAHOOCHEE = 'b0000000-0000-4000-8000-000000000009';
const SAVANNAH = 'b0000000-0000-4000-8000-00000000000a';
const RING_SIZE_LABEL = { standard: 'Standard (20m × 60m)', small: 'Small (20m × 40m)' };

// ---------------------------------------------------------------------------
// Shows. Offsets are days from "today" at run time.
// ---------------------------------------------------------------------------
const RATED_DOCS = (key) => [
  { id: `dr-${key}-coggins`, label: 'Coggins', requiresExpiration: true, requiresApproval: true },
  {
    id: `dr-${key}-health`,
    label: 'Health Certificate',
    requiresExpiration: true,
    requiresApproval: false,
  },
];
const SHOWS = [
  {
    key: 'live',
    name: 'Wills Park Dressage Classic',
    slug: 'wills-park-dressage-classic',
    venueId: WILLS,
    startOff: 0,
    days: 2,
    openOff: -42,
    closeOff: -3,
    closeTime: null,
    publishedOff: -45,
    runner: { ticketClosed: true, approved: true },
    showType: 'rated',
    bodies: ['USEF', 'USDF'],
    riderStart: 201,
    orders: 56,
    stableP: 0.74,
    staff: true,
    feeBump: 0,
    expenses: [
      ['Judge fees', 3600],
      ['Facility rental', 5200],
      ['Ribbons and awards', 980],
      ['Shavings', 1400],
      ['EMT and farrier on call', 900],
    ],
  },
  {
    key: 'last-chance',
    name: 'Chattahoochee River Dressage Days',
    slug: 'chattahoochee-river-dressage-days',
    venueId: CHATTAHOOCHEE,
    startOff: 2,
    days: 2,
    openOff: -35,
    closeOff: 1,
    closeTime: '20:00',
    publishedOff: -38,
    runner: {},
    showType: 'rated',
    bodies: ['USEF', 'USDF'],
    riderStart: 301,
    orders: 32,
    stableP: 0.7,
    staff: true,
    feeBump: 0,
    expenses: [
      ['Judge fees', 3400],
      ['Facility rental', 4800],
      ['Ribbons and awards', 900],
    ],
  },
  {
    key: 'two-weeks',
    name: 'Lowcountry Dressage Festival',
    slug: 'lowcountry-dressage-festival',
    venueId: SAVANNAH,
    startOff: 14,
    days: 2,
    openOff: -7,
    closeOff: 10,
    closeTime: '23:59',
    publishedOff: -9,
    runner: {},
    showType: 'rated',
    bodies: ['USEF', 'USDF'],
    riderStart: 401,
    orders: 30,
    stableP: 0.68,
    staff: false,
    feeBump: 0,
    expenses: [],
  },
  {
    key: 'four-weeks',
    name: 'Peachtree Park Schooling Show',
    slug: 'peachtree-park-schooling-show',
    venueId: PEACHTREE_PARK,
    startOff: 28,
    days: 1,
    openOff: -3,
    closeOff: 24,
    closeTime: null,
    publishedOff: -5,
    runner: {},
    showType: 'schooling',
    bodies: [],
    riderStart: 501,
    orders: 8,
    stableP: 0.3,
    staff: false,
    feeBump: 0,
    expenses: [],
  },
  {
    key: 'seven-weeks',
    name: 'North Georgia Dressage Invitational',
    slug: 'north-georgia-dressage-invitational',
    venueId: WILLS,
    startOff: 49,
    days: 2,
    openOff: 14,
    closeOff: 45,
    closeTime: null,
    publishedOff: -2,
    runner: {},
    showType: 'rated',
    bodies: ['USEF', 'USDF'],
    riderStart: 601,
    orders: 0,
    stableP: 0,
    staff: false,
    feeBump: 0,
    expenses: [],
  },
  {
    key: 'ten-weeks',
    name: 'Southeast Regional Dressage Championships',
    slug: 'southeast-regional-dressage-championships',
    venueId: CHATTAHOOCHEE,
    startOff: 70,
    days: 3,
    openOff: 30,
    closeOff: 66,
    closeTime: null,
    publishedOff: -1,
    runner: {},
    showType: 'rated',
    bodies: ['USEF', 'USDF'],
    riderStart: 701,
    orders: 0,
    stableP: 0,
    staff: false,
    feeBump: 10,
    expenses: [],
  },
];
for (const s of SHOWS) {
  s.id = uuid(`show:${s.key}`);
  s.rings = VENUE[s.venueId].rings;
}

// ---------------------------------------------------------------------------
// Offered classes — same catalog-linked layout as the main seed's showcase
// show (Group — Test, award_scope group), placed on a show day + ring.
// ---------------------------------------------------------------------------
const LEVELS = ['intro', 'training', 'first', 'second', 'third', 'fourth', 'psg', 'i1', 'gp'];
const USEF_TESTS = {
  intro: ['Introductory Test A', 'Introductory Test B', 'Introductory Test C'],
  training: ['Training Level Test 1', 'Training Level Test 2', 'Training Level Test 3'],
  first: ['First Level Test 1', 'First Level Test 2', 'First Level Test 3'],
  second: ['Second Level Test 1', 'Second Level Test 2', 'Second Level Test 3'],
  third: ['Third Level Test 1', 'Third Level Test 2', 'Third Level Test 3'],
  fourth: ['Fourth Level Test 1', 'Fourth Level Test 2', 'Fourth Level Test 3'],
};
const USEF_GROUP = {
  intro: 'Introductory',
  training: 'Training Level',
  first: 'First Level',
  second: 'Second Level',
  third: 'Third Level',
  fourth: 'Fourth Level',
};
const FEI = {
  psg: ['Prix St. Georges', 'Prix St. Georges (2026)'],
  i1: ['Intermediate I', 'Intermediate I (2026)'],
  gp: ['Grand Prix', 'Grand Prix (2026)'],
};
const SOURCE_FILE = {
  'Introductory Test A': 's-2023_Intro_A',
  'Introductory Test B': 's-2023_Intro_B',
  'Introductory Test C': 's-2023_Intro_C',
  'Training Level Test 1': 's-2023_Training_1_4_7',
  'Training Level Test 2': 's-2023_Training_2_4_7',
  'Training Level Test 3': 's-2023_Training_3_4_7',
  'First Level Test 1': 's-2023_First_Level_Test_1_4_12',
  'First Level Test 2': 's-2023_First_Level_Test_2_8_30',
  'First Level Test 3': 's-2023_First_Level_Test_3_10_4',
  'Second Level Test 1': 's-2023_Second_Level_Test_1_8_30',
  'Second Level Test 2': 's-2023_Second_Level_Test_2_8_30',
  'Second Level Test 3': 's-2023_Second_Level_Test_3_4_20',
  'Third Level Test 1': 's-2023_Third_Level_Test_1_8_30',
  'Third Level Test 2': 's-2023_Third_Level_Test_2_4_20',
  'Third Level Test 3': 's-2023_Third_Level_Test_3',
  'Fourth Level Test 1': 's-2023_Fourth_Level_Test_1__8_30',
  'Fourth Level Test 2': 's-2023_Fourth_Level_Test_2',
  'Fourth Level Test 3': 's-2023_Fourth_Level_Test_3_10_1',
  'Prix St. Georges': 's-Prix_St__Georges_2026',
  'Intermediate I': 's-Intermediate_I_2026_0',
  'Grand Prix': 's-Grand_Prix_2026_0',
};
const RATED_FEE = {
  intro: 55,
  training: 65,
  first: 70,
  second: 75,
  third: 80,
  fourth: 85,
  psg: 110,
  i1: 115,
  gp: 125,
};
const SCHOOLING_FEE = { intro: 35, training: 40, first: 45, second: 50 };
const SCHOOLING_LEVELS = ['intro', 'training', 'first', 'second'];

/** Ring index for a level: big rings for upper levels, the small ring (if any) for the lowest. */
function ringFor(show, level) {
  const li = LEVELS.indexOf(level);
  if (show.rings.length >= 3) return li <= 1 ? 2 : li <= 3 ? 1 : 0;
  if (show.showType === 'schooling') return li <= 1 ? 1 : 0;
  return li <= 2 ? 1 : 0;
}

const classes = [];
for (const show of SHOWS) {
  const levels = show.showType === 'schooling' ? SCHOOLING_LEVELS : LEVELS;
  const rows = [];
  levels.forEach((level, li) => {
    const tests = FEI[level] ? [FEI[level][1]] : USEF_TESTS[level];
    tests.forEach((test, ti) => {
      const group = FEI[level] ? FEI[level][0] : USEF_GROUP[level];
      const fee =
        show.showType === 'schooling'
          ? SCHOOLING_FEE[level]
          : RATED_FEE[level] + (show.feeBump ?? 0);
      const ring = show.rings[ringFor(show, level)];
      const dayIdx = FEI[level] ? li % show.days : (ti + li) % show.days;
      rows.push({
        id: uuid(`class:${show.key}:${test}`),
        show,
        level,
        label: `${group} — ${test}`,
        event: FEI[level] ? 'FEI' : 'Introductory through Fourth Level',
        group,
        fee,
        sourceFile: SOURCE_FILE[FEI[level] ? group : test],
        dayIdx,
        ring: ring.name,
        arena: RING_SIZE_LABEL[ring.size],
        rank: li * 10 + ti,
      });
    });
  });
  // run_order: 0-based within (show day, ring), lowest level first.
  const slots = new Map();
  for (const c of [...rows].sort((a, b) => a.rank - b.rank)) {
    const k = `${c.dayIdx}|${c.ring}`;
    c.runOrder = slots.get(k) ?? 0;
    slots.set(k, c.runOrder + 1);
  }
  classes.push(...rows);
}
const classByShowLabel = new Map(classes.map((c) => [`${c.show.key}|${c.label}`, c]));

function menuFor(show, level) {
  if (show.showType === 'schooling' && !SCHOOLING_LEVELS.includes(level)) return [];
  if (FEI[level]) return [`${FEI[level][0]} — ${FEI[level][1]}`];
  return USEF_TESTS[level].map((t) => `${USEF_GROUP[level]} — ${t}`);
}

// Stabling add-ons, priced by show length.
const addOns = [];
for (const show of SHOWS) {
  const nights = Math.max(1, show.days);
  const box = show.days === 1 ? 95 : show.days === 2 ? 150 : 210;
  const tack = show.days === 1 ? 70 : show.days === 2 ? 120 : 165;
  const rows = [
    ['Box Stall — Full Show', box, 1, 0, 0, nights, show.days === 1 ? 40 : 120],
    ['Day Stall', 45, 1, 0, 0, 0, 30],
    ['Tack Stall — Full Show', tack, 0, 1, 0, nights, 30],
    ['Shavings — per bag', 12, 0, 0, 1, 0, null],
    ['Early Arrival — extra night', 40, 0, 0, 0, 1, null],
    ['RV / Camper Hookup — per night', 55, 0, 0, 0, 1, 20],
  ];
  for (const [name, price, stalls, tackN, shavings, n, qty] of rows) {
    addOns.push({
      id: uuid(`addon:${show.key}:${name}`),
      show,
      name,
      price,
      stalls,
      tack: tackN,
      shavings,
      nights: n,
      qty,
    });
  }
}

const VENDOR_ITEMS = [
  ['10x10 Booth', 250, 20],
  ['10x20 Booth', 425, 10],
  ['20x20 Corner Booth', 700, 4],
  ['Food Truck Space', 300, 6],
  ['Electric Hookup — 20 amp / 110V', 75, null],
  ['Electric Hookup — 50 amp / 220V', 150, null],
  ['Water Hookup', 50, null],
  ['Additional 6ft Table', 25, null],
];
const vendorItems = SHOWS.flatMap((show) =>
  VENDOR_ITEMS.map(([name, price, qty]) => ({
    id: uuid(`vendor-item:${show.key}:${name}`),
    show,
    name,
    price,
    qty,
  })),
);

const divisions = SHOWS.flatMap((show) =>
  ['Junior Rider', 'Adult Amateur', 'Open'].map((name, position) => ({
    id: uuid(`division:${show.key}:${name}`),
    show,
    name,
    position,
  })),
);

// Staff copied from Blue Ridge's accepted crew (same people / logins), plus a
// C-judge + scribe seat on every class so live scoring works out of the box.
const STAFF_EMAILS = [
  'elena.marsh@fieldarena-demo.test',
  'tom.reyes@fieldarena-demo.test',
  'dana.boyd@fieldarena-demo.test',
  'sam.whitfield@fieldarena-demo.test',
  'marcus.hale@fieldarena-demo.test',
];
const staff = SHOWS.filter((s) => s.staff).flatMap((show) =>
  STAFF_EMAILS.map((email) => ({ id: uuid(`staff:${show.key}:${email}`), show, email })),
);
const panel = classes
  .filter((c) => c.show.staff)
  .map((c) => ({
    id: uuid(`panel:${c.id}`),
    classId: c.id,
    judge: uuid(`staff:${c.show.key}:elena.marsh@fieldarena-demo.test`),
    scribe: uuid(`staff:${c.show.key}:tom.reyes@fieldarena-demo.test`),
  }));

// ---------------------------------------------------------------------------
// Orders — existing demo riders, spread so nobody enters the same show twice
// and riders already busy in another calendar show come last.
// ---------------------------------------------------------------------------
const usage = new Map();
const orderRows = [];
const lineRows = [];
let orderN = 0;
for (const show of SHOWS) {
  if (!show.orders) continue;
  const lastDay = show.key === 'live' ? show.closeOff : -1; // never today or later
  // Pick each order's day first (skewed late, like real entries), then a
  // rider whose account already existed that day.
  const days = Array.from({ length: show.orders }, () => {
    const u = 1 - (1 - rand()) ** 1.7;
    return show.openOff + Math.floor(u * (lastDay - show.openOff + 1));
  }).sort((a, b) => a - b);
  const taken = new Set();
  const chosen = [];
  for (const day of days) {
    const pool = shuffle(riders)
      .filter(
        (r) =>
          !taken.has(r.n) &&
          r.createdAt < BASE_MS + day * DAY &&
          r.horses.some((h) => menuFor(show, h.level).length > 0),
      )
      .sort((a, b) => (usage.get(a.n) ?? 0) - (usage.get(b.n) ?? 0));
    const rider = pool[0];
    if (!rider) throw new Error(`no eligible rider for ${show.key} day ${day}`);
    taken.add(rider.n);
    usage.set(rider.n, (usage.get(rider.n) ?? 0) + 1);
    chosen.push({ rider, day });
  }

  for (const { rider, day } of chosen) {
    const n = ++orderN;
    const id = uuid(`order:${n}`);
    // Local wall-clock seconds-of-day, 7:00am–10:59pm.
    const secs = (7 + int(0, 15)) * 3600 + int(0, 59) * 60 + int(0, 59);
    const checkoutSecs = int(2, 9) * 60 + int(0, 59);

    const horsesIn = rider.horses.filter((h) => menuFor(show, h.level).length > 0);
    const lines = [];
    const used = new Set();
    const singleCount = weighted([
      [1, 33],
      [2, 57],
      [3, 10],
    ]);
    const plan = horsesIn.length === 1 ? [singleCount] : [chance(0.5) ? 2 : 1, 1];
    horsesIn.forEach((horse, hi) => {
      const want = plan[hi];
      const picked = [];
      for (const label of shuffle(menuFor(show, horse.level).filter((l) => !used.has(l)))) {
        if (picked.length >= want) break;
        picked.push(label);
      }
      const next = LEVELS[LEVELS.indexOf(horse.level) + 1];
      if (next && picked.length >= 1 && want >= 2 && chance(0.15) && horse.level !== 'i1') {
        const up = menuFor(show, next).filter((l) => !used.has(l) && !picked.includes(l));
        if (up.length) picked[picked.length - 1] = pick(up);
      }
      if (picked.length < want && next) {
        for (const label of menuFor(show, next)) {
          if (picked.length < want && !used.has(label) && !picked.includes(label))
            picked.push(label);
        }
      }
      for (const label of picked) {
        if (!classByShowLabel.has(`${show.key}|${label}`)) throw new Error(`no class ${label}`);
        used.add(label);
        lines.push({ kind: 'class_entry', label, horseId: horse.id });
      }
    });

    let stablingRequest = null;
    let arrivalOff = null;
    let departs = false;
    if (chance(show.stableP)) {
      let overnight = 0;
      const stallLines = new Map();
      for (let h = 0; h < horsesIn.length; h++) {
        const kind = weighted([
          ['Box Stall — Full Show', show.days === 1 ? 55 : 88],
          ['Day Stall', show.days === 1 ? 45 : 12],
        ]);
        stallLines.set(kind, (stallLines.get(kind) ?? 0) + 1);
        if (kind !== 'Day Stall') overnight++;
      }
      for (const [name, qty] of stallLines) lines.push({ kind: 'addon', name, qty });
      if (overnight && chance(0.8))
        lines.push({
          kind: 'addon',
          name: 'Shavings — per bag',
          qty: overnight * (show.days >= 3 ? int(3, 5) : int(2, 4)),
        });
      if (chance(0.2)) lines.push({ kind: 'addon', name: 'Tack Stall — Full Show', qty: 1 });
      let early = false;
      if (overnight && chance(0.12)) {
        early = true;
        lines.push({ kind: 'addon', name: 'Early Arrival — extra night', qty: overnight });
      }
      if (chance(0.06))
        lines.push({
          kind: 'addon',
          name: 'RV / Camper Hookup — per night',
          qty: Math.max(1, show.days),
        });
      const mates = chosen.filter((c) => c.rider !== rider && c.rider.barn === rider.barn);
      stablingRequest = { trainerName: rider.barn.name };
      if (chance(0.3)) {
        const mate = mates.length && chance(0.7) ? pick(mates).rider : null;
        stablingRequest.stableWith = mate
          ? `${mate.first} ${mate.last}`
          : `${rider.barn.name} group`;
      }
      if (horsesIn.some((h) => h.stallion))
        stablingRequest.notes = 'Stallion — please stall at the end of the aisle.';
      else if (chance(0.15)) stablingRequest.notes = pick(STABLING_NOTES);
      if (chance(0.85)) {
        arrivalOff = overnight ? (early ? -2 : -1) : 0;
        departs = true;
      }
    }

    orderRows.push({
      id,
      show,
      riderId: rider.id,
      day,
      secs,
      checkoutSecs,
      pi: `pi_demo_${token(`pi:${n}`, 24)}`,
      arrivalOff,
      departs,
      stablingRequest,
      stablingId: uuid(`stabling:${n}`),
      waiverId: uuid(`waiver:${n}`),
    });
    lines.forEach((line, li) =>
      lineRows.push({
        ...line,
        orderId: id,
        lineNo: li + 1,
        entryId: line.kind === 'class_entry' ? uuid(`entry:${n}:${li + 1}`) : null,
      }),
    );
  }
}

// ---------------------------------------------------------------------------
// SQL
// ---------------------------------------------------------------------------
const showIds = SHOWS.map((s) => q(s.id)).join(', ');
const riderIds = [...new Set(orderRows.map((o) => o.riderId))];
const summary = SHOWS.map(
  (s) =>
    `--   ${s.key.padEnd(12)} today${s.startOff >= 0 ? '+' : ''}${s.startOff}, ${s.days} day(s), ` +
    `tickets ${s.openOff} .. ${s.closeOff}${s.closeTime ? ` ${s.closeTime}` : ''}, ` +
    `${orderRows.filter((o) => o.show === s).length} orders — ${s.name}`,
).join('\n');

const ACT_AS_ORGANIZER = `do $$
declare
  actor uuid;
begin
  select u.id into actor from public.users u
   where u.platform_role = 'Organizer' and u.org_id = ${q(ORG_ID)}
   order by u.created_at limit 1;
  if actor is null then
    select u.id into actor from public.users u where u.platform_role = 'SuperAdmin' order by u.created_at limit 1;
  end if;
  if actor is null then
    raise exception 'No Organizer or SuperAdmin user to act as';
  end if;
  perform set_config('request.jwt.claims', json_build_object('sub', actor, 'role', 'authenticated')::text, true);
end $$;`;

const seed = `-- =============================================================================
-- Peachtree Dressage Association — date-relative show calendar (${TAG})
-- GENERATED by scripts/generate-demo-calendar-seed.mjs — do not edit by hand.
-- Apply:   scripts/apply-demo-seed.sh --calendar
-- Remove:  scripts/apply-demo-seed.sh --calendar-cleanup
-- Check:   scripts/apply-demo-seed.sh --calendar-verify
--
-- Needs the main demo seed (demo-business-seed.sql, ${RIDER_TAG}) first: the
-- orders reuse its riders and horses.
--
-- Every date below is an offset from TODAY IN ${TZ} at the moment this
-- runs ((now() at time zone '${TZ}')::date — plain current_date is the UTC
-- day, which is already "tomorrow" every US evening). Re-running it later
-- moves show dates, ticket windows, class dates, and order / waiver / stall
-- timestamps to the new today without adding rows (fixed ids, ON CONFLICT).
--
${summary}
--
-- Triggers: nothing is disabled. Class INSERTs and class_entries INSERTs
-- (holding = false) are not gated; the class date / time UPDATEs at the end
-- are gated by classes_write_permission_check (canEditShow), so that one step
-- runs as the org's Organizer via a transaction-local request.jwt.claims,
-- the same way the main cleanup passes the class_entries delete guard.
-- =============================================================================
begin;

-- ---------------------------------------------------------------------------
-- 0. Preconditions
-- ---------------------------------------------------------------------------
do $$
declare
  n int;
begin
  if not exists (select 1 from public.organizations where id = ${q(ORG_ID)} and deleted_at is null) then
    raise exception 'Demo org ${ORG_ID} (Peachtree Dressage Association) is missing';
  end if;
  select count(*) into n from public.venues where id in (${q(WILLS)}, ${q(PEACHTREE_PARK)}, ${q(CHATTAHOOCHEE)}, ${q(SAVANNAH)}) and org_id = ${q(ORG_ID)};
  if n <> 4 then raise exception 'Expected the 4 Peachtree venues, found %', n; end if;
  select count(*) into n from public.riders where id in (
${riderIds.map((id) => `    ${q(id)}`).join(',\n')}
  );
  if n <> ${riderIds.length} then
    raise exception 'Only % of ${riderIds.length} demo riders exist — apply supabase/seed/demo-business-seed.sql first', n;
  end if;
  select count(*) into n from public.shows
   where slug in (${SHOWS.map((s) => q(s.slug)).join(', ')}) and id not in (${showIds});
  if n > 0 then raise exception 'A calendar show slug is already used by another show (% clashes)', n; end if;
end $$;

-- ---------------------------------------------------------------------------
-- 1. Shows — dates relative to today in ${TZ}
-- ---------------------------------------------------------------------------
create temp table _cal_today on commit drop as
select (now() at time zone '${TZ}')::date as d0;

create temp table _cal_shows on commit drop as
select v.id::uuid as id, v.key, v.name, v.slug, v.venue_id::uuid as venue_id, v.days,
       t.d0 + v.start_off as start_d,
       t.d0 + v.start_off + v.days - 1 as end_d,
       t.d0 + v.open_off as open_d,
       t.d0 + v.close_off as close_d,
       v.close_time,
       ((t.d0 + v.published_off)::timestamp + time '09:30') at time zone '${TZ}' as published_at,
       v.runner_state, v.show_type, v.governing_bodies, v.locations, v.starting_rider_number,
       v.document_requirements, v.expenses
from (values
${valuesBlock(SHOWS, (s) => [
  q(s.id),
  q(s.key),
  q(s.name),
  q(s.slug),
  q(s.venueId),
  s.days,
  s.startOff,
  s.openOff,
  s.closeOff,
  q(s.closeTime),
  s.publishedOff,
  qj(s.runner),
  q(s.showType),
  qj(s.bodies),
  qj(s.rings),
  s.riderStart,
  qj(s.showType === 'schooling' ? RATED_DOCS(s.key).slice(0, 1) : RATED_DOCS(s.key)),
  qj(s.expenses.map(([label, amount], i) => ({ id: `e${i + 1}`, label, amount }))),
])}
) as v(id, key, name, slug, venue_id, days, start_off, open_off, close_off, close_time, published_off,
       runner_state, show_type, governing_bodies, locations, starting_rider_number, document_requirements, expenses)
cross join _cal_today t;

insert into public.shows (
  id, org_id, venue_id, venue_name, name, slug, date_label, start_date, end_date, status, disciplines, governing_bodies,
  show_type, published, published_at, timezone, ticket_open, ticket_close, locations, day_start_times, day_end_times,
  runner_state, show_details, starting_rider_number, document_requirements, waiver_text, waiver_approved_at,
  waiver_approved_text, expenses, created_at
)
select s.id, ${q(ORG_ID)}, s.venue_id, v.name, s.name, s.slug,
       case when s.start_d = s.end_d then to_char(s.start_d, 'Mon FMDD, YYYY')
            else to_char(s.start_d, 'Mon FMDD') || ' – ' || to_char(s.end_d, 'Mon FMDD, YYYY') end,
       to_char(s.start_d, 'YYYY-MM-DD'), to_char(s.end_d, 'YYYY-MM-DD'),
       'green', '["Dressage"]'::jsonb, s.governing_bodies, s.show_type, true, s.published_at, '${TZ}',
       to_char(s.open_d, 'YYYY-MM-DD'),
       to_char(s.close_d, 'YYYY-MM-DD') || coalesce(' ' || s.close_time, ''),
       s.locations,
       (select jsonb_agg('08:00'::text) from generate_series(1, s.days)),
       (select jsonb_agg('17:00'::text) from generate_series(1, s.days)),
       s.runner_state,
       jsonb_build_object('org', 'Peachtree Dressage Association', 'phone', '770-555-0142',
                          'website', 'https://www.peachtreedressage.example',
                          'contactEmail', 'secretary@fieldarena-demo.test',
                          'prizeListUrl', 'https://www.peachtreedressage.example/prize-lists/' || s.slug),
       s.starting_rider_number, s.document_requirements,
       w.waiver_text, case when w.waiver_text is not null then s.published_at - interval '15 minutes' end, w.waiver_text,
       s.expenses, s.published_at - interval '6 days'
from _cal_shows s
join public.venues v on v.id = s.venue_id
cross join (select coalesce((select waiver_text from public.shows where id = ${q(BLUE_RIDGE_ID)}),
                            (select waiver_text from public.shows where org_id = ${q(ORG_ID)} and waiver_text is not null
                              order by created_at limit 1)) as waiver_text) w
on conflict (id) do update set
  date_label   = excluded.date_label,
  start_date   = excluded.start_date,
  end_date     = excluded.end_date,
  ticket_open  = excluded.ticket_open,
  ticket_close = excluded.ticket_close,
  published    = true,
  published_at = excluded.published_at,
  runner_state = excluded.runner_state,
  waiver_approved_at = case when shows.waiver_approved_text is not null then excluded.waiver_approved_at end
where shows.start_date is distinct from excluded.start_date
   or shows.ticket_open is distinct from excluded.ticket_open
   or shows.ticket_close is distinct from excluded.ticket_close
   or shows.published is distinct from true
   or shows.runner_state is distinct from excluded.runner_state;

insert into public.divisions (id, show_id, name, position)
values
${valuesBlock(divisions, (d) => [q(d.id), q(d.show.id), q(d.name), d.position])}
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- 2. Offered classes on a show day + ring, linked to their official sheet the
--    way official-sheets.ts resolves it (exactly one scoring_catalog row with
--    that source_file, and it has something to score)
-- ---------------------------------------------------------------------------
create temp table _cal_classes on commit drop as
select v.id::uuid as id, v.show_id::uuid as show_id, v.label, v.event, v.group_name, v.fee::numeric as fee,
       v.source_file, v.day_idx, v.location, v.arena, v.run_order,
       to_char(s.start_d + v.day_idx, 'YYYY-MM-DD') as date
from (values
${valuesBlock(classes, (c) => [q(c.id), q(c.show.id), q(c.label), q(c.event), q(c.group), c.fee, q(c.sourceFile), c.dayIdx, q(c.ring), q(c.arena), c.runOrder])}
) as v(id, show_id, label, event, group_name, fee, source_file, day_idx, location, arena, run_order)
join _cal_shows s on s.id = v.show_id::uuid;

insert into public.classes (id, show_id, label, event, group_name, division, fee, judges_count, ribbon_places, arena,
                            location, date, run_order, award_scope, catalog_id)
select c.id, c.show_id, c.label, c.event, c.group_name, c.group_name, c.fee, 1, 6, c.arena, c.location, c.date,
       c.run_order, 'group',
       (select min(sc.id::text) from public.scoring_catalog sc
         where sc.source_file = c.source_file
           and exists (select 1 from unnest(array['movements', 'collectives', 'technical', 'artistic', 'criteria', 'categories']) k(key)
                        where jsonb_typeof(sc.def -> k.key) = 'array' and jsonb_array_length(sc.def -> k.key) > 0)
        having count(*) = 1
           and (select count(*) from public.scoring_catalog x where x.source_file = c.source_file) = 1)
from _cal_classes c
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 3. Stabling add-ons and vendor booth / hookup catalog
-- ---------------------------------------------------------------------------
insert into public.add_ons (id, show_id, name, price, enabled, qty, stalls, tack, shavings, nights)
select v.id::uuid, v.show_id::uuid, v.name, v.price::numeric, true, v.qty::int, v.stalls, v.tack, v.shavings, v.nights
from (values
${valuesBlock(addOns, (a) => [q(a.id), q(a.show.id), q(a.name), a.price, a.qty ?? 'null', a.stalls, a.tack, a.shavings, a.nights])}
) as v(id, show_id, name, price, qty, stalls, tack, shavings, nights)
on conflict do nothing;

insert into public.vendor_items (id, show_id, name, price, enabled, qty)
select v.id::uuid, v.show_id::uuid, v.name, v.price::numeric, true, v.qty::int
from (values
${valuesBlock(vendorItems, (a) => [q(a.id), q(a.show.id), q(a.name), a.price, a.qty ?? 'null'])}
) as v(id, show_id, name, price, qty)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- 4. Show staff (Blue Ridge's accepted crew) + a C-judge / scribe seat per class
-- ---------------------------------------------------------------------------
insert into public.staff_assignments (id, show_id, name, first_name, last_name, role, phone, email, status, is_steward,
                                      can_scratch_skip_dq, can_view_money, permissions, user_id, license, created_at)
select v.id::uuid, v.show_id::uuid, br.name, br.first_name, br.last_name, br.role, br.phone, br.email, 'accepted',
       br.is_steward, br.can_scratch_skip_dq, br.can_view_money, br.permissions, br.user_id, br.license,
       s.published_at - interval '2 days'
from (values
${valuesBlock(staff, (s) => [q(s.id), q(s.show.id), q(s.email)])}
) as v(id, show_id, email)
join _cal_shows s on s.id = v.show_id::uuid
join public.staff_assignments br on br.show_id = ${q(BLUE_RIDGE_ID)} and lower(br.email) = v.email
on conflict do nothing;

insert into public.class_panel (id, class_id, seat_id, position, judge_staff_id, scribe_staff_id)
select v.id::uuid, v.class_id::uuid, 'J1', 'C',
       (select id from public.staff_assignments where id = v.judge::uuid),
       (select id from public.staff_assignments where id = v.scribe::uuid)
from (values
${valuesBlock(panel, (p) => [q(p.id), q(p.classId), q(p.judge), q(p.scribe)])}
) as v(id, class_id, judge, scribe)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- 5. Orders — staged with day offsets, then priced from the live catalog
-- ---------------------------------------------------------------------------
create temp table _cal_orders on commit drop as
select v.id::uuid as id, v.rider_id::uuid as rider_id, v.show_id::uuid as show_id,
       ((t.d0 + v.day_off)::timestamp + make_interval(secs => v.secs)) at time zone '${TZ}' as paid_at,
       ((t.d0 + v.day_off)::timestamp + make_interval(secs => v.secs - v.checkout_secs)) at time zone '${TZ}' as created_at,
       v.pi,
       case when v.arrival_off is not null then to_char(s.start_d + v.arrival_off, 'YYYY-MM-DD') end as arrival_date,
       case when v.departs then to_char(s.end_d, 'YYYY-MM-DD') end as departure_date,
       v.stabling_request, v.stabling_id::uuid as stabling_id, v.waiver_id::uuid as waiver_id
from (values
${valuesBlock(orderRows, (o) => [q(o.id), q(o.riderId), q(o.show.id), o.day, o.secs, o.checkoutSecs, q(o.pi), o.arrivalOff ?? 'null::int', o.departs, qj(o.stablingRequest), q(o.stablingId), q(o.waiverId)])}
) as v(id, rider_id, show_id, day_off, secs, checkout_secs, pi, arrival_off, departs, stabling_request, stabling_id, waiver_id)
join _cal_shows s on s.id = v.show_id::uuid
cross join _cal_today t;

create temp table _cal_lines (
  order_id uuid, line_no int, kind text, class_label text, horse_id uuid, addon_name text, qty int, entry_id uuid,
  primary key (order_id, line_no)
) on commit drop;
insert into _cal_lines values
${valuesBlock(lineRows, (l) => [q(l.orderId), l.lineNo, q(l.kind), q(l.kind === 'class_entry' ? l.label : null), q(l.kind === 'class_entry' ? l.horseId : null), q(l.kind === 'addon' ? l.name : null), l.kind === 'addon' ? l.qty : 1, q(l.entryId)])};

-- Pricing mirrors the app exactly (same as demo-business-seed.sql):
--   class line   unitPrice = round2(fee + calcPlatformFee(fee, org.fee_model))
--                calcPlatformFee: gmo -> 18%; fee <= 75 -> 7.99; else max(7.99, 8%)
--   add-on line  unitPrice = round2(price * 1.08), amount = round2(unitPrice * qty)
--   fee_total    = round2(sum of the unrounded platform fees)
create temp table _cal_items on commit drop as
with resolved as (
  select l.*, o.show_id, org.fee_model,
         c.id as class_id, c.label as class_label_live, greatest(coalesce(c.fee, 0), 0) as class_fee,
         h.name as horse_name,
         a.id as addon_id, a.name as addon_name_live, greatest(coalesce(a.price, 0), 0) as addon_price,
         coalesce(a.stalls, 0) as stalls, coalesce(a.tack, 0) as tack
  from _cal_lines l
  join _cal_orders o on o.id = l.order_id
  join public.shows s on s.id = o.show_id
  join public.organizations org on org.id = s.org_id
  left join public.classes c on l.kind = 'class_entry' and c.show_id = o.show_id and c.label = l.class_label
  left join public.horses h on h.id = l.horse_id
  left join public.add_ons a on l.kind = 'addon' and a.show_id = o.show_id and a.name = l.addon_name
),
fees as (
  select r.*,
         case when r.kind = 'class_entry' then
           case when r.fee_model = 'gmo' then r.class_fee * 0.18
                when r.class_fee <= 75 then 7.99
                else greatest(7.99, r.class_fee * 0.08) end
         else r.addon_price * 0.08 * r.qty end as platform_fee,
         case when r.kind = 'class_entry' then
           round(r.class_fee + case when r.fee_model = 'gmo' then r.class_fee * 0.18
                                    when r.class_fee <= 75 then 7.99
                                    else greatest(7.99, r.class_fee * 0.08) end, 2)
         else round(r.addon_price + r.addon_price * 0.08, 2) end as unit_price
  from resolved r
)
select f.*,
       case when f.kind = 'class_entry' then f.unit_price else round(f.unit_price * f.qty, 2) end as amount
from fees f;

do $$
declare
  bad int;
begin
  select count(*) into bad from _cal_items
   where (kind = 'class_entry' and (class_id is null or horse_name is null))
      or (kind = 'addon' and addon_id is null);
  if bad > 0 then
    raise exception 'Calendar seed: % order lines did not resolve to a live class / horse / add-on', bad;
  end if;
end $$;

-- Re-run: only the timestamps / stay dates move; money and items never change.
insert into public.orders (
  id, rider_id, show_id, stripe_payment_intent_id, amount_total, status, items, fee_total, refunded_amount,
  created_at, paid_at, arrival_date, departure_date, additional_charges_total, additional_charges, stabling_request, refund_log
)
select o.id, o.rider_id, o.show_id, o.pi, t.total, 'paid', t.items, t.fee_total, 0,
       o.created_at, o.paid_at, o.arrival_date, o.departure_date, 0, '[]'::jsonb, o.stabling_request, '[]'::jsonb
from _cal_orders o
join (
  select order_id,
         jsonb_agg(
           case when kind = 'class_entry' then jsonb_build_object(
                  'kind', 'class_entry', 'label', class_label_live || ' — ' || horse_name, 'classId', class_id,
                  'horseId', horse_id, 'qty', 1, 'unitPrice', trim_scale(unit_price), 'amount', trim_scale(amount))
                else jsonb_build_object(
                  'kind', 'addon', 'label', addon_name_live, 'refId', addon_id, 'qty', qty,
                  'unitPrice', trim_scale(unit_price), 'amount', trim_scale(amount)) end
           order by line_no) as items,
         sum(amount) as total,
         round(sum(platform_fee), 2) as fee_total
  from _cal_items
  group by order_id
) t on t.order_id = o.id
on conflict (id) do update set
  created_at     = excluded.created_at,
  paid_at        = excluded.paid_at,
  arrival_date   = excluded.arrival_date,
  departure_date = excluded.departure_date
where orders.paid_at is distinct from excluded.paid_at
   or orders.arrival_date is distinct from excluded.arrival_date
   or orders.departure_date is distinct from excluded.departure_date;

-- ---------------------------------------------------------------------------
-- 6. Class entries — one rider number per rider per show, in the show's own
--    block (starting_rider_number 201 / 301 / 401 / 501), above any number
--    already used in it, so nothing collides on class_entries (class_id, num)
-- ---------------------------------------------------------------------------
create temp table _cal_show_num on commit drop as
select s.id as show_id,
       (ceil(greatest(coalesce(s.starting_rider_number, 101) - 1,
                      coalesce(max(case when ce.num ~ '^[0-9]{1,6}$' then ce.num::int end), 0)) / 100.0) * 100)::int as base
from public.shows s
left join public.classes c on c.show_id = s.id
left join public.class_entries ce on ce.class_id = c.id
                                  and ce.id not in (select entry_id from _cal_lines where entry_id is not null)
where s.id in (${showIds})
group by s.id, s.starting_rider_number;

create temp table _cal_class_base on commit drop as
select i.class_id, coalesce((select max(ce.ride_order) from public.class_entries ce
                              where ce.class_id = i.class_id
                                and ce.id not in (select entry_id from _cal_lines where entry_id is not null)), -1) as base
from (select distinct class_id from _cal_items where kind = 'class_entry') i;

insert into public.class_entries (id, class_id, draw, num, rider, horse, rider_id, horse_id, order_id, ride_order, status, division)
select i.entry_id, i.class_id, null,
       lpad((sn.base + rs.seq)::text, 4, '0'),
       trim(coalesce(r.first_name, '') || ' ' || coalesce(r.last_name, '')),
       i.horse_name, o.rider_id, i.horse_id, o.id,
       cb.base + row_number() over (partition by i.class_id order by o.paid_at, o.id, i.line_no),
       'scheduled',
       case r.category when 'Junior' then 'J' when 'Children' then 'J' when 'Young Rider' then 'Y'
                       when 'Under 25 (U25)' then 'Y' when 'Adult Amateur' then 'A' else 'O' end
from _cal_items i
join _cal_orders o on o.id = i.order_id
join public.riders r on r.id = o.rider_id
join _cal_show_num sn on sn.show_id = o.show_id
join (select id, row_number() over (partition by show_id order by paid_at, id) as seq from _cal_orders) rs on rs.id = o.id
join _cal_class_base cb on cb.class_id = i.class_id
where i.kind = 'class_entry'
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 7. Stall bookings and waiver signatures (timestamps follow the order)
-- ---------------------------------------------------------------------------
insert into public.stabling_requests (id, show_id, order_id, rider_id, trainer_name, horse_stalls, tack_stalls, stable_with, notes, created_at, updated_at)
select o.stabling_id, o.show_id, o.id, o.rider_id, o.stabling_request ->> 'trainerName', s.horse_stalls, s.tack_stalls,
       o.stabling_request ->> 'stableWith', o.stabling_request ->> 'notes', o.paid_at, o.paid_at
from _cal_orders o
join (select order_id, sum(qty * stalls)::int as horse_stalls, sum(qty * tack)::int as tack_stalls
        from _cal_items where kind = 'addon' group by order_id) s on s.order_id = o.id
where o.stabling_request ->> 'trainerName' is not null
  and (s.horse_stalls > 0 or s.tack_stalls > 0)
on conflict (id) do update set created_at = excluded.created_at
where stabling_requests.created_at is distinct from excluded.created_at;

insert into public.waiver_signatures (id, rider_id, show_id, full_name, signed_at, signature_date)
select o.waiver_id, o.rider_id, o.show_id, trim(r.first_name || ' ' || r.last_name), o.created_at - interval '3 minutes',
       to_char((o.created_at - interval '3 minutes') at time zone '${TZ}', 'YYYY-MM-DD')
from _cal_orders o
join public.riders r on r.id = o.rider_id
join public.shows s on s.id = o.show_id
where nullif(btrim(coalesce(s.waiver_text, '')), '') is not null
on conflict (id) do update set signed_at = excluded.signed_at, signature_date = excluded.signature_date
where waiver_signatures.signed_at is distinct from excluded.signed_at;

-- Entry Ledger numbering (same RPC the app calls on first open).
select public.reconcile_show_entry_numbering(id) from public.shows where id in (${showIds});

-- ---------------------------------------------------------------------------
-- 8. Class dates (refresh on re-run) and start times. Times follow the
--    schedule engine's defaults: rings open 08:00, 9 min per ride + 2 min
--    buffer (+2 for FEI), lunch 12:00–13:00; a class with no rides has no time.
--    Gated UPDATE -> act as the org's Organizer for this step only.
-- ---------------------------------------------------------------------------
${ACT_AS_ORGANIZER}

update public.classes c set date = cc.date
from _cal_classes cc
where c.id = cc.id and c.date is distinct from cc.date;

with ent as (
  select ce.class_id, count(*) as n
  from public.class_entries ce
  where ce.class_id in (select id from _cal_classes) and ce.status is distinct from 'scratched' and not coalesce(ce.holding, false)
  group by ce.class_id
),
seq as (
  select c.id, c.show_id, c.date, c.location, c.run_order, coalesce(e.n, 0) as n,
         case when c.event in ('Third Level', 'Fourth Level', 'FEI') then 13 else 11 end as step
  from public.classes c
  left join ent e on e.class_id = c.id
  where c.id in (select id from _cal_classes)
),
cum as (
  select s.*,
         coalesce(sum(s.n * s.step) over (partition by s.show_id, s.date, s.location order by s.run_order
                                          rows between unbounded preceding and 1 preceding), 0) as before_min
  from seq s
),
timed as (
  select id, case when n = 0 then null
                  else to_char(time '08:00' + make_interval(mins => (before_min + case when before_min >= 240 then 60 else 0 end)::int), 'HH24:MI')
             end as t
  from cum
)
update public.classes c set time = timed.t
from timed
where c.id = timed.id and c.time is distinct from timed.t;

select set_config('request.jwt.claims', '', true);

-- ---------------------------------------------------------------------------
-- 9. Post-conditions — abort the whole transaction if anything is off
-- ---------------------------------------------------------------------------
do $$
declare
  n int;
begin
  select count(*) into n from public.shows where id in (${showIds}) and published;
  if n <> ${SHOWS.length} then raise exception 'Calendar seed: expected ${SHOWS.length} published shows, found %', n; end if;

  select count(*) into n from public.orders where id in (select id from _cal_orders) and status = 'paid';
  if n <> ${orderRows.length} then raise exception 'Calendar seed: expected ${orderRows.length} paid orders, found %', n; end if;

  select count(*) into n from public.orders o
   where o.id in (select id from _cal_orders)
     and (select count(*) from jsonb_array_elements(o.items) e where e ->> 'kind' = 'class_entry')
         <> (select count(*) from public.class_entries ce where ce.order_id = o.id);
  if n > 0 then raise exception 'Calendar seed: % orders have items that do not match their class entries', n; end if;

  select count(*) into n from public.orders o
   where o.id in (select id from _cal_orders)
     and o.amount_total <> (select sum((e ->> 'amount')::numeric) from jsonb_array_elements(o.items) e);
  if n > 0 then raise exception 'Calendar seed: % orders whose amount_total is not the sum of their items', n; end if;

  -- Every order inside its show's ticket window, in the past, after the rider signed up.
  select count(*) into n from public.orders o
   join public.shows s on s.id = o.show_id
   join public.riders r on r.id = o.rider_id
   where o.id in (select id from _cal_orders)
     and (o.paid_at > now()
          or (o.paid_at at time zone '${TZ}')::date < s.ticket_open::date
          or (o.paid_at at time zone '${TZ}')::date > left(s.ticket_close, 10)::date
          or o.created_at < r.created_at);
  if n > 0 then raise exception 'Calendar seed: % orders fall outside their ticket window / in the future', n; end if;
end $$;

commit;
`;

// ---------------------------------------------------------------------------
// Cleanup — the six shows are seed-owned, so everything on them goes.
// ---------------------------------------------------------------------------
const cleanup = `-- =============================================================================
-- Removes everything supabase/seed/demo-shows-calendar.sql (${TAG}) added:
-- the six calendar shows and every row hanging off them (classes, entries,
-- orders, stalls, waivers, staff, ledger rows, add-ons, vendor items).
-- GENERATED by scripts/generate-demo-calendar-seed.mjs — regenerate rather than edit.
-- The main demo dataset (riders, horses, other shows) is untouched.
--
-- class_entries DELETE is guarded (canEditShow), so this acts as the org's
-- Organizer for the transaction (request.jwt.claims, transaction-local).
-- =============================================================================
begin;

${ACT_AS_ORGANIZER}

create temp table _cal_show_ids (id uuid primary key) on commit drop;
insert into _cal_show_ids values
${SHOWS.map((s) => `  (${q(s.id)})`).join(',\n')};

delete from public.class_entries
 where class_id in (select id from public.classes where show_id in (select id from _cal_show_ids));
delete from public.stabling_requests where show_id in (select id from _cal_show_ids);
-- orders -> shows is ON DELETE RESTRICT, so orders go before the shows.
delete from public.orders where show_id in (select id from _cal_show_ids);
delete from public.shows where id in (select id from _cal_show_ids);

commit;
`;

// ---------------------------------------------------------------------------
// Verify — read-only, metric / value rows like demo-business-verify.sql
// ---------------------------------------------------------------------------
const verify = `-- Read-only state of the date-relative show calendar (${TAG}).
-- GENERATED by scripts/generate-demo-calendar-seed.mjs. Safe to run any time.
--
--   scripts/apply-demo-seed.sh --calendar-verify
--
-- Ticket window is evaluated like riders/utils/parse-ticket-window.ts: opens at
-- ticket_open 00:00 show-local, closes at ticket_close (23:59 when no time) or
-- the end of the last show day, whichever is first. Stage is the dashboard's
-- (listDashboardShows): complete > live (runner.approved) > sales-closed
-- (runner.ticketClosed) > sales-open (published) > setup.
with cal as (
  select s.*, coalesce(s.timezone, '${TZ}') as tz
  from public.shows s
  where s.id in (${showIds})
),
win as (
  select c.id,
         (c.ticket_open::date)::timestamp at time zone c.tz as opens_at,
         least(
           (left(c.ticket_close, 10)::date + coalesce(nullif(substring(c.ticket_close from '(\\d{2}:\\d{2})'), ''), '23:59')::time) at time zone c.tz,
           (c.end_date::date + time '23:59:59') at time zone c.tz
         ) as closes_at
  from cal c
),
stats as (
  select c.id,
         (select count(*) from public.orders o where o.show_id = c.id and o.status = 'paid') as orders,
         (select coalesce(sum(o.amount_total), 0) from public.orders o where o.show_id = c.id and o.status = 'paid') as gross,
         (select count(*) from public.class_entries ce join public.classes k on k.id = ce.class_id where k.show_id = c.id) as entries,
         (select count(distinct ce.rider_id) from public.class_entries ce join public.classes k on k.id = ce.class_id where k.show_id = c.id) as riders,
         (select count(*) from public.classes k where k.show_id = c.id) as classes,
         (select count(*) from public.classes k where k.show_id = c.id and k.catalog_id is not null) as linked,
         (select count(*) from public.classes k where k.show_id = c.id and k.date = to_char((now() at time zone c.tz)::date, 'YYYY-MM-DD')) as today_classes,
         (select count(*) from public.classes k where k.show_id = c.id and k.time is not null) as timed,
         (select coalesce(sum(sr.horse_stalls), 0) from public.stabling_requests sr where sr.show_id = c.id) as stalls,
         (select count(*) from public.staff_assignments sa where sa.show_id = c.id) as staff,
         (select min(ce.num) || '–' || max(ce.num) from public.class_entries ce join public.classes k on k.id = ce.class_id where k.show_id = c.id) as nums,
         case when exists (select 1 from public.classes k where k.show_id = c.id and k.results_published) then 'complete'
              when (c.runner_state ->> 'approved')::boolean then 'live'
              when (c.runner_state ->> 'ticketClosed')::boolean then 'sales-closed'
              when c.published then 'sales-open' else 'setup' end as stage
  from cal c
)
select metric, value from (
  select 0 as ord, 'today (${TZ})' as metric, to_char((now() at time zone '${TZ}')::date, 'YYYY-MM-DD Dy') as value
  union all
  select row_number() over (order by c.start_date)::int,
         c.name,
         c.start_date || case when c.end_date <> c.start_date then ' → ' || c.end_date else '' end
         || ' | tickets ' || case when now() < w.opens_at then 'OPENS ' || c.ticket_open
                                  when now() > w.closes_at then 'CLOSED ' || left(c.ticket_close, 10)
                                  else 'OPEN until ' || to_char(w.closes_at at time zone c.tz, 'YYYY-MM-DD HH24:MI') end
         || ' | stage ' || st.stage
         || ' | ' || st.orders || ' orders $' || st.gross || ', ' || st.entries || ' entries, ' || st.riders || ' riders'
         || coalesce(' #' || st.nums, '')
         || ' | ' || st.classes || ' classes (' || st.linked || ' catalog-linked, ' || st.timed || ' timed, ' || st.today_classes || ' today)'
         || ' | ' || st.stalls || ' stalls, ' || st.staff || ' staff'
  from cal c join win w on w.id = c.id join stats st on st.id = c.id
  union all
  select 100, 'CHECK orders total <> sum(items)',
         (select count(*) from public.orders o where o.show_id in (${showIds}) and o.amount_total <> (select coalesce(sum((e ->> 'amount')::numeric), 0) from jsonb_array_elements(o.items) e))::text
  union all
  select 101, 'CHECK orders items <> class entries',
         (select count(*) from public.orders o where o.show_id in (${showIds}) and (select count(*) from jsonb_array_elements(o.items) e where e ->> 'kind' = 'class_entry') <> (select count(*) from public.class_entries ce where ce.order_id = o.id))::text
  union all
  select 102, 'CHECK orders outside window / future',
         (select count(*) from public.orders o join public.shows s on s.id = o.show_id
           where s.id in (${showIds})
             and (o.paid_at > now() or (o.paid_at at time zone '${TZ}')::date < s.ticket_open::date
                  or (o.paid_at at time zone '${TZ}')::date > left(s.ticket_close, 10)::date))::text
  union all
  select 103, 'CHECK duplicate rider numbers per class',
         (select count(*) from (select ce.class_id, ce.num from public.class_entries ce join public.classes k on k.id = ce.class_id
                                 where k.show_id in (${showIds}) group by 1, 2 having count(*) > 1) x)::text
) m
order by ord;
`;

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(join(OUT_DIR, 'demo-shows-calendar.sql'), seed);
writeFileSync(join(OUT_DIR, 'demo-shows-calendar-cleanup.sql'), cleanup);
writeFileSync(join(OUT_DIR, 'demo-shows-calendar-verify.sql'), verify);

console.log(
  SHOWS.map((s) => {
    const os = orderRows.filter((o) => o.show === s);
    const entries = lineRows.filter(
      (l) => l.kind === 'class_entry' && os.some((o) => o.id === l.orderId),
    ).length;
    return `${s.key}: ${os.length} orders, ${entries} entries, ${classes.filter((c) => c.show === s).length} classes`;
  }).join('\n'),
);
