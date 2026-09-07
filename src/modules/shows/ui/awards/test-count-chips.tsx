import { TestCountChip } from '@/modules/shows/ui/awards/test-count-chip';

export function TestCountChips({ tally }: { tally: Record<string, number> }) {
  const names = Object.keys(tally).sort((a, b) => a.localeCompare(b));

  if (names.length === 0) {
    return <p className="text-[12.5px] text-[#98A29D]">No entries yet.</p>;
  }

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2.5">
      {names.map((name) => (
        <TestCountChip key={name} name={name} count={tally[name] ?? 0} />
      ))}
    </div>
  );
}
