'use client';

import { useState } from 'react';
import { Button } from '@/shared/ui/shadcn/button';
import { Card } from '@/shared/ui/organizer/card';
import { cn } from '@/shared/lib/utils';
import { BILLING_SECTIONS } from '@/modules/shows/constants';
import type { OrgBilling, StripeConnectStatus } from '@/modules/shows/types';
import { SM_CARD_PAD, SM_GHOST_BTN } from '@/modules/shows/ui/show-manager/tokens';
import { PayoutArchitectureCard } from '@/modules/shows/ui/financial/payout-architecture-card';
import { StripeConnectionCard } from '@/modules/shows/ui/financial/stripe-connection-card';
import { BillingDetailDialog } from '@/modules/shows/ui/financial/billing-detail-dialog';

type BillingKind = (typeof BILLING_SECTIONS)[number]['kind'];

// Redesign icon tiles in place of the old emoji — card, dollar, bank.
const KIND_ICON: Record<BillingKind, { d: string; bg: string; fg: string }> = {
  charges: { d: 'M3 7h18v10H3zM3 11h18M7 15h4', bg: 'var(--fa-sky-tint)', fg: 'var(--fa-sky)' },
  payouts: {
    d: 'M12 3v18M17 7a4 4 0 00-4-2h-2a3 3 0 000 6h2a3 3 0 010 6h-2a4 4 0 01-4-2',
    bg: 'var(--fa-emerald-tint)',
    fg: 'var(--fa-emerald)',
  },
  deposits: {
    d: 'M3 10l9-6 9 6M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18',
    bg: 'var(--fa-violet-tint)',
    fg: 'var(--fa-violet)',
  },
};

export function BillingBlocks({
  connect,
  billing,
}: {
  connect: StripeConnectStatus;
  billing: OrgBilling;
}) {
  const [open, setOpen] = useState<BillingKind | null>(null);
  const section = BILLING_SECTIONS.find((s) => s.kind === open);

  return (
    <>
      <PayoutArchitectureCard />
      <StripeConnectionCard connect={connect} />

      <p className="text-[12.5px] leading-[1.55] text-[#8A94A3]">
        <b>Payouts</b> is the number that matters most to you — it&apos;s what actually lands in
        your own bank account, after the platform fee. Charges is money riders/vendors paid in;
        Deposits is what&apos;s landed in Field &amp; Arena&apos;s account before your payout goes
        out.
      </p>

      <div className="grid [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))] gap-4">
        {BILLING_SECTIONS.map((item) => (
          <Card key={item.kind} className={SM_CARD_PAD}>
            <div
              className="mb-3 grid size-[34px] place-items-center rounded-[9px]"
              style={{ background: KIND_ICON[item.kind].bg, color: KIND_ICON[item.kind].fg }}
              aria-hidden
            >
              <svg
                viewBox="0 0 24 24"
                width={18}
                height={18}
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={KIND_ICON[item.kind].d} />
              </svg>
            </div>
            <div className="mb-1 text-[15px] font-semibold text-[#101828]">{item.title}</div>
            <p className="min-h-[36px] text-[12.5px] leading-[1.55] text-[#8A94A3]">{item.sub}</p>
            <Button
              type="button"
              variant="ghost"
              className={cn(SM_GHOST_BTN, 'mt-2 h-auto hover:bg-transparent')}
              onClick={() => {
                setOpen(item.kind);
              }}
            >
              View {item.title.toLowerCase()} →
            </Button>
          </Card>
        ))}
      </div>

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
    </>
  );
}
