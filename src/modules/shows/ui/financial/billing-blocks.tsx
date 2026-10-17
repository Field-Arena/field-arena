'use client';

import { useState } from 'react';
import { formatMoneyExact } from '@/shared/lib/format/currency';
import { FA_BTN_SMALL, FA_MUTED, FaCard } from '@/shared/ui/organizer/fa-page';
import { BILLING_SECTIONS } from '@/modules/shows/constants';
import type { OrgBilling } from '@/modules/shows/data/queries';
import { BillingDetailDialog } from '@/modules/shows/ui/financial/billing-detail-dialog';

type BillingKind = (typeof BILLING_SECTIONS)[number]['kind'];

const plural = (n: number, word: string) => `${String(n)} ${word}${n === 1 ? '' : 's'}`;

export function BillingBlocks({ billing }: { billing: OrgBilling }) {
  const [open, setOpen] = useState<BillingKind | null>(null);
  const section = BILLING_SECTIONS.find((s) => s.kind === open);
  const chargesTotal = billing.charges.reduce((sum, r) => sum + r.amount, 0);

  const summary: Record<BillingKind, string> = {
    charges: `${plural(billing.charges.length, 'charge')} · all shows`,
    payouts: `${plural(billing.payouts.length, 'payout')} sent`,
    deposits: formatMoneyExact(chargesTotal),
  };

  return (
    <div className="flex flex-col gap-3">
      {BILLING_SECTIONS.map((item) => (
        <FaCard key={item.kind} className="p-[14px_16px]">
          <p className="text-[16px] font-bold text-[#0D2C23]">
            <span aria-hidden className="mr-1.5">
              {item.icon}
            </span>
            {item.title}
          </p>
          <p className={FA_MUTED}>{summary[item.kind]}</p>
          <p className="mt-1 text-[12.5px] leading-[1.5] text-[#5A6B63]">{item.sub}</p>
          <button
            type="button"
            className={`${FA_BTN_SMALL} mt-2`}
            onClick={() => {
              setOpen(item.kind);
            }}
          >
            View {item.title.toLowerCase()} →
          </button>
        </FaCard>
      ))}

      <p className="text-[12.5px] leading-[1.55] text-[#5A6B63]">
        <b>Payouts</b> is the number that matters most to you — it&apos;s what actually lands in
        your own bank account, after the platform fee. Charges is money riders/vendors paid in;
        Deposits is what&apos;s landed in Field &amp; Arena&apos;s account before your payout goes
        out.
      </p>

      {section && (
        <BillingDetailDialog
          kind={section.kind}
          title={section.title}
          sub={section.sub}
          billing={billing}
          onClose={() => {
            setOpen(null);
          }}
        />
      )}
    </div>
  );
}
