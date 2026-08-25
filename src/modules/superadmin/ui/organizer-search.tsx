'use client';

import { Input } from '@/shared/ui/shadcn/input';
import { Label } from '@/shared/ui/shadcn/label';
import { useOrganizerSearch } from '@/modules/superadmin/hooks/use-organizer-search';

export function OrganizerSearch() {
  const { value, onChange } = useOrganizerSearch();

  return (
    <span className="flex items-center gap-2">
      <Label
        htmlFor="organizer-search"
        className="text-fa-muted text-[11px] font-bold tracking-[0.06em] uppercase"
      >
        Organizer
      </Label>
      <Input
        id="organizer-search"
        type="search"
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        placeholder="Search organizers…"
        className="border-border text-ink focus-visible:border-gold focus-visible:ring-gold/30 h-auto w-[210px] rounded-lg border bg-white px-3 py-1.5 text-[13px] outline-none placeholder:text-[#8a968f] focus-visible:ring-2"
      />
    </span>
  );
}
