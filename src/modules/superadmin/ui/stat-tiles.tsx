import { cn } from '@/shared/lib/utils';

export interface StatTile {
  label: string;
  value: number | string;
}

// Shared plain-tile stat row (no icon) — used wherever a page needs quick
// counts without the icon-swatch treatment ConsoleStatBar uses on Overview.
export function StatTiles({ tiles }: { tiles: StatTile[] }) {
  return (
    <div className="flex flex-wrap gap-3">
      {tiles.map((tile) => {
        const zero = tile.value === 0 || tile.value === '0' || tile.value === '—';
        return (
          <div key={tile.label} className="fa-stat flex min-w-[138px] flex-[1_1_150px] flex-col">
            <span
              className={cn(
                'text-[26px] leading-none font-bold tracking-[-.02em] tabular-nums',
                zero ? 'text-[#C3CAD3]' : 'text-[#101828]',
              )}
            >
              {tile.value}
            </span>
            <span className="mt-[7px] text-[11px] font-semibold tracking-[.08em] whitespace-nowrap text-[#8A94A3] uppercase">
              {tile.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
