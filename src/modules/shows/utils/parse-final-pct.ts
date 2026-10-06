// class_entries.final_pct is text: a percentage for a scored ride, or a
// status code like "SCR" / "ELIM" / "WD" / "RET". Anything that isn't a real
// number is unplaced — null — rather than NaN, which sorts and compares as
// garbage and ends up on the awards sheet.
export function parseFinalPct(value: string | null | undefined): number | null {
  if (value == null) return null;
  const trimmed = value.trim().replace(/%$/, '');
  if (trimmed === '') return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}
