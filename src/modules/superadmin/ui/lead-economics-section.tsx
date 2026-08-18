'use client';

import { useState } from 'react';
import { Button } from '@/shared/ui/shadcn/button';
import type { LeadRow } from '@/modules/superadmin/types';
import { parseMoneyField } from '@/modules/superadmin/utils/parse-money-field';
import { useUpdateLead } from '@/modules/superadmin/hooks/use-lead-mutations';
import { SECTION, H2, GRID, SAVE } from '@/modules/superadmin/ui/lead-detail-styles';
import { Field } from '@/modules/superadmin/ui/lead-detail-field';

export function EconomicsSection({ lead }: { lead: LeadRow }) {
  const [cost, setCost] = useState(lead.cost_per_event != null ? String(lead.cost_per_event) : '');
  const [rev, setRev] = useState(
    lead.avg_revenue_per_show != null ? String(lead.avg_revenue_per_show) : ''
  );
  const update = useUpdateLead({ successMessage: 'Economics saved' });

  const fields: { key: string; label: string; value: string; onChange: (v: string) => void; placeholder: string }[] = [
    { key: 'cost', label: 'Cost per event', value: cost, onChange: setCost, placeholder: '$0' },
    { key: 'rev', label: 'Average revenue per show', value: rev, onChange: setRev, placeholder: '$0' },
  ];

  return (
    <section className={SECTION}>
      <h2 className={`${H2} mb-1.5`}>Deal economics</h2>
      <p className="mb-5 text-[13px] leading-[1.55] text-fa-muted-2">
        What this account is projected to cost us to run and what it&apos;s worth — fill in after the
        demo.
      </p>
      <div className={GRID}>
        {fields.map((f) => (
          <Field key={f.key} label={f.label} value={f.value} onChange={f.onChange} placeholder={f.placeholder} />
        ))}
      </div>
      <div className="mt-[22px] border-t border-[#EEF2EF] pt-5">
        <Button
          type="button"
          variant="ghost"
          disabled={update.isPending}
          className={`h-auto hover:bg-transparent ${SAVE}`}
          onClick={() => {
            update.mutate({
              id: lead.id,
              costPerEvent: parseMoneyField(cost),
              avgRevenuePerShow: parseMoneyField(rev),
            });
          }}
        >
          {update.isPending ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </section>
  );
}
