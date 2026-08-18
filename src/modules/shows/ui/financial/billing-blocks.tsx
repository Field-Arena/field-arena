'use client';

import { useState } from 'react';
import { Button } from '@/shared/ui/shadcn/button';
import { Card } from '@/shared/ui/organizer/card';
import { cn } from '@/shared/lib/utils';
import { BILLING_SECTIONS } from '@/modules/shows/constants';
import type { OrgBilling, StripeConnectStatus } from '@/modules/shows/data/queries';
import { SM_CARD_PAD, SM_GHOST_BTN } from '@/modules/shows/ui/show-manager/tokens';
import { PayoutArchitectureCard } from '@/modules/shows/ui/financial/payout-architecture-card';
import { StripeConnectionCard } from '@/modules/shows/ui/financial/stripe-connection-card';
import { BillingDetailDialog } from '@/modules/shows/ui/financial/billing-detail-dialog';

type BillingKind = (typeof BILLING_SECTIONS)[number]['kind'];

/**
 * The three blocks above the P&L, ported from renderBilling: the confirmed
 * payout architecture, the Stripe connection, and the Charges / Payouts /
 * Deposits cards.
 */
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

      <p className="text-[12.5px] leading-[1.55] text-[#6E7C76]">
        <b>Payouts</b> is the number that matters most to you — it&apos;s what actually lands in
        your own bank account, after the platform fee. Charges is money riders/vendors paid in;
        Deposits is what&apos;s landed in Field &amp; Arena&apos;s account before your payout goes
        out.
      </p>

      <div className="grid [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))] gap-4">
        {BILLING_SECTIONS.map((item) => (
          <Card key={item.kind} className={SM_CARD_PAD}>
            <div className="mb-1.5 text-[22px]" aria-hidden>
              {item.icon}
            </div>
            <div className="text-forest mb-1 text-[15px] font-semibold">{item.title}</div>
            <p className="min-h-[36px] text-[12.5px] leading-[1.55] text-[#6E7C76]">{item.sub}</p>
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
