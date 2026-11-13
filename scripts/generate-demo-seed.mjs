#!/usr/bin/env node
/**
 * Generates the Peachtree Dressage Association sales-demo dataset:
 *
 *   supabase/seed/demo-business-seed.sql     (one transaction, re-runnable)
 *   supabase/seed/demo-business-cleanup.sql  (removes only what the seed added)
 *
 * Output is deterministic: a fixed-seed PRNG drives every choice and every id
 * is an md5-derived v4-shaped UUID of a stable key ("demo-seed-2026-10:rider:17"),
 * so regenerating produces byte-identical files and re-running the seed never
 * duplicates a row (every insert is ON CONFLICT DO NOTHING on those ids).
 *
 * Money is NOT computed here. The SQL prices every order and vendor booking
 * from the live classes / add_ons / vendor_items rows with the same formulas the
 * app uses (riders/data/checkout.ts priceCart, vendors/data/checkout.ts
 * priceVendorBooking, shared/lib/fees.ts), so totals always match what the UI
 * would have charged — even if an organizer edited a fee since this ran.
 *
 * Usage: node scripts/generate-demo-seed.mjs
 */
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'supabase', 'seed');
const TAG = 'demo-seed-2026-10';
const DOMAIN = 'fieldarena-demo.test';
const ORG_ID = 'a0000000-0000-4000-8000-000000000004';
const BLUE_RIDGE_ID = 'c0000000-0000-4000-8000-000000000001';

// ---------------------------------------------------------------------------
// Deterministic helpers
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

let prngState = 0x5eed2026;
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
const iso = (ms) => new Date(ms).toISOString();
const ymd = (ms) => new Date(ms).toISOString().slice(0, 10);
const dateMs = (d) => Date.parse(`${d}T00:00:00Z`);
const addDays = (d, n) => ymd(dateMs(d) + n * DAY);

/** A timestamp on `day` between 7am and 10:59pm US Eastern (EDT, UTC-4). */
function easternDaytime(dayMs) {
  return dayMs + (11 + int(0, 15)) * 3600000 + int(0, 59) * 60000 + int(0, 59) * 1000;
}

// ---------------------------------------------------------------------------
// Name / place pools (fictional people; 555-01xx phone numbers are reserved
// for fiction, emails all on the non-routable demo domain)
// ---------------------------------------------------------------------------
const FIRST_F = [
  'Abigail',
  'Addison',
  'Alexandra',
  'Alison',
  'Allison',
  'Amanda',
  'Amelia',
  'Amy',
  'Andrea',
  'Angela',
  'Anna',
  'Ashley',
  'Audrey',
  'Ava',
  'Avery',
  'Bailey',
  'Barbara',
  'Becca',
  'Beth',
  'Brooke',
  'Caitlin',
  'Camille',
  'Caroline',
  'Carrie',
  'Cassidy',
  'Catherine',
  'Charlotte',
  'Chloe',
  'Claire',
  'Courtney',
  'Dana',
  'Deborah',
  'Diane',
  'Eleanor',
  'Elise',
  'Elizabeth',
  'Ella',
  'Emily',
  'Emma',
  'Erin',
  'Evelyn',
  'Faith',
  'Gabrielle',
  'Grace',
  'Hailey',
  'Hannah',
  'Harper',
  'Heather',
  'Holly',
  'Isabella',
  'Jacqueline',
  'Jane',
  'Jenna',
  'Jennifer',
  'Jessica',
  'Jillian',
  'Julia',
  'Julie',
  'Kaitlyn',
  'Karen',
  'Kate',
  'Katherine',
  'Kathleen',
  'Kayla',
  'Kelly',
  'Kendall',
  'Kimberly',
  'Kristen',
  'Laura',
  'Lauren',
  'Leah',
  'Lillian',
  'Lily',
  'Lindsey',
  'Lisa',
  'Lucy',
  'Mackenzie',
  'Madeline',
  'Madison',
  'Margaret',
  'Maria',
  'Marissa',
  'Mary',
  'Megan',
  'Melanie',
  'Melissa',
  'Meredith',
  'Mia',
  'Michelle',
  'Molly',
  'Morgan',
  'Natalie',
  'Nicole',
  'Olivia',
  'Paige',
  'Patricia',
  'Rachel',
  'Rebecca',
  'Riley',
  'Sabrina',
  'Samantha',
  'Sara',
  'Sarah',
  'Savannah',
  'Shannon',
  'Sophia',
  'Stephanie',
  'Susan',
  'Sydney',
  'Taylor',
  'Tessa',
  'Valerie',
  'Vanessa',
  'Victoria',
  'Whitney',
  'Zoe',
];
const FIRST_M = [
  'Aaron',
  'Andrew',
  'Benjamin',
  'Brandon',
  'Brian',
  'Caleb',
  'Carter',
  'Charles',
  'Christopher',
  'Daniel',
  'David',
  'Ethan',
  'Grant',
  'Henry',
  'Jack',
  'James',
  'Jason',
  'John',
  'Jonathan',
  'Joseph',
  'Kevin',
  'Luke',
  'Mark',
  'Matthew',
  'Michael',
  'Nathan',
  'Owen',
  'Patrick',
  'Paul',
  'Robert',
  'Ryan',
  'Scott',
  'Stephen',
  'Thomas',
  'Tyler',
  'William',
];
const LAST = [
  'Abbott',
  'Adair',
  'Aldridge',
  'Allen',
  'Ashby',
  'Atwood',
  'Bailey',
  'Baldwin',
  'Barnett',
  'Barrett',
  'Beasley',
  'Bennett',
  'Blackwell',
  'Bowman',
  'Bradford',
  'Brannon',
  'Brewer',
  'Brooks',
  'Burgess',
  'Burke',
  'Caldwell',
  'Calhoun',
  'Carlisle',
  'Carmichael',
  'Carver',
  'Chandler',
  'Chapman',
  'Coleman',
  'Collier',
  'Conway',
  'Crawford',
  'Crenshaw',
  'Daniels',
  'Davenport',
  'Dawson',
  'Delaney',
  'Donovan',
  'Drake',
  'Dunbar',
  'Eaton',
  'Ellison',
  'Emerson',
  'Farley',
  'Fairchild',
  'Fletcher',
  'Forbes',
  'Fowler',
  'Franklin',
  'Gaines',
  'Garrison',
  'Gentry',
  'Gilbert',
  'Goodwin',
  'Graham',
  'Griffin',
  'Hadley',
  'Hale',
  'Hamilton',
  'Harper',
  'Harrell',
  'Hartley',
  'Hayward',
  'Henderson',
  'Hendricks',
  'Holcomb',
  'Holloway',
  'Hughes',
  'Hutchins',
  'Ingram',
  'Jennings',
  'Kendrick',
  'Kimball',
  'Kinsey',
  'Lambert',
  'Langley',
  'Lawson',
  'Leland',
  'Lindsey',
  'Lockhart',
  'Lowell',
  'Lyle',
  'Maddox',
  'Mallory',
  'Manning',
  'Marlowe',
  'McAllister',
  'McBride',
  'McCall',
  'McKenzie',
  'Merritt',
  'Middleton',
  'Montgomery',
  'Morrow',
  'Neal',
  'Newsome',
  'Norwood',
  'Oakley',
  'Odom',
  'Pace',
  'Parrish',
  'Patterson',
  'Pearce',
  'Pemberton',
  'Pendleton',
  'Pierce',
  'Prescott',
  'Pruitt',
  'Quinlan',
  'Ragsdale',
  'Ramsey',
  'Randolph',
  'Reese',
  'Rhodes',
  'Ridley',
  'Rowland',
  'Rutledge',
  'Sanders',
  'Sawyer',
  'Sexton',
  'Shelton',
  'Sheridan',
  'Simmons',
  'Sinclair',
  'Slater',
  'Spencer',
  'Stafford',
  'Stanton',
  'Stewart',
  'Stokes',
  'Sutton',
  'Talbot',
  'Thornton',
  'Tillman',
  'Townsend',
  'Tucker',
  'Underwood',
  'Vaughn',
  'Wade',
  'Walden',
  'Walsh',
  'Warner',
  'Watkins',
  'Weatherly',
  'Webster',
  'Wells',
  'Whitaker',
  'Whitley',
  'Wilder',
  'Winslow',
  'Woodard',
  'Wren',
  'Yancey',
  'York',
];
// Names already used by real demo accounts / staff — never generated again.
const RESERVED_NAMES = new Set([
  'elena marsh',
  'tom reyes',
  'priya nair',
  'sam whitfield',
  'dana boyd',
  'marcus hale',
  'nina cohen',
  'chase doyle',
]);

