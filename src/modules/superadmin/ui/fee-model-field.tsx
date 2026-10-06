'use client';

import { Label } from '@/shared/ui/shadcn/label';

export function FeeModelField({
  id,
  registration,
}: {
  id: string;
  registration: Record<string, unknown>;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>Fee model</Label>
      <select
        id={id}
        className="h-9 w-full rounded-lg border border-[#E7EAEE] bg-white px-2.5 text-[13.5px] text-[#101828] outline-none focus-visible:border-[#9FD3BA] focus-visible:ring-2 focus-visible:ring-[#EAF5EF]"
        {...registration}
      >
        <option value="default">Default — $7.99 floor, then 8%</option>
        <option value="gmo">GMO — flat 18%, no floor</option>
      </select>
      <p className="text-xs leading-relaxed text-[#475467]">
        Applies to class entry fees only. Add-ons, qualifying fees and vendor booths always take a
        flat 8% regardless of this setting.
      </p>
    </div>
  );
}
