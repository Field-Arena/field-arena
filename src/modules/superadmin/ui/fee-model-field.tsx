'use client';

import { Label } from '@/shared/ui/shadcn/label';

/** The fee-model select, shared by both dialogs. */
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
        className="h-9 w-full rounded-lg border border-border bg-white px-2.5 text-[13.5px] text-ink outline-none focus-visible:border-gold focus-visible:ring-2 focus-visible:ring-gold/30"
        {...registration}
      >
        <option value="default">Default — $7.99 floor, then 8%</option>
        <option value="gmo">GMO — flat 18%, no floor</option>
      </select>
      <p className="text-fa-muted text-xs leading-relaxed">
        Applies to class entry fees only. Add-ons, qualifying fees and vendor booths always take a
        flat 8% regardless of this setting.
      </p>
    </div>
  );
}