const CITIES = [
  // [city, state, zips, weight]
  ['Alpharetta', 'GA', ['30004', '30005', '30009'], 9],
  ['Milton', 'GA', ['30004'], 7],
  ['Roswell', 'GA', ['30075', '30076'], 6],
  ['Marietta', 'GA', ['30062', '30064', '30066'], 6],
  ['Cumming', 'GA', ['30040', '30041'], 6],
  ['Canton', 'GA', ['30114', '30115'], 4],
  ['Ball Ground', 'GA', ['30107'], 3],
  ['Atlanta', 'GA', ['30305', '30327', '30342'], 5],
  ['Woodstock', 'GA', ['30188', '30189'], 3],
  ['Newnan', 'GA', ['30263', '30265'], 3],
  ['Peachtree City', 'GA', ['30269'], 3],
  ['Senoia', 'GA', ['30276'], 2],
  ['Madison', 'GA', ['30650'], 2],
  ['Athens', 'GA', ['30605', '30606'], 3],
  ['Watkinsville', 'GA', ['30677'], 2],
  ['Covington', 'GA', ['30014'], 2],
  ['Social Circle', 'GA', ['30025'], 1],
  ['Gainesville', 'GA', ['30501', '30506'], 3],
  ['Dahlonega', 'GA', ['30533'], 2],
  ['Cartersville', 'GA', ['30120', '30121'], 2],
  ['Rome', 'GA', ['30161', '30165'], 1],
  ['Macon', 'GA', ['31210'], 2],
  ['Savannah', 'GA', ['31405', '31406', '31411'], 3],
  ['Richmond Hill', 'GA', ['31324'], 2],
  ['Augusta', 'GA', ['30909'], 2],
  ['Evans', 'GA', ['30809'], 2],
  ['Thomasville', 'GA', ['31792'], 1],
  ['Columbus', 'GA', ['31904'], 1],
  ['Fayetteville', 'GA', ['30214', '30215'], 2],
  ['Jasper', 'GA', ['30143'], 1],
  ['Ellijay', 'GA', ['30540'], 1],
  ['Statesboro', 'GA', ['30458'], 1],
  ['Aiken', 'SC', ['29801', '29803'], 4],
  ['Camden', 'SC', ['29020'], 1],
  ['Greenville', 'SC', ['29607', '29615'], 2],
  ['Charleston', 'SC', ['29407'], 1],
  ['Tryon', 'NC', ['28782'], 2],
  ['Southern Pines', 'NC', ['28387'], 1],
  ['Asheville', 'NC', ['28803'], 1],
  ['Charlotte', 'NC', ['28277'], 1],
  ['Chattanooga', 'TN', ['37421'], 2],
  ['Franklin', 'TN', ['37064'], 1],
  ['Knoxville', 'TN', ['37922'], 1],
  ['Birmingham', 'AL', ['35242'], 1],
  ['Auburn', 'AL', ['36830'], 1],
  ['Ocala', 'FL', ['34482'], 2],
  ['Tallahassee', 'FL', ['32312'], 1],
  ['Jacksonville', 'FL', ['32259'], 1],
];
const AREA_CODES = {
  GA: ['404', '470', '678', '770', '706', '762', '912', '478', '229'],
  SC: ['803', '864', '843'],
  NC: ['828', '910', '704'],
  TN: ['423', '615', '865'],
  AL: ['205', '334'],
  FL: ['352', '850', '904'],
};
const METRO_ATL = ['404', '470', '678', '770'];
const STREETS = [
  'Hopewell Rd',
  'Birmingham Hwy',
  'Freemanville Rd',
  'Arnold Mill Rd',
  'Bethany Bend',
  'Providence Rd',
  'Lake Haven Dr',
  'Foxhall Ln',
  'Saddlebrook Way',
  'Paddock Ct',
  'Stable Gate Dr',
  'Hickory Flat Hwy',
  'Old Alabama Rd',
  'Mayfield Rd',
  'Bannister Rd',
  'Crabapple Rd',
  'Francis Rd',
  'Thompson Mill Rd',
  'Union Hill Rd',
  'Wood Rd',
  'Cogburn Rd',
  'Hamby Rd',
  'Matt Hwy',
  'Heardsville Rd',
  'Dogwood Trl',
  'Magnolia Ln',
  'Pine Needle Ct',
  'Riverbend Dr',
  'Meadowbrook Ln',
  'Shady Oak Dr',
  'Willow Pond Rd',
  'Foxfire Trl',
  'Bridle Path',
  'Hunt Club Rd',
  'Cedar Creek Rd',
  'Laurel Springs Pkwy',
  'Mill Pond Rd',
  'Ashford Ln',
  'Holly Ridge Dr',
  'Chestnut Hill Rd',
  'Indian Springs Rd',
  'Plantation Dr',
  'Live Oak Ln',
  'Coach House Ln',
  'Stirrup Cup Ct',
  'Canterbury Way',
  'Whitehall Rd',
  'Bluebird Ln',
  'Quail Run',
];
const BARNS = [
  'Hilltop Farm',
  'Windward Dressage',
  'Magnolia Hill Equestrian',
  'Foxhall Farm',
  'Serenity Meadows',
  'Riverbend Farm',
  'Oak Haven Dressage',
  'Willow Creek Stables',
  'Peachtree Sport Horses',
  'Bellwether Farm',
  'Stone Gate Farm',
  'Cedar Ridge Equestrian',
  'Southern Cross Dressage',
  'Tranquility Farm',
  'Bramblewood Farm',
  'Laurel Glen Stables',
  'Briar Patch Farm',
  'Sweetwater Dressage',
  'Twin Oaks Farm',
  'Chestnut Hill Equestrian',
  'High Point Farm',
  'Silver Lining Stables',
  'Blackberry Lane Farm',
  'Fair Winds Farm',
  'Kingsgate Dressage',
  'Dogwood Hollow Farm',
  'Heritage Oaks Equestrian',
  'Copper Beech Farm',
  'Wildwood Dressage',
  'Greystone Equestrian',
  'Morning Star Farm',
  'Long Shadow Farm',
  'Harmony Hill Dressage',
  'Belle Meade Equestrian',
  'Pine Haven Farm',
  'Red Clay Dressage',
];
const FARRIERS = [
  'Jake Holloway, CJF',
  'Mike Dillard, CJF',
  'Travis Underwood',
  'Luis Ortega, CF',
  'Wes McAllister, CJF',
  'Ben Carver',
  'Cody Ragsdale, CF',
  'Darrell Pruitt',
  'Sam Kinsey, CJF',
  'Eli Stanton',
  'Garrett Lowell, CF',
  'Hank Delaney',
];
const HORSE_PREFIX = [
  'Sir',
  'Lord',
  'Lady',
  'Royal',
  'Midnight',
  'Silver',
  'Golden',
  'Dark',
  'Wild',
  'Stellar',
  'Noble',
  'Velvet',
  'Copper',
  'Autumn',
  'Winter',
  'Summer',
  'Magnolia',
  'Southern',
  'Georgia',
  'Carolina',
  'Blue',
  'Grand',
  'Little',
  'Dancing',
  'Hidden',
  'Shadow',
  'Starlit',
  'Gallant',
  'Northern',
  'Lucky',
  'Bold',
  'Secret',
  'Rising',
  'Crimson',
];
const HORSE_NOUN = [
  'Dancer',
  'Legacy',
  'Rhapsody',
  'Sonnet',
  'Melody',
  'Whisper',
  'Promise',
  'Spirit',
  'Tango',
  'Waltz',
  'Symphony',
  'Echo',
  'Comet',
  'Fortune',
  'Charm',
  'Dream',
  'Knight',
  'Gambit',
  'Harmony',
  'Encore',
  'Jubilee',
  'Allegro',
  'Cadence',
  'Ballad',
  'Serenade',
  'Tempest',
  'Valor',
  'Victory',
  'Reverie',
  'Sterling',
  'Bandit',
  'Monarch',
  'Treasure',
  'Odyssey',
];
const HORSE_SINGLE = [
  'Fandango',
  'Bellissima',
  'Quintessa',
  'Rivaldo',
  'Santiago',
  'Cassiopeia',
  'Zeppelin',
  'Wolkenstein',
  'Landrico',
  'Florentina',
  'Damaso',
  'Romanov',
  'Sandrino',
  'Velasquez',
  'Esperanza',
  'Benedetto',
  'Corazon',
  'Valentino',
  'Amadeus',
  'Florian',
  'Lorenzo',
  'Rosalind',
  'Fiorella',
  'Donatella',
  'Belmondo',
  'Calimero',
  'Hermosa',
  'Sorrento',
  'Rigoletto',
  'Wintermond',
  'Sternenglanz',
  'Feuertanz',
  'Dornröschen',
  'Rubicon',
  'Escada',
  'Fürstenstolz',
  'Lavendel',
  'Quadrille',
  'Bolero',
  'Paganini',
  'Galileo',
  'Ricardo',
  'Dolce Vita',
  'Weltenbummler',
  'Habanera',
  'Sansibar',
  'Primavera',
  'Carlotta',
  'Domenico',
  'Leonardo',
  'Isabeau',
  'Vivaldi',
  'Marquis',
  'Duchess',
  'Bourbon',
  'Pecan',
  'Biscuit',
  'Gatsby',
  'Huckleberry',
  'Moonshine',
  'Pimento',
];
const BARN_PREFIX = [
  "Hilltop's",
  "Windward's",
  "Foxhall's",
  "Bellwether's",
  "Kingsgate's",
  "Riverbend's",
  "Stonegate's",
  "Greystone's",
  "Briarwood's",
  "Fairhaven's",
];
const HORSE_SUFFIX = ['', '', '', ' W', ' M', ' K', ' HW', ' S', ' DG', ' L', ' GGF', ' SFF'];
const PONY_NAMES = [
  'Buttercup',
  'Pumpkin Spice',
  'Peanut Butter',
  'Sugarplum',
  'Tinker Bell',
  'Jelly Bean',
  'Cinnamon Toast',
  'Marshmallow',
  'Snickerdoodle',
  'Pocket Change',
  'Hot Cocoa',
  'Gumdrop',
  'Daisy Mae',
  'Sweet Pea',
];

const STABLING_NOTES = [
  'Please stall near the wash rack if possible.',
  'Would like stalls next to each other.',
  'Arriving late Thursday evening — please leave stall card on the door.',
  'Horse is a cribber; a stall with a solid front is appreciated.',
  'Needs a stall with a window — gets anxious in enclosed aisles.',
  'Bringing our own fans and buckets.',
  'Quiet end of the aisle please.',
];

// ---------------------------------------------------------------------------
// Shows. Dates and catalogs mirror the live dev project as of 2026-10-06.
// ---------------------------------------------------------------------------
const NEW_SHOW_ID = uuid('show:fall-championships');
const SHOWS = [
  {
    key: 'summer',
    id: 'c0000000-0000-4000-8000-000000000002',
    name: 'Peachtree Summer Classic',
    start: '2026-07-11',
    end: '2026-07-12',
    style: 'old',
    quota: 35,
    open: '2026-05-18',
    close: '2026-07-08',
    stableP: 0.55,
  },
  {
    key: 'blue-ridge',
    id: BLUE_RIDGE_ID,
    name: 'Blue Ridge Dressage Weekend',
    start: '2026-08-12',
    end: '2026-08-13',
    style: 'blue-ridge',
    quota: 100,
    open: '2026-06-08',
    close: '2026-08-09',
    stableP: 0.72,
  },
  {
    key: 'autumn',
    id: 'c0000000-0000-4000-8000-000000000004',
    name: 'Georgia Autumn Dressage Days',
    start: '2026-08-15',
    end: '2026-08-16',
    style: 'old',
    quota: 45,
    open: '2026-06-22',
    close: '2026-08-12',
    stableP: 0.6,
  },
  {
    key: 'coastal',
    id: 'c0000000-0000-4000-8000-000000000005',
    name: 'Coastal Georgia Dressage Fest',
    start: '2026-09-05',
    end: '2026-09-06',
    style: 'old',
    quota: 40,
    open: '2026-07-12',
    close: '2026-09-02',
    stableP: 0.66,
  },
  {
    key: 'fall',
    id: NEW_SHOW_ID,
    name: 'Peachtree Fall Dressage Championships',
    start: '2026-11-06',
    end: '2026-11-08',
    style: 'app',
    quota: 80,
    open: '2026-08-17',
    close: '2026-10-05',
    stableP: 0.76,
  },
];
const SHOW_BY_KEY = Object.fromEntries(SHOWS.map((s) => [s.key, s]));

