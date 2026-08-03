'use client';

import { useState } from 'react';
import { Card } from '@/shared/ui/organizer/card';
import { cn } from '@/shared/lib/utils';
import { BILLING_SECTIONS, STRIPE_PAYOUT_DECISIONS } from '../../constants';
import { SM_CARD_PAD, SM_SECTION_HEAD, SM_NOTE, SM_GHOST_BTN } from '../show-manager/tokens';

/**
 * The three blocks above the P&L, ported from renderBilling: the confirmed
 * payout architecture, the Stripe connection, and the Charges / Payouts /
 * Deposits cards.
 */
export function BillingBlocks({ stripeAccountId }: { stripeAccountId: string | null }) {
  return (
    <>
      <PayoutArchitectureCard />
      <StripeConnectionCard accountId={stripeAccountId} />

      <p className="text-[12.5px] leading-[1.55] text-[#6E7C76]">
        <b>Payouts</b> is the number that matters most to you — it&apos;s what actually lands in
        your own bank account, after the platform fee. Charges is money riders/vendors paid in;
        Deposits is what&apos;s landed in Field &amp; Arena&apos;s account before your payout goes
        out.
      </p>

      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
        {BILLING_SECTIONS.map((section) => (
          <Card key={section.kind} className={SM_CARD_PAD}>
            <div className="mb-1.5 text-[22px]" aria-hidden>
              {section.icon}
            </div>
            <div className="mb-1 text-[15px] font-semibold text-forest">{section.title}</div>
            <p className="min-h-[36px] text-[12.5px] leading-[1.55] text-[#6E7C76]">
              {section.sub}
            </p>
            {/* Disabled up front rather than a button that alerts "not built
                yet" on click — the legacy comment calls that a fake door. Real
                reporting needs a Stripe-connected organization. */}
            <button
              type="button"
              disabled
              title="Real reporting needs a Stripe-connected organization"
              className={cn(SM_GHOST_BTN, 'mt-2 cursor-not-allowed opacity-50')}
            >
              View {section.title.toLowerCase()} →
            </button>
          </Card>
        ))}
      </div>
    </>
  );
}

/** "✓ Payout architecture — confirmed", collapsed by default like the legacy card. */
function PayoutArchitectureCard() {
  const [open, setOpen] = useState(false);

  return (
    <Card className={cn(SM_CARD_PAD, 'border-l-4 border-l-gold')}>
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
        }}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2.5 text-left"
      >
        <span className="font-[family-name:var(--font-nr)] text-[17px] font-semibold text-forest">
          ✓ Payout architecture — confirmed
        </span>
        <span className="text-[11px] whitespace-nowrap text-[#7A8781]">
          {open ? 'Hide ▲' : 'Show ▼'}
        </span>
      </button>

      {open && (
        <>
          <p className={cn(SM_NOTE, 'mt-2.5')}>
            Field &amp; Arena is merchant of record — <b>Separate Charges and Transfers</b>: rider
            and vendor payments land in Field &amp; Arena&apos;s Stripe balance first, and
            organizers are paid out via a separate transfer afterward.
          </p>
          <ol className="mt-2.5 list-decimal pl-5 text-[13.5px] leading-[1.55] text-ink-deep">
            {STRIPE_PAYOUT_DECISIONS.map((decision) => (
              <li key={decision} className="mb-2">
                {decision.startsWith('Still open') ? (
                  <>
                    <b>Still open</b>
                    {decision.slice('Still open'.length)}
                  </>
                ) : (
                  decision
                )}
              </li>
            ))}
          </ol>
        </>
      )}
    </Card>
  );
}

function StripeConnectionCard({ accountId }: { accountId: string | null }) {
  const connected = Boolean(accountId);

  return (
    <Card className={SM_CARD_PAD}>
      <h2 className={SM_SECTION_HEAD}>Stripe connection</h2>
      <p className={SM_NOTE}>
        Real Stripe Connect Express account
        {connected && (
          <>
            {' — '}
            <code className="text-[12px]">{accountId}</code>
          </>
        )}
        .
      </p>

      <div className="flex flex-wrap items-center gap-3">
        {/* Onboarding needs STRIPE_SECRET_KEY, which is not set — so this states
            that rather than opening a flow that cannot complete. */}
        <button
          type="button"
          disabled
          title="Stripe keys are not configured yet"
          className={cn(SM_GHOST_BTN, 'cursor-not-allowed opacity-50')}
        >
          {connected ? 'Manage Stripe account →' : '🔗 Connect with Stripe'}
        </button>
        <span
          className={cn(
            'rounded-full px-2.5 py-1 text-[11px] font-bold',
            connected ? 'bg-[#E3F0E5] text-[#2E7048]' : 'bg-[#FDF0EE] text-[#B4432F]'
          )}
        >
          {connected ? 'Connected' : 'Not connected'}
        </span>
      </div>
    </Card>
  );
}
