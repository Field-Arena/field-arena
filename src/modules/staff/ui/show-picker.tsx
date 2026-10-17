'use client';

import { useRouter } from 'next/navigation';
import type { DashboardShowRow } from '@/modules/shows/types';

/** "Go to any show": picking a show goes straight into it, no Switch button. */
export function ShowPicker({
  upcoming,
  finished,
}: {
  upcoming: DashboardShowRow[];
  finished: DashboardShowRow[];
}) {
  const router = useRouter();
  const option = (s: DashboardShowRow) => (
    <option key={s.id} value={s.slug ?? s.id}>
      {s.dateLabel ? `${s.name} — ${s.dateLabel}` : s.name}
    </option>
  );

  return (
    <label className="block max-w-[520px]">
      <span className="text-[13px] font-semibold text-[#5A6B63]">Go to any show</span>
      <select
        defaultValue=""
        onChange={(e) => {
          if (e.target.value) router.push(`/dashboard?show=${encodeURIComponent(e.target.value)}`);
        }}
        className="mt-1.5 block h-[50px] w-full cursor-pointer rounded-xl border-2 border-[#1A5B3C] bg-white px-4 text-[16px] font-bold text-[#0D2C23]"
      >
        <option value="" disabled>
          Choose a show…
        </option>
        {upcoming.length > 0 && <optgroup label="Upcoming">{upcoming.map(option)}</optgroup>}
        {finished.length > 0 && <optgroup label="Completed">{finished.map(option)}</optgroup>}
      </select>
    </label>
  );
}
