'use client';

import { Loader2Icon } from 'lucide-react';
import { Button } from '@/shared/ui/shadcn/button';
import { Input } from '@/shared/ui/shadcn/input';
import { Label } from '@/shared/ui/shadcn/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/shadcn/select';
import { useSettlementSettingsForm } from '@/modules/superadmin/hooks/use-settlement-settings-form';

const FIELD =
  'h-auto w-full rounded-[10px] border-field bg-white px-4 py-3 text-[14.5px] text-hunter-deep ' +
  'focus-visible:border-gold focus-visible:ring-[3px] focus-visible:ring-gold/[.16]';
const LABEL = 'mb-2 block text-[10px] font-bold uppercase tracking-[.16em] text-fa-muted-2';

export function SettlementSettings({
  orgId,
  payoutCadence,
  holdbackPercent,
}: {
  orgId: string;
  payoutCadence: string;
  holdbackPercent: number | null;
}) {
  const { cadence, setCadence, holdback, setHoldback, invalid, dirty, isPending, save } =
    useSettlementSettingsForm({ orgId, payoutCadence, holdbackPercent });

  return (
    <section className="border-line-mint rounded-xl border bg-[#F3F0E7] p-7">
      <h2 className="text-hunter-deep mb-1.5 font-[family-name:var(--font-nr)] text-[22px] font-medium">
        Settlement settings
      </h2>
      <p className="text-fa-muted mb-6 max-w-[620px] text-[13.5px] leading-[1.6]">
        Real, per-organizer — how often this organizer is paid, and whether a holdback is reserved
        against refunds and disputes before the rest transfers.
      </p>

      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-[220px] flex-1">
          <Label htmlFor="payout-cadence" className={LABEL}>
            Payout cadence
          </Label>
          <Select value={cadence} onValueChange={setCadence}>
            <SelectTrigger id="payout-cadence" className={`${FIELD} w-full`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-[220px] flex-1">
          <Label htmlFor="holdback" className={LABEL}>
            Holdback %
          </Label>
          <Input
            id="holdback"
            inputMode="decimal"
            placeholder="None"
            value={holdback}
            aria-invalid={invalid || undefined}
            onChange={(event) => {
              setHoldback(event.target.value);
            }}
            className={FIELD}
          />
        </div>

        <Button
          type="button"
          disabled={isPending || invalid || !dirty}
          onClick={save}
          className="bg-hunter-deep text-paper hover:bg-gold hover:text-hunter-deep h-auto rounded-[10px] px-6 py-3 text-sm font-bold disabled:opacity-45"
        >
          {isPending && <Loader2Icon className="size-4 animate-spin" aria-hidden />}
          {isPending ? 'Saving…' : 'Save'}
        </Button>
      </div>

      {invalid && (
        <p role="alert" className="text-alert-fg mt-3 text-[13px]">
          Holdback must be a number between 0 and 100.
        </p>
      )}
    </section>
  );
}
