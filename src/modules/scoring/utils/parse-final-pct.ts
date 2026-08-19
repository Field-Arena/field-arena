import type { Score } from '@/modules/scoring/scoring-engine';

export function parseFinalPct(raw: string | null): Score | null {
  if (raw === null) return null;
  if (raw === 'SCR' || raw === 'ELIM') return raw;
  const n = Number(raw);
  return Number.isNaN(n) ? null : n;
}
