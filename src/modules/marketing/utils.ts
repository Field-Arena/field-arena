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

export function gridDividerClasses(
  index: number,
  total: number,
  columns: ResponsiveColumns,
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