const VENUES = [
  {
    id: 'b0000000-0000-4000-8000-000000000007',
    address: '1100 Equestrian Way, Alpharetta, GA 30009',
    phone: '770-555-0100',
    contact: 'Grounds Office — Linda Carver',
    rings: [
      { name: 'Main Arena', size: 'standard' },
      { name: 'Covered Arena', size: 'standard' },
      { name: 'Warm-up Ring', size: 'small' },
    ],
  },
  {
    id: 'b0000000-0000-4000-8000-000000000008',
    address: '4250 Paddock Ridge Rd, Atlanta, GA 30342',
    phone: '404-555-0100',
    contact: 'Show Office — Marcus Whitley',
    rings: [
      { name: 'Ring 1', size: 'standard' },
      { name: 'Ring 2', size: 'standard' },
    ],
  },
  {
    id: 'b0000000-0000-4000-8000-000000000009',
    address: '2875 Riverside Pkwy, Gainesville, GA 30501',
    phone: '678-555-0100',
    contact: 'Facility Manager — Joanne Pruitt',
    rings: [
      { name: 'Indoor Arena', size: 'standard' },
      { name: 'Outdoor Arena', size: 'standard' },
      { name: 'Schooling Ring', size: 'small' },
    ],
  },
  {
    id: 'b0000000-0000-4000-8000-00000000000a',
    address: '600 Marsh Oak Dr, Savannah, GA 31405',
    phone: '912-555-0100',
    contact: 'Events Coordinator — Grace Rutledge',
    rings: [
      { name: 'Oak Arena', size: 'standard' },
      { name: 'Marsh Arena', size: 'standard' },
    ],
  },
];

// Levels. `tests` per show style -> class labels the rider can enter.
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
// Per-level fee on the older seeded shows (matches their existing 8-class pool).
const OLD_FEE = {
  intro: 55,
  training: 65,
  first: 70,
  second: 75,
  third: 80,
  fourth: 85,
  psg: 95,
  i1: 100,
};
const OLD_DIVISION = (level) =>
  level === 'intro' ? 'Junior Rider' : level === 'training' ? 'Adult Amateur' : 'Open';
