'use client';

import { useState } from 'react';
import { Card } from '@/shared/ui/organizer/card';
import { Button } from '@/shared/ui/shadcn/button';
import { Input } from '@/shared/ui/shadcn/input';
import { cn } from '@/shared/lib/utils';
import type { MasterScheduleData } from '@/modules/shows/data/setup-queries';
import { useUpdateScheduleRules } from '@/modules/shows/hooks/use-schedule-mutations';
import { SM_CARD_PAD, SM_ROW_INPUT } from '@/modules/shows/ui/show-manager/tokens';

const TITLE = 'font-[family-name:var(--font-nr)] text-[17px] font-semibold text-forest';

/**
 * "Schedule rules in effect" — the double-booking rule, stated and editable.
 *
 * Collapsed by default to one summary line, because the rule is usually just
 * being confirmed rather than changed. It lives here rather than in Setup: an
 * organizer decides how strict to be while looking at the schedule the rule
 * produced.
 */
export function ScheduleRulesCard({ data }: { data: MasterScheduleData }) {
  const [open, setOpen] = useState(false);
  const { rules } = data;
  const save = useUpdateScheduleRules();

  const summary = rules.hardRuleEnabled
    ? `${String(rules.hardRuleSameHorseMin)} min same horse / ${String(rules.hardRuleDiffHorseMin)} min different horse — On`
    : 'Off — not enforced';

  const durationFields = [
    {
      key: 'hardRuleSameHorseMin' as const,
      label: 'Same horse',
      value: rules.hardRuleSameHorseMin,
    },
    {
      key: 'hardRuleDiffHorseMin' as const,
      label: 'Different horse',
      value: rules.hardRuleDiffHorseMin,
    },
  ];

  return (
    <Card className={cn(SM_CARD_PAD, 'mb-4')}>
      <Button
        type="button"
        variant="ghost"
        onClick={() => {
          setOpen((v) => !v);
        }}
        aria-expanded={open}
        className="h-auto flex w-full items-center justify-between gap-2.5 px-0 py-0 text-left hover:bg-transparent"
      >
        <span className={TITLE}>Schedule rules in effect</span>
        <span className="text-[12px] whitespace-nowrap text-[#7A8781]">
          {open ? '▾ Hide details' : '▸ Show details'}
        </span>
      </Button>

      {!open ? (
        <p className="mt-1.5 text-[12.5px] text-[#7A8781]">Double-booking rule: {summary}</p>
      ) : (
        <div className="mt-3 flex flex-col gap-3">
          <label className="flex flex-wrap items-center gap-2 text-[13px] font-semibold">
            Double-booking rule
            <select
              className={cn(SM_ROW_INPUT, 'w-auto')}
              value={rules.hardRuleEnabled ? 'yes' : 'no'}
              onChange={(e) => {
                save.mutate({ showId: data.showId, hardRuleEnabled: e.target.value === 'yes' });
              }}
            >
              <option value="yes">On — never double-book a rider</option>
              <option value="no">Off — not enforced</option>
            </select>
          </label>

          {rules.hardRuleEnabled && (
            <div className="flex flex-wrap items-center gap-4">
              {durationFields.map((f) => (
                <label key={f.key} className="flex items-center gap-2 text-[12.5px] text-[#6E7C76]">
                  {f.label}
                  <Input
                    type="number"
                    min={0}
                    max={240}
                    defaultValue={f.value}
                    className={cn('h-auto', SM_ROW_INPUT, 'w-[76px] text-right')}
                    onBlur={(e) => {
                      save.mutate({
                        showId: data.showId,
                        [f.key]: Number(e.target.value),
                      });
                    }}
                  />
                  min
                </label>
              ))}
            </div>
          )}

          <p className="text-[12px] leading-[1.55] text-[#98A29D]">
            The rule is never violated. When a gap cannot be found by reordering a ring, the
            schedule waits — the class runs longer rather than a rider being double-booked.
          </p>
        </div>
      )}
    </Card>
  );
}
