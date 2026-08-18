import { RIBBONS, ribbonFor } from '@/modules/shows/constants';
import { RibbonChip } from '@/modules/shows/ui/awards/ribbon-chip';

/**
 * How many of each colour to pull before the first class, as pill chips.
 *
 * Runs to the most places any one unit awards — a show where nothing awards
 * more than four places has no reason to list six. Six is the floor, matching
 * the legacy's `maxPlacesSeen || 6`, so the strip is never empty.
 *
 * Standard colours only, even where a class overrides them: this is the count
 * for the ribbon box, and a class's own championship ribbons are counted under
 * their own name by the tally.
 */
export function RibbonChips({
  maxPlaces,
  tally,
}: {
  maxPlaces: number;
  tally: Record<string, number>;
}) {
  const places = Array.from({ length: maxPlaces || 6 }, (_, i) => ribbonFor(i));

  // A class carrying custom colours contributes names the standard list has no
  // row for; they would otherwise be tallied and never shown.
  const standard = new Set(RIBBONS.map((r) => r.name));
  const custom = Object.keys(tally)
    .filter((name) => name && !standard.has(name as (typeof RIBBONS)[number]['name']))
    .sort();

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2.5">
      {places.map((ribbon, index) => (
        <RibbonChip
          key={ribbon.place || index}
          place={ribbon.place}
          fill={ribbon.bg}
          numFg={ribbon.fg}
          name={ribbon.name || '—'}
          count={tally[ribbon.name] ?? 0}
        />
      ))}

      {custom.map((name) => (
        <RibbonChip
          key={name}
          place=""
          fill="#E7EEE9"
          numFg="#1F3A2E"
          name={name}
          count={tally[name] ?? 0}
        />
      ))}
    </div>
  );
}