const NEW_FEE = {
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

// Classes the seed adds. Old-style shows already carry Intro A, Training 1/3,
// First 1/3, Second 1/3, Third 1 — the 8-test pool from supabase/seed.sql.
const classesToAdd = [];
const OLD_ADDS = [
  ['intro', 'Introductory Test B'],
  ['training', 'Training Level Test 2'],
  ['first', 'First Level Test 2'],
  ['second', 'Second Level Test 2'],
  ['third', 'Third Level Test 2'],
  ['third', 'Third Level Test 3'],
  ['fourth', 'Fourth Level Test 1'],
  ['fourth', 'Fourth Level Test 2'],
];
for (const show of SHOWS) {
  if (show.style === 'old' || show.style === 'blue-ridge') {
    const adds = [...OLD_ADDS];
    if (show.style === 'old') adds.push(['psg', 'Prix St. Georges'], ['i1', 'Intermediate I']);
    for (const [level, label] of adds) {
      classesToAdd.push({
        id: uuid(`class:${show.key}:${label}`),
        show_id: show.id,
        label,
        event: show.name,
        group_name: null,
        division: OLD_DIVISION(level),
        fee: OLD_FEE[level],
        governing_body: level === 'psg' || level === 'i1' ? 'FEI' : 'USEF',
        source_file: SOURCE_FILE[label],
        arena: null,
        award_scope: 'class',
      });
    }
  } else {
    for (const level of ['intro', 'training', 'first', 'second', 'third', 'fourth']) {
      for (const test of USEF_TESTS[level]) {
        const group = USEF_GROUP[level];
        classesToAdd.push({
          id: uuid(`class:${show.key}:${test}`),
          show_id: show.id,
          label: `${group} — ${test}`,
          event: 'Introductory through Fourth Level',
          group_name: group,
          division: group,
          fee: NEW_FEE[level],
          governing_body: null,
          source_file: SOURCE_FILE[test],
          arena: ['intro', 'training', 'first'].includes(level)
            ? 'Small, 20m x 40m'
            : 'Standard, 20m x 60m',
          award_scope: 'group',
        });
      }
    }
    for (const [level, group, test] of [
      ['psg', 'Prix St. Georges', 'Prix St. Georges (2026)'],
      ['i1', 'Intermediate I', 'Intermediate I (2026)'],
      ['gp', 'Grand Prix', 'Grand Prix (2026)'],
    ]) {
      classesToAdd.push({
        id: uuid(`class:${show.key}:${test}`),
        show_id: show.id,
        label: `${group} — ${test}`,
        event: 'FEI',
        group_name: group,
        division: group,
        fee: NEW_FEE[level],
        governing_body: null,
        source_file: SOURCE_FILE[group],
        arena: 'Standard, 20m x 60m',
        award_scope: 'group',
      });
    }
  }
}

function feiDivision(category) {
  if (category === 'Junior' || category === 'Children') return 'Junior Rider';
  if (category === 'Adult Amateur' || category === 'Senior') return 'Adult Amateur';
  return 'Open';
}

/** Class labels a horse at `level` can enter at `show`, for a rider of `category`. */
function menuFor(show, level, category) {
  if (show.style === 'app') {
    if (level === 'psg') return ['Prix St. Georges — Prix St. Georges (2026)'];
    if (level === 'i1') return ['Intermediate I — Intermediate I (2026)'];
    if (level === 'gp') return ['Grand Prix — Grand Prix (2026)'];
    return USEF_TESTS[level].map((t) => `${USEF_GROUP[level]} — ${t}`);
  }
  if (show.style === 'blue-ridge') {
    const d = feiDivision(category);
    if (level === 'psg') return [`Prix St. Georges — Prix St. Georges (2026) — ${d}`];
    if (level === 'i1')
      return [
        `Intermediate I — Intermediate I (2026) — ${d}`,
        `Intermediate I — Intermediate I Freestyle (2022) — ${d}`,
      ];
    if (level === 'gp')
      return [
        `Grand Prix — Grand Prix (2026) — ${d}`,
        `Grand Prix — Grand Prix Freestyle (2022) — ${d}`,
      ];
  } else {
    if (level === 'psg') return ['Prix St. Georges'];
    if (level === 'i1' || level === 'gp') return ['Intermediate I'];
  }
  if (level === 'intro') return ['Introductory Test A', 'Introductory Test B'];
  if (level === 'fourth') return ['Fourth Level Test 1', 'Fourth Level Test 2'];
  return USEF_TESTS[level];
}

// Add-ons. Old-style shows already have the five from supabase/seed.sql.
const addOnsToAdd = [];
for (const show of SHOWS.filter((s) => s.style === 'blue-ridge' || s.style === 'app')) {
  const nights = show.style === 'app' ? 3 : 2;
  const rows = [
    [
      'Box Stall — Full Show',
      show.style === 'app' ? 210 : 150,
      1,
      0,
      0,
      nights,
      show.style === 'app' ? 160 : 140,
    ],
    ['Day Stall', 45, 1, 0, 0, 0, 30],
    ['Tack Stall — Full Show', show.style === 'app' ? 165 : 120, 0, 1, 0, nights, 40],
    ['Shavings — per bag', 12, 0, 0, 1, 0, null],
    ['Early Arrival — extra night', 40, 0, 0, 0, 1, null],
    ['RV / Camper Hookup — per night', 55, 0, 0, 0, 1, 24],
  ];
  for (const [name, price, stalls, tack, shavings, n, qty] of rows) {
    addOnsToAdd.push({
      id: uuid(`addon:${show.key}:${name}`),
      show_id: show.id,
      name,
      price,
      stalls,
      tack,
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
const vendorItemsToAdd = [];
for (const show of SHOWS.filter((s) => s.style === 'blue-ridge' || s.style === 'app')) {
  for (const [name, price, qty] of VENDOR_ITEMS) {
    vendorItemsToAdd.push({
      id: uuid(`vendor-item:${show.key}:${name}`),
      show_id: show.id,
      name,
      price,
      qty,
    });
  }
}

// ---------------------------------------------------------------------------
// People
// ---------------------------------------------------------------------------
const phoneCounters = new Map();
function phone(state, metro = false) {
  const codes = metro ? METRO_ATL : (AREA_CODES[state] ?? AREA_CODES.GA);
  for (let attempt = 0; attempt < 50; attempt++) {
    const ac = pick(codes);
    const n = phoneCounters.get(ac) ?? int(0, 40);
    if (n > 99) continue;
    phoneCounters.set(ac, n + 1);
    return `${ac}-555-01${String(n).padStart(2, '0')}`;
  }
  throw new Error('phone pool exhausted');
}

const usedEmails = new Set();
const usedNames = new Set(RESERVED_NAMES);
function makeEmail(first, last, pro, birthYear) {
  const f = first.toLowerCase().replace(/[^a-z]/g, '');
  const l = last.toLowerCase().replace(/[^a-z]/g, '');
  const pattern = pro
    ? 'pro'
    : weighted([
        ['dot', 6],
        ['initial', 2],
        ['plain', 1],
        ['year', 1],
      ]);
  let base =
    pattern === 'dot'
      ? `${f}.${l}`
      : pattern === 'initial'
        ? `${f[0]}${l}`
        : pattern === 'plain'
          ? `${f}${l}`
          : pattern === 'year'
            ? `${f}.${l}${String(birthYear).slice(2)}`
            : `${f}.${l}.dressage`;
  let email = `${base}@${DOMAIN}`;
  let n = 2;
  while (usedEmails.has(email)) email = `${base}${n++}@${DOMAIN}`;
  usedEmails.add(email);
  return email;
}

const CATEGORY_WEIGHTS = [
  ['Adult Amateur', 46],
  ['Open', 18],
  ['Junior', 13],
  ['Young Rider', 8],
  ['Children', 5],
  ['Under 25 (U25)', 4],
  ['Senior', 6],
];
const BIRTH_YEARS = {
  Children: [2012, 2014],
  Junior: [2008, 2012],
  'Young Rider': [2005, 2010],
  'Under 25 (U25)': [2002, 2005],
  'Adult Amateur': [1958, 2003],
  Open: [1966, 2000],
  Senior: [1948, 1962],
};
const LEVEL_WEIGHTS = {
  Children: [
    ['intro', 30],
    ['training', 45],
    ['first', 25],
  ],
  Junior: [
    ['intro', 10],
    ['training', 35],
    ['first', 35],
    ['second', 15],
    ['third', 5],
  ],
  'Young Rider': [
    ['first', 20],
    ['second', 25],
    ['third', 25],
    ['fourth', 15],
    ['psg', 15],
  ],
  'Under 25 (U25)': [
    ['second', 20],
    ['third', 25],
    ['fourth', 20],
    ['psg', 25],
    ['i1', 10],
  ],
  'Adult Amateur': [
    ['intro', 8],
    ['training', 30],
    ['first', 28],
    ['second', 17],
    ['third', 10],
    ['fourth', 5],
    ['psg', 2],
  ],
  Open: [
    ['training', 10],
    ['first', 15],
    ['second', 18],
    ['third', 17],
    ['fourth', 15],
    ['psg', 12],
    ['i1', 7],
    ['gp', 6],
  ],
  Senior: [
    ['intro', 10],
    ['training', 35],
    ['first', 30],
    ['second', 15],
    ['third', 10],
  ],
};

const barns = BARNS.map((name, i) => {
  const female = chance(0.78);
  let first;
  let last;
  do {
    first = pick(female ? FIRST_F : FIRST_M);
    last = pick(LAST);
  } while (usedNames.has(`${first} ${last}`.toLowerCase()));
  usedNames.add(`${first} ${last}`.toLowerCase());
  return {
    name,
    trainer: `${first} ${last}`,
    trainerPhone: phone('GA', i % 3 === 0),
    farrier: pick(FARRIERS),
  };
});

const RIDER_COUNT = 300;
const riders = [];
for (let i = 1; i <= RIDER_COUNT; i++) {
  const category = weighted(CATEGORY_WEIGHTS);
  const female = chance(category === 'Open' ? 0.74 : 0.86);
  let first;
  let last;
  do {
    first = pick(female ? FIRST_F : FIRST_M);
    last = pick(LAST);
  } while (usedNames.has(`${first} ${last}`.toLowerCase()));
  usedNames.add(`${first} ${last}`.toLowerCase());
  const [city, state, zips] = weighted(CITIES.map((c) => [c, c[3]]));
  const [y0, y1] = BIRTH_YEARS[category];
  const dob = `${int(y0, y1)}-${String(int(1, 12)).padStart(2, '0')}-${String(int(1, 28)).padStart(2, '0')}`;
  const minor =
    ['Children', 'Junior'].includes(category) || (category === 'Young Rider' && dob > '2008-10-06');
  let ec;
  if (minor) {
    const parentFemale = chance(0.7);
    ec = {
      first: pick(parentFemale ? FIRST_F : FIRST_M),
      last,
      rel: parentFemale ? 'Mother' : 'Father',
    };
  } else {
    const age = 2026 - Number(dob.slice(0, 4));
    const rel =
      age < 26
        ? weighted([
            ['Parent', 6],
            ['Sibling', 1],
            ['Friend', 1],
          ])
        : age < 45
          ? weighted([
              ['Spouse', 5],
              ['Partner', 1],
              ['Parent', 1],
              ['Sibling', 1],
              ['Friend', 1],
            ])
          : weighted([
              ['Spouse', 6],
              ['Partner', 1],
              ['Sibling', 1],
              ['Friend', 1],
            ]);
    const ecFemale = rel === 'Spouse' ? !female : rel === 'Parent' ? chance(0.65) : chance(0.6);
    ec = {
      first: pick(ecFemale ? FIRST_F : FIRST_M),
      last: rel === 'Friend' || rel === 'Partner' ? pick(LAST) : last,
      rel,
    };
  }
  riders.push({
    n: i,
    id: uuid(`rider:${i}`),
    first,
    last,
    category,
    dob,
    city,
    state,
    zip: pick(zips),
    street: `${int(100, 9899)} ${pick(STREETS)}`,
    phone: phone(state, state === 'GA' && chance(0.5)),
    email: makeEmail(first, last, category === 'Open' && chance(0.25), Number(dob.slice(0, 4))),
    usef: chance(0.92) ? String(int(0, 9) < 7 ? int(4600000, 5899999) : int(180000, 999999)) : null,
    fei: null,
    barn: pick(barns),
    ec: { ...ec, phone: phone(state) },
    horses: [],
  });
}

// 25 riders own two horses — mostly professionals, then amateurs / young riders.
const twoHorseCandidates = shuffle(
  riders.filter((r) =>
    ['Open', 'Adult Amateur', 'Young Rider', 'Under 25 (U25)'].includes(r.category),
  ),
);
const twoHorsePros = twoHorseCandidates.filter((r) => r.category === 'Open').slice(0, 14);
const TWO_HORSE = new Set(
  [
    ...twoHorsePros,
    ...twoHorseCandidates.filter((r) => r.category !== 'Open').slice(0, 25 - twoHorsePros.length),
  ].map((r) => r.n),
);
if (TWO_HORSE.size !== 25) throw new Error(`two-horse riders ${TWO_HORSE.size} != 25`);

const usedHorseNames = new Set();
function horseName(pony) {
  for (let attempt = 0; attempt < 200; attempt++) {
    const style = pony
      ? 'pony'
      : weighted([
          ['combo', 5],
          ['single', 4],
          ['barn', 1],
        ]);
    let name;
    if (style === 'pony') name = pick(PONY_NAMES);
    else if (style === 'combo') name = `${pick(HORSE_PREFIX)} ${pick(HORSE_NOUN)}`;
    else if (style === 'single') name = `${pick(HORSE_SINGLE)}${pick(HORSE_SUFFIX)}`;
    else name = `${pick(BARN_PREFIX)} ${pick(HORSE_NOUN)}`;
    // One horse per base name, so "Lavendel" and "Lavendel HW" never both appear.
    const base = name.replace(/ (W|M|K|HW|S|DG|L|GGF|SFF)$/, '').toLowerCase();
    if (!usedHorseNames.has(base)) {
      usedHorseNames.add(base);
      return name;
    }
  }
  throw new Error('horse name pool exhausted');
}

const horses = [];
for (const rider of riders) {
  const count = TWO_HORSE.has(rider.n) ? 2 : 1;
  for (let k = 0; k < count; k++) {
    const level = weighted(LEVEL_WEIGHTS[rider.category]);
    const pony = rider.category === 'Children' && chance(0.5);
    const hands = pony ? int(132, 142) : int(153, 173);
    const h = Math.floor(hands / 10);
    const frac = Math.min(hands % 10, 3);
    const horse = {
      n: horses.length + 1,
      id: uuid(`horse:${horses.length + 1}`),
      riderId: rider.id,
      name: horseName(pony),
      level,
      height: `${h}.${frac}`,
      stallion: !pony && level !== 'intro' && chance(0.05),
    };
    rider.horses.push(horse);
    horses.push(horse);
    if (['psg', 'i1', 'gp'].includes(level) && !rider.fei)
      rider.fei = String(int(10012000, 10298000));
  }
}

// ---------------------------------------------------------------------------
// Orders: every rider buys exactly one show entry (300 riders, 300 orders).
// ---------------------------------------------------------------------------
const NOW_LIMIT = Date.parse('2026-10-05T23:00:00Z');
const riderQueue = shuffle(riders);
const orders = [];
let cursor = 0;
for (const show of SHOWS) {
  for (let k = 0; k < show.quota; k++) {
    const rider = riderQueue[cursor++];
    orders.push({ show, rider });
  }
}
if (cursor !== RIDER_COUNT) throw new Error(`quota ${cursor} != ${RIDER_COUNT}`);

const orderRows = [];
const lineRows = [];
orders.forEach(({ show, rider }, idx) => {
  const n = idx + 1;
  const id = uuid(`order:${n}`);
  // Entries skew late: most riders enter in the last few weeks.
  const openMs = dateMs(show.open);
  const closeMs = Math.min(dateMs(show.close), NOW_LIMIT - DAY);
  const u = 1 - (1 - rand()) ** 1.7;
  const day = openMs + Math.floor((u * (closeMs - openMs)) / DAY) * DAY;
  const paidAt = Math.min(easternDaytime(day), NOW_LIMIT);
  const createdAt = paidAt - int(2, 9) * 60000 - int(0, 59) * 1000;

  const lines = [];
  const usedLabels = new Set();
  const horsesInOrder = rider.horses;
  const singleCounts = weighted([
    [1, 33],
    [2, 57],
    [3, 10],
  ]);
  const plan = horsesInOrder.length === 1 ? [singleCounts] : [chance(0.5) ? 2 : 1, 1];
  horsesInOrder.forEach((horse, hi) => {
    let want = plan[hi];
    let level = horse.level;
    let menu = menuFor(show, level, rider.category).filter((l) => !usedLabels.has(l));
    const picked = [];
    for (const label of shuffle(menu)) {
      if (picked.length >= want) break;
      picked.push(label);
    }
    // Moving up: some riders add a test at the next level.
    const next = LEVELS[LEVELS.indexOf(level) + 1];
    if (next && picked.length >= 1 && want >= 2 && chance(0.15) && level !== 'i1') {
      const up = menuFor(show, next, rider.category).filter(
        (l) => !usedLabels.has(l) && !picked.includes(l),
      );
      if (up.length) picked[picked.length - 1] = pick(up);
    }
    if (picked.length < want) {
      const up = next
        ? menuFor(show, next, rider.category).filter(
            (l) => !usedLabels.has(l) && !picked.includes(l),
          )
        : [];
      for (const label of up) if (picked.length < want) picked.push(label);
    }
    for (const label of picked) {
      usedLabels.add(label);
      lines.push({ kind: 'class_entry', label, horseId: horse.id });
    }
  });

  // Stabling.
  let stablingRequest = null;
  let arrival = null;
  let departure = null;
  if (chance(show.stableP)) {
    const modern = show.style !== 'old';
    let overnight = 0;
    const stallLines = new Map();
    for (let h = 0; h < horsesInOrder.length; h++) {
      const kind = modern
        ? weighted([
            ['Box Stall — Full Show', 88],
            ['Day Stall', 12],
          ])
        : weighted([
            ['Stabling — 2 nights', 75],
            ['Stabling — 1 night', 15],
            ['Stabling — daytime', 10],
          ]);
      stallLines.set(kind, (stallLines.get(kind) ?? 0) + 1);
      if (kind !== 'Day Stall' && kind !== 'Stabling — daytime') overnight++;
    }
    for (const [name, qty] of stallLines) lines.push({ kind: 'addon', name, qty });
    if (overnight && chance(0.82)) {
      lines.push({
        kind: 'addon',
        name: 'Shavings — per bag',
        qty: overnight * (show.style === 'app' ? int(3, 5) : int(2, 4)),
      });
    }
    if (chance(0.22))
      lines.push({ kind: 'addon', name: modern ? 'Tack Stall — Full Show' : 'Tack stall', qty: 1 });
    let early = false;
    if (modern && overnight && chance(0.12)) {
      early = true;
      lines.push({ kind: 'addon', name: 'Early Arrival — extra night', qty: overnight });
    }
    if (modern && chance(0.06)) {
      lines.push({
        kind: 'addon',
        name: 'RV / Camper Hookup — per night',
        qty: show.style === 'app' ? 3 : 2,
      });
    }
    const sameBarn = orders.filter(
      (o) => o.show === show && o.rider !== rider && o.rider.barn === rider.barn,
    );
    stablingRequest = { trainerName: rider.barn.name };
    if (chance(0.3)) {
      const mate = sameBarn.length && chance(0.7) ? pick(sameBarn).rider : null;
      stablingRequest.stableWith = mate ? `${mate.first} ${mate.last}` : `${rider.barn.name} group`;
    }
    const stallion = horsesInOrder.some((h) => h.stallion);
    if (stallion) stablingRequest.notes = 'Stallion — please stall at the end of the aisle.';
    else if (chance(0.15)) stablingRequest.notes = pick(STABLING_NOTES);
    if (chance(0.85)) {
      arrival = overnight ? addDays(show.start, early ? -2 : -1) : show.start;
      departure = show.end;
    }
  }

  orderRows.push({
    n,
    id,
    riderId: rider.id,
    showId: show.id,
    createdAt: iso(createdAt),
    paidAt: iso(paidAt),
    pi: `pi_demo_${token(`pi:${n}`, 24)}`,
    arrival,
    departure,
    stablingRequest,
    stablingId: uuid(`stabling:${n}`),
    waiverId: uuid(`waiver:${n}`),
  });
  lines.forEach((line, li) => {
    lineRows.push({
      ...line,
      orderId: id,
      lineNo: li + 1,
      entryId: line.kind === 'class_entry' ? uuid(`entry:${n}:${li + 1}`) : null,
    });
  });

  // Account created before the first purchase.
  const firstSeen = Math.max(Date.parse('2026-04-01T12:00:00Z'), createdAt - int(1, 120) * DAY);
  rider.createdAt = Math.min(rider.createdAt ?? Infinity, firstSeen - int(5, 300) * 60000);
});

// ---------------------------------------------------------------------------
// Vendors: 30 paid bookings (16 Blue Ridge, 14 Fall Championships).
// ---------------------------------------------------------------------------
const VENDORS = [
  [
    'Magnolia Tack & Saddlery',
    'English tack, bridles, saddle pads, dressage apparel and show-day essentials',
    '10x20 Booth',
    ['e20'],
    1,
  ],
  [
    'Blue Ridge Saddle Fitting',
    'Independent saddle fitting, on-site flocking adjustments and demo saddles',
    '10x10 Booth',
    ['e20'],
    0,
  ],
  [
    'Peach State Feed & Supply',
    'Feed, hay cubes, supplements and bedding — delivery to your stall',
    '10x20 Booth',
    [],
    0,
  ],
  [
    'Southern Shoeing Co.',
    'On-call farrier service, lost-shoe replacement and hoof care',
    '10x10 Booth',
    ['e20'],
    0,
  ],
  [
    'Hoofbeat Photography',
    'Official show photography — ride photos, prints and digital downloads',
    '10x10 Booth',
    ['e20'],
    1,
  ],
  [
    'Canter & Co. Coffee',
    'Espresso, cold brew, chai and breakfast sandwiches',
    'Food Truck Space',
    ['e50', 'water'],
    0,
  ],
  [
    "Smokin' Saddle BBQ",
    'Pulled pork, brisket, smoked chicken and Southern sides',
    'Food Truck Space',
    ['e50', 'water'],
    0,
  ],
  [
    'Wildflower Equestrian Boutique',
    'Riding apparel, gifts and equestrian home décor',
    '10x10 Booth',
    ['e20'],
    0,
  ],
  [
    'Chattahoochee Equine Bodywork',
    'Equine massage, PEMF and kinesiology taping',
    '10x10 Booth',
    ['e20'],
    0,
  ],
  [
    'Dressage Diva Apparel',
    'Show coats, stock ties, breeches and competition gloves',
    '10x20 Booth',
    ['e20'],
    1,
  ],
  [
    'Georgia Equine Insurance Group',
    'Equine mortality, major medical and farm liability insurance',
    '10x10 Booth',
    [],
    1,
  ],
  [
    'Triple Crown Trailer Sales',
    'Horse trailers, living-quarters models and trailer service',
    '20x20 Corner Booth',
    ['e20'],
    0,
  ],
  [
    'The Braiding Barn',
    'Professional dressage button braiding — book by ride time',
    '10x10 Booth',
    [],
    0,
  ],
  [
    'Stillwater Equine Veterinary',
    'Ambulatory vet services, Coggins and health certificates',
    '10x10 Booth',
    ['e20'],
    1,
  ],
  [
    'Sweet Tea & Biscuits Co.',
    'Chicken biscuits, sweet tea, lemonade and baked goods',
    'Food Truck Space',
    ['e50', 'water'],
    0,
  ],
  [
    'Tidewater Fly & Pest',
    'Fly sprays, fly sheets, masks and equine skincare',
    '10x10 Booth',
    [],
    0,
  ],
  [
    'Gilded Stirrup Jewelry',
    'Handcrafted equestrian jewelry and custom pieces',
    '10x10 Booth',
    ['e20'],
    0,
  ],
  [
    'Rein Check Leather Repair',
    'Tack cleaning, stitching and same-day leather repair',
    '10x10 Booth',
    ['e20'],
    0,
  ],
  ['Paddock Paws Pet Treats', 'All-natural horse and dog treats', '10x10 Booth', [], 1],
  [
    'Hilltop Hay & Shavings',
    'Hay and shavings delivered to the barns all weekend',
    '10x20 Booth',
    [],
    0,
  ],
  [
    'Equine Spirit Chiropractic',
    'AVCA-certified equine chiropractic adjustments',
    '10x10 Booth',
    ['e20'],
    0,
  ],
  [
    'Piaffe Performance Supplements',
    'Joint, gut and calming supplements for sport horses',
    '10x10 Booth',
    ['e20'],
    1,
  ],
  [
    'Collected Canter Portraits',
    'Commissioned equine portraits and fine-art prints',
    '10x10 Booth',
    ['e20'],
    1,
  ],
  [
    'La Yegua Taqueria',
    'Street tacos, burrito bowls and aguas frescas',
    'Food Truck Space',
    ['e50', 'water'],
    0,
  ],
  [
    'Pink Pony Snoballs',
    'New Orleans–style shaved ice and frozen lemonade',
    'Food Truck Space',
    ['e50', 'water'],
    0,
  ],
  [
    'Southern Comfort Blanket Care',
    'Blanket washing, waterproofing and repair',
    '10x20 Booth',
    ['e20', 'water'],
    0,
  ],
  [
    'Dressage Tack Exchange',
    'Consignment dressage saddles, bridles and show attire',
    '10x20 Booth',
    ['e20'],
    2,
  ],
  [
    'Champion Arena Footing',
    'Arena footing, drainage and maintenance equipment',
    '10x10 Booth',
    [],
    0,
  ],
  [
    'Halo Equine Laser Therapy',
    'Class IV laser and therapeutic ultrasound sessions',
    '10x10 Booth',
    ['e50'],
    0,
  ],
  ['Rising Trot Books & Gifts', 'Equestrian books, calendars and gifts', '10x10 Booth', ['e20'], 1],
];
const SPECIAL_REQUESTS = [
  'Please place us near the warm-up ring if possible.',
  'Corner spot if one is available.',
  'Need to set up Wednesday evening.',
  'Near the show office please — we sell to riders between tests.',
  'Generator-free area please; we rely on the hookup.',
  'Shade would be appreciated.',
];
const vendorRows = [];
const vendorLineRows = [];
const vendorOrder = shuffle(VENDORS.map((v, i) => ({ v, i })));
// Food trucks/corner booths split across shows so no show oversells its space caps.
const brKeys = [];
const fallKeys = [];
for (const entry of vendorOrder) {
  const target = brKeys.length < 16 && (fallKeys.length >= 14 || chance(0.55)) ? brKeys : fallKeys;
  target.push(entry);
}
for (const [show, list] of [
  [SHOW_BY_KEY['blue-ridge'], brKeys],
  [SHOW_BY_KEY.fall, fallKeys],
]) {
  for (const { v, i } of list) {
    const [name, products, booth, hookups, tables] = v;
    const n = i + 1;
    const id = uuid(`vendor:${n}`);
    let first;
    let last;
    do {
      first = pick(chance(0.6) ? FIRST_F : FIRST_M);
      last = pick(LAST);
    } while (usedNames.has(`${first} ${last}`.toLowerCase()));
    usedNames.add(`${first} ${last}`.toLowerCase());
    const slug = name
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9]+/g, '');
    const showStart = dateMs(show.start);
    const created = easternDaytime(showStart - int(28, 80) * DAY);
    const paid = Math.min(created + int(1, 6) * DAY + int(1, 600) * 60000, NOW_LIMIT);
    vendorRows.push({
      n,
      id,
      showId: show.id,
      name,
      contact: `${slug.slice(0, 24)}@${DOMAIN}`,
      contactName: `${first} ${last}`,
      phone: phone('GA'),
      website: `https://www.${slug.slice(0, 24)}.example`,
      products,
      special:
        booth === 'Food Truck Space'
          ? 'Need level ground for the truck and a 50A outlet.'
          : chance(0.35)
            ? pick(SPECIAL_REQUESTS)
            : null,
      createdAt: iso(created),
      paidAt: iso(paid),
      pi: `pi_demo_${token(`vpi:${n}`, 24)}`,
      cs: `cs_demo_${token(`vcs:${n}`, 24)}`,
    });
    const items = [[booth, 1]];
    if (hookups.includes('e20')) items.push(['Electric Hookup — 20 amp / 110V', 1]);
    if (hookups.includes('e50')) items.push(['Electric Hookup — 50 amp / 220V', 1]);
    if (hookups.includes('water')) items.push(['Water Hookup', 1]);
    if (tables) items.push(['Additional 6ft Table', tables]);
    items.forEach(([item, qty], li) => {
      vendorLineRows.push({
        id: uuid(`vendor-line:${n}:${li + 1}`),
        bookingId: id,
        lineNo: li + 1,
        item,
        qty,
      });
    });
  }
}

// Members: most riders hold a current Peachtree membership.
const members = riders
  .filter(() => chance(0.86))
  .map((r) => ({
    id: uuid(`member:${r.n}`),
    r,
    role:
      r.category === 'Open'
        ? 'Professional'
        : r.category === 'Children' || r.category === 'Junior'
          ? 'Junior Rider'
          : r.category === 'Young Rider' || r.category === 'Under 25 (U25)'
            ? 'Young Rider'
            : 'Adult Amateur',
    status: chance(0.93) ? 'active' : 'inactive',
    expires: chance(0.7) ? '2026-12-31' : '2027-12-31',
  }));

// ---------------------------------------------------------------------------
// SQL emit
// ---------------------------------------------------------------------------
function valuesBlock(rows, fn) {
  return rows.map((r) => `  (${fn(r).join(', ')})`).join(',\n');
}

const showIdsList = SHOWS.map((s) => q(s.id)).join(', ');
const newShow = SHOW_BY_KEY.fall;

const seed = `-- =============================================================================
-- Peachtree Dressage Association — sales-demo business dataset (${TAG})
-- GENERATED by scripts/generate-demo-seed.mjs — do not edit by hand; change the
-- generator and regenerate. Apply with scripts/apply-demo-seed.sh; remove with
-- scripts/apply-demo-seed.sh --cleanup (supabase/seed/demo-business-cleanup.sql).
--
-- Adds to org ${ORG_ID}:
--   ${riders.length} riders (auth.users + public.riders, no login: empty password)
--   ${horses.length} horses, ${members.length} member_database rows
--   ${orderRows.length} PAID orders (one per rider) across ${SHOWS.length} shows, ${lineRows.filter((l) => l.kind === 'class_entry').length} class entries,
--   stall / tack / shavings add-ons + stabling_requests, waiver signatures
--   ${vendorRows.length} PAID vendor bookings with booth + electric/water hookup items
--   1 new upcoming show ("${newShow.name}", ${newShow.start} – ${newShow.end})
--   extra offered classes / add-ons / vendor catalog on the showcase shows
--   address/phone/contact/rings on the 4 Peachtree venues (only where empty)
--
-- Re-runnable: every row has a fixed id (md5 of "${TAG}:<key>") and every
-- insert is ON CONFLICT DO NOTHING. Money is priced from the live catalog rows
-- with the app's own formulas (see the pricing section), so items, totals and
-- platform fees match what checkout would have charged.
--
-- Runs as the Management API's postgres role with no JWT. No trigger is
-- disabled: the only guarded writes are class_entries INSERTs with
-- holding = false (class_entries_holding_permission_check only gates holding
-- rows and DELETEs) and the show_entry_id UPDATE done by the app's own
-- reconcile_show_entry_numbering() RPC, which touches no gated column.
-- =============================================================================
begin;

-- ---------------------------------------------------------------------------
-- 0. Preconditions
-- ---------------------------------------------------------------------------
do $$
declare
  missing int;
begin
  if not exists (select 1 from public.organizations where id = ${q(ORG_ID)} and deleted_at is null) then
    raise exception 'Demo org ${ORG_ID} (Peachtree Dressage Association) is missing';
  end if;
  select count(*) into missing
    from unnest(array[${SHOWS.filter((s) => s.style !== 'app')
      .map((s) => `${q(s.id)}::uuid`)
      .join(', ')}]) as want(id)
   where not exists (select 1 from public.shows s where s.id = want.id and s.org_id = ${q(ORG_ID)});
  if missing > 0 then
    raise exception 'Expected Peachtree shows are missing (% of 4) — run supabase/seed.sql first', missing;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 1. New upcoming showcase show (copies Blue Ridge's approved waiver)
-- ---------------------------------------------------------------------------
insert into public.shows (
  id, org_id, venue_id, name, slug, date_label, start_date, end_date, status, disciplines, governing_bodies,
  show_type, published, published_at, timezone, ticket_open, ticket_close, locations, starting_rider_number,
  document_requirements, waiver_text, waiver_approved_at, waiver_approved_text, expenses, created_at
)
select
  ${q(newShow.id)}, ${q(ORG_ID)}, 'b0000000-0000-4000-8000-000000000007',
  ${q(newShow.name)}, 'peachtree-fall-dressage-championships', 'Nov 6 – Nov 8, 2026', ${q(newShow.start)}, ${q(newShow.end)},
  'green', '["Dressage"]'::jsonb, '["USEF","USDF"]'::jsonb, 'rated', true, '2026-08-14T14:00:00Z', 'America/New_York',
  '2026-08-17', '2026-10-30',
  '[{"name":"Main Arena","size":"standard"},{"name":"Covered Arena","size":"standard"},{"name":"Warm-up Ring","size":"small"}]'::jsonb,
  101,
  '[{"id":"dr-fall-champs-coggins","label":"Coggins","requiresExpiration":true,"requiresApproval":true},{"id":"dr-fall-champs-health","label":"Health Certificate","requiresExpiration":true,"requiresApproval":false}]'::jsonb,
  br.waiver_text, case when br.waiver_text is not null then '2026-08-14T13:45:00Z'::timestamptz end, br.waiver_approved_text,
  '[{"id":"e1","label":"Judge fees","amount":5400},{"id":"e2","label":"Facility rental","amount":7800},{"id":"e3","label":"Ribbons and championship awards","amount":1650},{"id":"e4","label":"Shavings","amount":2100},{"id":"e5","label":"EMT and farrier on call","amount":1200}]'::jsonb,
  '2026-08-01T15:00:00Z'
from (select (select waiver_text from public.shows where id = ${q(BLUE_RIDGE_ID)}) as waiver_text,
             (select waiver_approved_text from public.shows where id = ${q(BLUE_RIDGE_ID)}) as waiver_approved_text) br
on conflict (id) do nothing;

insert into public.divisions (id, show_id, name, position)
values
  (${q(uuid('division:fall:junior'))}, ${q(newShow.id)}, 'Junior Rider', 0),
  (${q(uuid('division:fall:aa'))}, ${q(newShow.id)}, 'Adult Amateur', 1),
  (${q(uuid('division:fall:open'))}, ${q(newShow.id)}, 'Open', 2)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- 2. Venues — fill contact details and rings only where still empty
-- ---------------------------------------------------------------------------
${VENUES.map(
  (v) => `update public.venues set
  address = coalesce(address, ${q(v.address)}),
  phone   = coalesce(phone, ${q(v.phone)}),
  contact = coalesce(contact, ${q(v.contact)}),
  rings   = case when rings is null or rings = '[]'::jsonb then ${qj(v.rings)} else rings end
where id = ${q(v.id)} and org_id = ${q(ORG_ID)};`,
).join('\n')}

-- ---------------------------------------------------------------------------
-- 3. Offered classes (catalog-linked by scoring_catalog.source_file)
-- ---------------------------------------------------------------------------
insert into public.classes (id, show_id, label, event, group_name, division, fee, judges_count, governing_body, ribbon_places, arena, award_scope, catalog_id)
select v.id::uuid, v.show_id::uuid, v.label, v.event, v.group_name, v.division, v.fee::numeric, 1, v.governing_body, 6, v.arena, v.award_scope,
       (select sc.id::text from public.scoring_catalog sc where sc.source_file = v.source_file order by sc.id limit 1)
from (values
${valuesBlock(classesToAdd, (c) => [q(c.id), q(c.show_id), q(c.label), q(c.event), q(c.group_name), q(c.division), c.fee, q(c.governing_body), q(c.arena), q(c.award_scope), q(c.source_file)])}
) as v(id, show_id, label, event, group_name, division, fee, governing_body, arena, award_scope, source_file)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- 4. Stabling add-ons and vendor booth / hookup catalog on the showcase shows
-- ---------------------------------------------------------------------------
insert into public.add_ons (id, show_id, name, price, enabled, qty, stalls, tack, shavings, nights)
select v.id::uuid, v.show_id::uuid, v.name, v.price::numeric, true, v.qty::int, v.stalls, v.tack, v.shavings, v.nights
from (values
${valuesBlock(addOnsToAdd, (a) => [q(a.id), q(a.show_id), q(a.name), a.price, a.qty ?? 'null', a.stalls, a.tack, a.shavings, a.nights])}
) as v(id, show_id, name, price, qty, stalls, tack, shavings, nights)
on conflict do nothing;

insert into public.vendor_items (id, show_id, name, price, enabled, qty)
select v.id::uuid, v.show_id::uuid, v.name, v.price::numeric, true, v.qty::int
from (values
${valuesBlock(vendorItemsToAdd, (a) => [q(a.id), q(a.show_id), q(a.name), a.price, a.qty ?? 'null'])}
) as v(id, show_id, name, price, qty)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- 5. Riders. public.riders.id references auth.users, so each rider gets a
--    minimal confirmed auth user with an empty password (cannot sign in).
--    raw_user_meta_data.demo_seed marks them for the cleanup script.
-- ---------------------------------------------------------------------------
create temp table _demo_riders (
  id uuid primary key, email text, first_name text, last_name text, phone text, street text, city text, state text,
  zip text, usef text, fei text, category text, dob text, ec_first_name text, ec_last_name text, ec_rel text,
  ec_phone text, created_at timestamptz
) on commit drop;
insert into _demo_riders values
${valuesBlock(riders, (r) => [q(r.id), q(r.email), q(r.first), q(r.last), q(r.phone), q(r.street), q(r.city), q(r.state), q(r.zip), q(r.usef), q(r.fei), q(r.category), q(r.dob), q(r.ec.first), q(r.ec.last), q(r.ec.rel), q(r.ec.phone), q(iso(r.createdAt))])};

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change,
  email_change_token_current, phone_change, phone_change_token, reauthentication_token, is_sso_user, is_anonymous
)
select '00000000-0000-0000-0000-000000000000', r.id, 'authenticated', 'authenticated', r.email, '', r.created_at,
       '{"provider":"email","providers":["email"]}'::jsonb,
       jsonb_build_object('full_name', r.first_name || ' ' || r.last_name, 'email_verified', true, 'demo_seed', ${q(TAG)}),
       r.created_at, r.created_at, '', '', '', '', '', '', '', '', false, false
from _demo_riders r
on conflict (id) do nothing;

insert into public.riders (id, email, first_name, last_name, phone, street, city, state, zip, usef, fei, category, dob,
                           ec_first_name, ec_last_name, ec_rel, ec_phone, created_at)
select id, email, first_name, last_name, phone, street, city, state, zip, usef, fei, category, dob,
       ec_first_name, ec_last_name, ec_rel, ec_phone, created_at
from _demo_riders
on conflict (id) do nothing;

insert into public.horses (id, rider_id, name, stable, trainer, trainer_phone, is_stallion, height, farrier, created_at)
select v.id::uuid, v.rider_id::uuid, v.name, v.stable, v.trainer, v.trainer_phone, v.is_stallion, v.height, v.farrier,
       r.created_at + (v.n || ' minutes')::interval
from (values
${valuesBlock(horses, (h) => {
  const r = riders.find((x) => x.id === h.riderId);
  return [
    q(h.id),
    q(h.riderId),
    q(h.name),
    q(r.barn.name),
    q(r.barn.trainer),
    q(r.barn.trainerPhone),
    h.stallion,
    q(h.height),
    q(r.barn.farrier),
    r.horses.indexOf(h) + 2,
  ];
})}
) as v(id, rider_id, name, stable, trainer, trainer_phone, is_stallion, height, farrier, n)
join _demo_riders r on r.id = v.rider_id::uuid
on conflict (id) do nothing;

insert into public.member_database (id, org_id, name, first_name, last_name, email, phone, role, membership_status, membership_expires, created_at)
select v.id::uuid, ${q(ORG_ID)}, r.first_name || ' ' || r.last_name, r.first_name, r.last_name, r.email, r.phone, v.role, v.status, v.expires, r.created_at
from (values
${valuesBlock(members, (m) => [q(m.id), q(m.r.id), q(m.role), q(m.status), q(m.expires)])}
) as v(id, rider_id, role, status, expires)
join _demo_riders r on r.id = v.rider_id::uuid
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- 6. Orders — staged, then priced from the live catalog
-- ---------------------------------------------------------------------------
create temp table _demo_orders (
  id uuid primary key, rider_id uuid, show_id uuid, created_at timestamptz, paid_at timestamptz, pi text,
  arrival_date text, departure_date text, stabling_request jsonb, stabling_id uuid, waiver_id uuid
) on commit drop;
insert into _demo_orders values
${valuesBlock(orderRows, (o) => [q(o.id), q(o.riderId), q(o.showId), q(o.createdAt), q(o.paidAt), q(o.pi), q(o.arrival), q(o.departure), qj(o.stablingRequest), q(o.stablingId), q(o.waiverId)])};

create temp table _demo_lines (
  order_id uuid, line_no int, kind text, class_label text, horse_id uuid, addon_name text, qty int, entry_id uuid,
  primary key (order_id, line_no)
) on commit drop;
insert into _demo_lines values
${valuesBlock(lineRows, (l) => [q(l.orderId), l.lineNo, q(l.kind), q(l.kind === 'class_entry' ? l.label : null), q(l.kind === 'class_entry' ? l.horseId : null), q(l.kind === 'addon' ? l.name : null), l.kind === 'addon' ? l.qty : 1, q(l.entryId)])};

-- Pricing mirrors the app exactly:
--   class line   unitPrice = round2(fee + calcPlatformFee(fee, org.fee_model))
--                calcPlatformFee: gmo -> 18%; fee <= 75 -> 7.99; else max(7.99, 8%)
--   add-on line  unitPrice = round2(price * 1.08), amount = round2(unitPrice * qty)
--   fee_total    = round2(sum of the unrounded platform fees)
create temp table _demo_items on commit drop as
with resolved as (
  select l.*, o.show_id, o.paid_at, org.fee_model,
         c.id as class_id, c.label as class_label_live, greatest(coalesce(c.fee, 0), 0) as class_fee,
         h.name as horse_name,
         a.id as addon_id, a.name as addon_name_live, greatest(coalesce(a.price, 0), 0) as addon_price,
         coalesce(a.stalls, 0) as stalls, coalesce(a.tack, 0) as tack
  from _demo_lines l
  join _demo_orders o on o.id = l.order_id
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
  select count(*) into bad from _demo_items
   where (kind = 'class_entry' and (class_id is null or horse_name is null))
      or (kind = 'addon' and addon_id is null);
  if bad > 0 then
    raise exception 'Demo seed: % order lines did not resolve to a live class / horse / add-on', bad;
  end if;
end $$;

insert into public.orders (
  id, rider_id, show_id, stripe_payment_intent_id, amount_total, status, items, fee_total, refunded_amount,
  created_at, paid_at, arrival_date, departure_date, additional_charges_total, additional_charges, stabling_request, refund_log
)
select o.id, o.rider_id, o.show_id, o.pi, t.total, 'paid', t.items, t.fee_total, 0,
       o.created_at, o.paid_at, o.arrival_date, o.departure_date, 0, '[]'::jsonb, o.stabling_request, '[]'::jsonb
from _demo_orders o
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
  from _demo_items
  group by order_id
) t on t.order_id = o.id
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 7. Class entries — the rows finalizeClaimedOrder would have created
-- ---------------------------------------------------------------------------
-- Number the pre-existing roster first (what the Entry Ledger does on first
-- open) so the seeded riders' entry numbers form one block after it.
select public.reconcile_show_entry_numbering(id) from public.shows where id in (${showIdsList});

-- One rider number per rider per show, in a block above every existing
-- numeric bib in that show (rounded up to the next hundred) so a seeded number
-- never collides with the imported roster on class_entries (class_id, num).
create temp table _demo_show_num on commit drop as
select s.id as show_id,
       (ceil(greatest(coalesce(s.starting_rider_number, 101) - 1,
                      coalesce(max(case when ce.num ~ '^[0-9]{1,6}$' then ce.num::int end), 0)) / 100.0) * 100)::int as base
from public.shows s
left join public.classes c on c.show_id = s.id
left join public.class_entries ce on ce.class_id = c.id
                                  and ce.id not in (select entry_id from _demo_lines where entry_id is not null)
where s.id in (${showIdsList})
group by s.id, s.starting_rider_number;

create temp table _demo_class_base on commit drop as
select i.class_id, coalesce((select max(ce.ride_order) from public.class_entries ce
                              where ce.class_id = i.class_id
                                and ce.id not in (select entry_id from _demo_lines where entry_id is not null)), -1) as base
from (select distinct class_id from _demo_items where kind = 'class_entry') i;

insert into public.class_entries (id, class_id, draw, num, rider, horse, rider_id, horse_id, order_id, ride_order, status, division)
select i.entry_id, i.class_id, null,
       lpad((sn.base + rs.seq)::text, 4, '0'),
       trim(coalesce(r.first_name, '') || ' ' || coalesce(r.last_name, '')),
       i.horse_name, o.rider_id, i.horse_id, o.id,
       cb.base + row_number() over (partition by i.class_id order by o.paid_at, o.id, i.line_no),
       'scheduled',
       case r.category when 'Junior' then 'J' when 'Children' then 'J' when 'Young Rider' then 'Y'
                       when 'Under 25 (U25)' then 'Y' when 'Adult Amateur' then 'A' else 'O' end
from _demo_items i
join _demo_orders o on o.id = i.order_id
join public.riders r on r.id = o.rider_id
join _demo_show_num sn on sn.show_id = o.show_id
join (select id, row_number() over (partition by show_id order by paid_at, id) as seq from _demo_orders) rs on rs.id = o.id
join _demo_class_base cb on cb.class_id = i.class_id
where i.kind = 'class_entry'
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 8. Stall bookings (materializeStablingRequest) and waiver signatures
-- ---------------------------------------------------------------------------
insert into public.stabling_requests (id, show_id, order_id, rider_id, trainer_name, horse_stalls, tack_stalls, stable_with, notes, created_at, updated_at)
select o.stabling_id, o.show_id, o.id, o.rider_id, o.stabling_request ->> 'trainerName', s.horse_stalls, s.tack_stalls,
       o.stabling_request ->> 'stableWith', o.stabling_request ->> 'notes', o.paid_at, o.paid_at
from _demo_orders o
join (select order_id, sum(qty * stalls)::int as horse_stalls, sum(qty * tack)::int as tack_stalls
        from _demo_items where kind = 'addon' group by order_id) s on s.order_id = o.id
where o.stabling_request ->> 'trainerName' is not null
  and (s.horse_stalls > 0 or s.tack_stalls > 0)
on conflict do nothing;

insert into public.waiver_signatures (id, rider_id, show_id, full_name, signed_at, signature_date)
select o.waiver_id, o.rider_id, o.show_id, trim(r.first_name || ' ' || r.last_name), o.created_at - interval '3 minutes',
       to_char((o.created_at - interval '3 minutes') at time zone 'America/New_York', 'YYYY-MM-DD')
from _demo_orders o
join public.riders r on r.id = o.rider_id
join public.shows s on s.id = o.show_id
where nullif(btrim(coalesce(s.waiver_text, '')), '') is not null
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- 9. Vendors — paid booth bookings priced like priceVendorBooking (+8% fee)
-- ---------------------------------------------------------------------------
create temp table _demo_vendors (
  id uuid primary key, show_id uuid, name text, contact text, contact_name text, phone text, website text,
  products_offered text, special_requests text, created_at timestamptz, paid_at timestamptz, pi text, cs text
) on commit drop;
insert into _demo_vendors values
${valuesBlock(vendorRows, (v) => [q(v.id), q(v.showId), q(v.name), q(v.contact), q(v.contactName), q(v.phone), q(v.website), q(v.products), q(v.special), q(v.createdAt), q(v.paidAt), q(v.pi), q(v.cs)])};

create temp table _demo_vendor_lines (id uuid primary key, booking_id uuid, line_no int, item_name text, qty int) on commit drop;
insert into _demo_vendor_lines values
${valuesBlock(vendorLineRows, (l) => [q(l.id), q(l.bookingId), l.lineNo, q(l.item), l.qty])};

create temp table _demo_vendor_priced on commit drop as
select l.*, vi.id as vendor_item_id, vi.name as item_live, greatest(coalesce(vi.price, 0), 0) as price,
       round(greatest(coalesce(vi.price, 0), 0) * 1.08, 2) as unit_price,
       round(round(greatest(coalesce(vi.price, 0), 0) * 1.08, 2) * l.qty, 2) as amount,
       greatest(coalesce(vi.price, 0), 0) * 0.08 * l.qty as platform_fee
from _demo_vendor_lines l
join _demo_vendors v on v.id = l.booking_id
left join public.vendor_items vi on vi.show_id = v.show_id and vi.name = l.item_name;

do $$
begin
  if exists (select 1 from _demo_vendor_priced where vendor_item_id is null) then
    raise exception 'Demo seed: a vendor booking line did not resolve to a live vendor_items row';
  end if;
end $$;

insert into public.vendor_bookings (
  id, show_id, name, contact, contact_name, phone, website, products_offered, special_requests, status, created_at,
  stripe_payment_intent_id, paid_at, amount_total, fee_total, refunded_amount, additional_charges_total,
  additional_charges, document_uploads, agreement_signed_at, agreement_signed_text, agreement_signed_name,
  checkout_snapshot, refund_log
)
select v.id, v.show_id, v.name, v.contact, v.contact_name, v.phone, v.website, v.products_offered, v.special_requests,
       'paid', v.created_at, v.pi, v.paid_at, t.total, t.fee_total, 0, 0, '[]'::jsonb, '[]'::jsonb,
       case when s.vendor_agreement_text is not null then v.paid_at - interval '6 minutes' end,
       s.vendor_agreement_text,
       case when s.vendor_agreement_text is not null then v.contact_name end,
       jsonb_build_object('sessionId', v.cs, 'total', trim_scale(t.total), 'feeTotal', trim_scale(t.fee_total),
                          'currency', lower(coalesce(org.currency, 'usd')), 'items', t.items,
                          'pricedAt', to_char((v.paid_at - interval '4 minutes') at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
                          'seed', ${q(TAG)}),
       '[]'::jsonb
from _demo_vendors v
join public.shows s on s.id = v.show_id
join public.organizations org on org.id = s.org_id
join (
  select booking_id,
         jsonb_agg(jsonb_build_object('label', item_live, 'vendorItemId', vendor_item_id, 'qty', qty,
                                      'unitPrice', trim_scale(unit_price), 'amount', trim_scale(amount)) order by line_no) as items,
         sum(amount) as total,
         round(sum(platform_fee), 2) as fee_total
  from _demo_vendor_priced group by booking_id
) t on t.booking_id = v.id
on conflict (id) do nothing;

insert into public.vendor_booking_items (id, booking_id, vendor_item_id, qty)
select p.id, p.booking_id, p.vendor_item_id, p.qty from _demo_vendor_priced p
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- 10. Entry ledger numbering for the new entries (same RPC the app calls)
-- ---------------------------------------------------------------------------
select public.reconcile_show_entry_numbering(id) from public.shows where id in (${showIdsList});

-- ---------------------------------------------------------------------------
-- 11. Post-conditions — abort the whole transaction if anything is off
-- ---------------------------------------------------------------------------
do $$
declare
  n int;
begin
  select count(*) into n from public.orders where id in (select id from _demo_orders) and status = 'paid';
  if n <> ${orderRows.length} then raise exception 'Demo seed: expected ${orderRows.length} paid orders, found %', n; end if;

  select count(*) into n from public.riders where id in (select id from _demo_riders);
  if n <> ${riders.length} then raise exception 'Demo seed: expected ${riders.length} riders, found %', n; end if;

  select count(*) into n from public.horses h join _demo_riders r on r.id = h.rider_id;
  if n <> ${horses.length} then raise exception 'Demo seed: expected ${horses.length} horses, found %', n; end if;

  -- Every class_entry line has exactly one class_entries row on its order.
  select count(*) into n from public.orders o
   where o.id in (select id from _demo_orders)
     and (select count(*) from jsonb_array_elements(o.items) e where e ->> 'kind' = 'class_entry')
         <> (select count(*) from public.class_entries ce where ce.order_id = o.id);
  if n > 0 then raise exception 'Demo seed: % orders have items that do not match their class entries', n; end if;

  -- Totals add up.
  select count(*) into n from public.orders o
   where o.id in (select id from _demo_orders)
     and o.amount_total <> (select sum((e ->> 'amount')::numeric) from jsonb_array_elements(o.items) e);
  if n > 0 then raise exception 'Demo seed: % orders whose amount_total is not the sum of their items', n; end if;

  select count(*) into n from public.vendor_bookings where id in (select id from _demo_vendors) and status = 'paid';
  if n <> ${vendorRows.length} then raise exception 'Demo seed: expected ${vendorRows.length} paid vendor bookings, found %', n; end if;
end $$;

commit;
`;

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------
const list = (ids) => ids.map((id) => `    ${q(id)}`).join(',\n');
const cleanup = `-- =============================================================================
-- Removes everything supabase/seed/demo-business-seed.sql (${TAG}) added.
-- GENERATED by scripts/generate-demo-seed.mjs — regenerate rather than edit.
-- Only rows with the seed's fixed ids (or hanging off them) are deleted; venue
-- fields are reset only while they still hold the exact seeded value.
--
-- Not reverted (deliberately): show_entries/show_horses that
-- reconcile_show_entry_numbering() created for the PRE-EXISTING roster rows of
-- the seeded shows. The app creates those itself on the first Entry Ledger
-- visit, and removing them could break the count-based entry numbering.
--
-- class_entries DELETE is guarded by class_entries_holding_permission_check
-- (needs canEditShow). The Management API has no JWT, so this script acts as
-- the org's Organizer for the duration of the transaction (request.jwt.claims,
-- transaction-local) instead of disabling the trigger.
-- =============================================================================
begin;

do $$
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
    raise exception 'No Organizer or SuperAdmin user to act as — cannot pass the class_entries delete guard';
  end if;
  perform set_config('request.jwt.claims', json_build_object('sub', actor, 'role', 'authenticated')::text, true);
end $$;

create temp table _demo_rider_ids (id uuid primary key) on commit drop;
insert into _demo_rider_ids values
${riders.map((r) => `  (${q(r.id)})`).join(',\n')};

create temp table _demo_order_ids (id uuid primary key) on commit drop;
insert into _demo_order_ids values
${orderRows.map((o) => `  (${q(o.id)})`).join(',\n')};

-- Vendors (booking items cascade), then the catalog rows the seed created.
delete from public.vendor_bookings where id in (
${list(vendorRows.map((v) => v.id))}
);
-- Kept if a real (non-seeded) booking has since bought one of them.
delete from public.vendor_items vi
 where vi.id in (
${list(vendorItemsToAdd.map((v) => v.id))}
 )
   and not exists (select 1 from public.vendor_booking_items b where b.vendor_item_id = vi.id);

-- Entries first, while their class rows still exist (the delete guard looks
-- up the class's show).
delete from public.class_entries
 where order_id in (select id from _demo_order_ids)
    or rider_id in (select id from _demo_rider_ids)
    or class_id in (select id from public.classes where show_id = ${q(newShow.id)})
    or class_id in (
${list(classesToAdd.map((c) => c.id))}
    );

delete from public.stabling_requests where order_id in (select id from _demo_order_ids);
delete from public.orders where id in (select id from _demo_order_ids);

-- Entry-ledger rows numbered for the seeded riders / horses.
delete from public.show_entries where rider_id in (select id from _demo_rider_ids);
delete from public.show_horses where horse_id in (select h.id from public.horses h where h.rider_id in (select id from _demo_rider_ids));

delete from public.waiver_signatures where rider_id in (select id from _demo_rider_ids);
delete from public.member_database where id in (
${list(members.map((m) => m.id))}
);

-- Riders (horses cascade) and their auth users.
delete from public.riders where id in (select id from _demo_rider_ids);
delete from auth.users
 where id in (select id from _demo_rider_ids)
   and raw_user_meta_data ->> 'demo_seed' = ${q(TAG)};

-- Classes and add-ons the seed added to existing shows.
delete from public.classes where id in (
${list(classesToAdd.map((c) => c.id))}
);
delete from public.add_ons where id in (
${list(addOnsToAdd.map((a) => a.id))}
);

-- The seed-owned show (its classes, add-ons, divisions, ledger rows cascade).
delete from public.shows where id = ${q(newShow.id)};

-- Venue details, only while unchanged since seeding.
${VENUES.map(
  (v) => `update public.venues set
  address = case when address = ${q(v.address)} then null else address end,
  phone   = case when phone = ${q(v.phone)} then null else phone end,
  contact = case when contact = ${q(v.contact)} then null else contact end,
  rings   = case when rings = ${qj(v.rings)} then '[]'::jsonb else rings end
where id = ${q(v.id)};`,
).join('\n')}

commit;
`;

// The calendar seed (scripts/generate-demo-calendar-seed.mjs) imports the
// rider / horse roster from here, so this file only writes SQL when it is run
// directly — importing it builds the same data without touching any file.
export { TAG, DOMAIN, ORG_ID, BLUE_RIDGE_ID, riders, horses, barns, VENUES, STABLING_NOTES };

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(join(OUT_DIR, 'demo-business-seed.sql'), seed);
  writeFileSync(join(OUT_DIR, 'demo-business-cleanup.sql'), cleanup);

  const entryCount = lineRows.filter((l) => l.kind === 'class_entry').length;
  const stabled = orderRows.filter((o) => o.stablingRequest).length;
  console.log(
    `riders ${riders.length}, horses ${horses.length}, orders ${orderRows.length}, class entries ${entryCount}, ` +
      `stabled orders ${stabled}, vendors ${vendorRows.length}, vendor lines ${vendorLineRows.length}, ` +
      `members ${members.length}, classes added ${classesToAdd.length}`,
  );
}
