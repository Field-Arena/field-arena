/* Level buckets for the Master Schedule's colour bars and legend filter —
 * the prototype's Intro / Training / First / Second / Freestyle key, extended
 * to every level the catalog carries. */
export const SCHEDULE_LEVELS = [
  { key: 'intro', label: 'Intro', color: '#0B6BB8', match: /\bintro/i },
  { key: 'training', label: 'Training', color: '#146A47', match: /\btraining\b/i },
  { key: 'first', label: 'First', color: '#5B5BD6', match: /\bfirst\b/i },
  { key: 'second', label: 'Second', color: '#B45309', match: /\bsecond\b/i },
  { key: 'third', label: 'Third', color: '#0E7490', match: /\bthird\b/i },
  { key: 'fourth', label: 'Fourth', color: '#7A5AF8', match: /\bfourth\b/i },
  {
    key: 'freestyle',
    label: 'Freestyle',
    color: '#C0367A',
    match: /\b(freestyle|pas de deux|quadrille)\b/i,
  },
  {
    key: 'fei',
    label: 'FEI',
    color: '#B42318',
    match: /\b(psg|prix st|intermediate|grand prix|young rider|junior|children|pony)\b/i,
  },
] as const;

export type ScheduleLevelKey = (typeof SCHEDULE_LEVELS)[number]['key'] | 'other';

export function levelOf(label: string): { key: ScheduleLevelKey; color: string } {
  // Freestyle wins over the level name inside it ("First Level Freestyle").
  const freestyle = SCHEDULE_LEVELS.find((l) => l.key === 'freestyle');
  if (freestyle?.match.test(label)) return { key: freestyle.key, color: freestyle.color };
  const hit = SCHEDULE_LEVELS.find((l) => l.match.test(label));
  return hit ? { key: hit.key, color: hit.color } : { key: 'other', color: '#8A94A3' };
}

/** "Training Level — Test 1 — Open" → "TL-1", for the ride's test badge. */
export function rideTestCode(label: string): string {
  const parts = label.split(' — ');
  const test = parts.length > 1 ? (parts[1] ?? '') : (parts[0] ?? '');
  const group = parts.length > 1 ? (parts[0] ?? null) : null;
  const tail = /([0-9]+|\b[A-Z])$/.exec(test.trim())?.[1];
  const source = (group ?? test.replace(/\s*([0-9]+|\b[A-Z])$/, ''))
    .replace(/\b(Test|Class)\b/gi, '')
    .trim();
  const words = source.split(/[\s/]+/).filter(Boolean);
  const head =
    words.length > 1
      ? words.map((w) => w[0]?.toUpperCase() ?? '').join('')
      : (words[0] ?? 'CL').slice(0, 3).toUpperCase();
  return tail ? `${head}-${tail.toUpperCase()}` : head;
}
