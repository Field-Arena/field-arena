'use client';

import { useState } from 'react';
import { Card } from '@/shared/ui/organizer/card';
import { cn } from '@/shared/lib/utils';
import type { MasterScheduleData } from '../../data/setup-queries';
import { useUpdateScheduleRules } from '../../hooks/use-schedule-mutations';
import { SM_CARD_PAD, SM_ROW_INPUT } from '../show-manager/tokens';

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

  return (
    <Card className={cn(SM_CARD_PAD, 'mb-4')}>
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
        }}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2.5 text-left"
      >
        <span className={TITLE}>Schedule rules in effect</span>
        <span className="text-[12px] whitespace-nowrap text-[#7A8781]">
          {open ? '▾ Hide details' : '▸ Show details'}
        </span>
      </button>

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
              <label className="flex items-center gap-2 text-[12.5px] text-[#6E7C76]">
                Same horse
                <input
                  type="number"
                  min={0}
                  max={240}
                  defaultValue={rules.hardRuleSameHorseMin}
                  className={cn(SM_ROW_INPUT, 'w-[76px] text-right')}
                  onBlur={(e) => {
                    save.mutate({
                      showId: data.showId,
                      hardRuleSameHorseMin: Number(e.target.value),
                    });
                  }}
                />
                min
              </label>
              <label className="flex items-center gap-2 text-[12.5px] text-[#6E7C76]">
                Different horse
                <input
                  type="number"
                  min={0}
                  max={240}
                  defaultValue={rules.hardRuleDiffHorseMin}
                  className={cn(SM_ROW_INPUT, 'w-[76px] text-right')}
                  onBlur={(e) => {
                    save.mutate({
                      showId: data.showId,
                      hardRuleDiffHorseMin: Number(e.target.value),
                    });
                  }}
                />
                min
              </label>
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

/** "Awards grouping" — By Test or By Division, flipped from the schedule. */
export function AwardsGroupingToggle({ data }: { data: MasterScheduleData }) {
  const save = useUpdateScheduleRules();
  const byDivision = data.rules.awardsByDivision;

  const base =
    'px-3 py-1.5 text-[12.5px] font-semibold transition-colors first:rounded-l-[9px] last:rounded-r-[9px]';

  return (
    <div className="inline-flex overflow-hidden rounded-[9px] border border-[#D9E1DD]">
      <button
        type="button"
        className={cn(base, byDivision ? 'bg-white text-forest' : 'bg-forest text-white')}
        onClick={() => {
          if (byDivision) save.mutate({ showId: data.showId, awardsByDivision: false });
        }}
      >
        By Test
      </button>
      <button
        type="button"
        title="Splits ribbons per division within a class — e.g. Young Rider, Adult Amateur, Open each place separately."
        className={cn(base, byDivision ? 'bg-forest text-white' : 'bg-white text-forest')}
        onClick={() => {
          if (!byDivision) save.mutate({ showId: data.showId, awardsByDivision: true });
        }}
      >
        By Division
      </button>
    </div>
  );
}

/** The rider-name colour legend. */
export function ScheduleKeyCard() {
  return (
    <Card className={cn(SM_CARD_PAD, 'mb-4')}>
      <div className="mb-2 text-[13px] font-bold text-forest">Key</div>
      <div className="flex flex-wrap gap-5 text-[13px]">
        <span>
          <span className="font-bold text-[#8A6D14]">Rider name</span> — riding multiple events
          today
        </span>
        <span>
          <span className="font-bold text-[#2F6FB0] underline decoration-dotted">Rider name</span> —
          riding two or more different horses today
        </span>
        <span>
          <span className="font-bold text-[#8A6D14] underline decoration-dotted">Rider name</span> —
          both
        </span>
      </div>
    </Card>
  );
}
