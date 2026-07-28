/**
 * The "problem" and "roles" sections are each a SINGLE bordered, rounded
 * container subdivided by internal borders — not a gap-separated set of cards.
 * So the internal borders have to be recomputed whenever the column count
 * changes at a breakpoint, or the grid grows dangling edges off the last row and
 * column. The design handoff calls this out specifically.
 *
 * Every class this can return is written out literally so Tailwind's scanner
 * sees them; building the names by interpolation would leave them unstyled.
 */
export interface ResponsiveColumns {
  base: number;
  sm: number;
  lg: number;
}

function needsRight(index: number, columns: number): boolean {
  return index % columns !== columns - 1;
}

function needsBottom(index: number, total: number, columns: number): boolean {
  return Math.floor(index / columns) !== Math.floor((total - 1) / columns);
}

/**
 * Divider classes for one cell of a bordered grid container.
 *
 * Each breakpoint sets BOTH edges explicitly rather than inheriting from the
 * smaller one — a cell needing a right border at `sm` but not at `lg` has to
 * actively switch it off, which is exactly the dangling-edge case.
 */
export function gridDividerClasses(
  index: number,
  total: number,
  columns: ResponsiveColumns
): string {
  return [
    needsRight(index, columns.base) ? 'border-r' : 'border-r-0',
    needsBottom(index, total, columns.base) ? 'border-b' : 'border-b-0',
    needsRight(index, columns.sm) ? 'sm:border-r' : 'sm:border-r-0',
    needsBottom(index, total, columns.sm) ? 'sm:border-b' : 'sm:border-b-0',
    needsRight(index, columns.lg) ? 'lg:border-r' : 'lg:border-r-0',
    needsBottom(index, total, columns.lg) ? 'lg:border-b' : 'lg:border-b-0',
  ].join(' ');
}
