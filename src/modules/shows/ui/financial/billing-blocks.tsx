'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/shadcn/dialog';
import { Card } from '@/shared/ui/organizer/card';
import { IconX } from '@/shared/ui/organizer/icons';
import { ModalEyebrow, modalBodyClass, modalContentClass } from '@/shared/ui/organizer/modal-kit';
import { cn } from '@/shared/lib/utils';
import { formatMoneyExact } from '@/shared/lib/format/currency';
import { formatDateShort } from '@/shared/lib/format/date';
import { BILLING_SECTIONS, STRIPE_PAYOUT_DECISIONS } from '../../constants';
import type { OrgBilling, StripeConnectStatus } from '../../data/queries';
import { useStartStripeConnect } from '@/modules/organizations/hooks/use-stripe-connect';
import { SM_CARD_PAD, SM_SECTION_HEAD, SM_NOTE, SM_GHOST_BTN } from '../show-manager/tokens';

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

      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
        {BILLING_SECTIONS.map((item) => (
          <Card key={item.kind} className={SM_CARD_PAD}>
            <div className="mb-1.5 text-[22px]" aria-hidden>
              {item.icon}
            </div>
            <div className="mb-1 text-[15px] font-semibold text-forest">{item.title}</div>
            <p className="min-h-[36px] text-[12.5px] leading-[1.55] text-[#6E7C76]">{item.sub}</p>
            <button
              type="button"
              className={cn(SM_GHOST_BTN, 'mt-2')}
              onClick={() => {
                setOpen(item.kind);
              }}
            >
              View {item.title.toLowerCase()} →
            </button>
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

/**
 * Charges, Payouts or Deposits in full.
 *
 * Charges and Deposits are the same paid orders framed two ways — what came in,
 * and what has landed in Field & Arena's account before the payout goes out —
 * which is exactly how the legacy endpoint served them.
 */
function BillingDetailDialog({
  kind,
  title,
  sub,
  billing,
  onClose,
}: {
  kind: BillingKind;
  title: string;
  sub: string;
  billing: OrgBilling;
  onClose: () => void;
}) {
  const total = billing.charges.reduce((sum, r) => sum + r.amount, 0);

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent
        className={cn(modalContentClass, 'flex max-h-[85vh] flex-col sm:max-w-[620px]')}
        showCloseButton={false}
      >
        <DialogHeader className={cn(modalBodyClass, 'flex-none gap-1.5 pb-0')}>
          <ModalEyebrow>Financial</ModalEyebrow>
          <DialogTitle className="font-serif text-2xl font-semibold text-[#0D2C23]">
            {title}
          </DialogTitle>
          <DialogDescription>{sub}</DialogDescription>
          <DialogClose className="absolute top-4 right-4 flex size-7 items-center justify-center rounded-full bg-[#E6F1EA] text-[#1A5B3C] transition-colors hover:bg-[#D5E8DC]">
            <IconX size={13} />
            <span className="sr-only">Close</span>
          </DialogClose>
        </DialogHeader>

        <div className={cn(modalBodyClass, 'min-h-0 flex-1 overflow-y-auto')}>
          {kind === 'payouts' ? (
            billing.payouts.length === 0 ? (
              <p className="text-[12.5px] leading-[1.55] text-[#6E7C76]">
                No payouts yet. Transfers appear here once the organization has completed Stripe
                Connect onboarding and the first show has ended.
              </p>
            ) : (
              <table className="w-full border-collapse text-[12.5px]">
                <thead>
                  <tr className="border-b border-[#D9E1DD] text-left">
                    <th className="py-1.5 font-semibold">Date</th>
                    <th className="py-1.5 font-semibold">Status</th>
                    <th className="py-1.5 text-right font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {billing.payouts.map((row) => (
                    <tr key={row.id} className="border-b border-[#EDF1EF] last:border-b-0">
                      <td className="py-1.5">{row.date ? formatDateShort(row.date) : '—'}</td>
                      <td className="py-1.5">{row.status}</td>
                      <td className="py-1.5 text-right">{formatMoneyExact(row.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : billing.charges.length === 0 ? (
            <p className="text-[12.5px] leading-[1.55] text-[#6E7C76]">
              No {title.toLowerCase()} yet.
            </p>
          ) : (
            <>
              <table className="w-full border-collapse text-[12.5px]">
                <thead>
                  <tr className="border-b border-[#D9E1DD] text-left">
                    <th className="py-1.5 font-semibold">Date</th>
                    <th className="py-1.5 font-semibold">Show</th>
                    <th className="py-1.5 text-right font-semibold">Amount</th>
                    <th className="py-1.5 text-right font-semibold">Platform fee</th>
                  </tr>
                </thead>
                <tbody>
                  {billing.charges.map((row) => (
                    <tr key={row.id} className="border-b border-[#EDF1EF] last:border-b-0">
                      <td className="py-1.5">{formatDateShort(row.date)}</td>
                      <td className="py-1.5">{row.show}</td>
                      <td className="py-1.5 text-right">{formatMoneyExact(row.amount)}</td>
                      <td className="py-1.5 text-right text-[#7A8781]">
                        {formatMoneyExact(row.fee)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-2 text-right text-[13px] font-bold">
                Total: {formatMoneyExact(total)}
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * "✓ Payout architecture — confirmed".
 *
 * Open by default, matching the legacy's own `billingNotesOpen = true` and the
 * reason it gives: these are load-bearing decisions, not settled reference.
 */
function PayoutArchitectureCard() {
  const [open, setOpen] = useState(true);

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

/** The pill's wording and colour per state, from stripeConnectStatusPill(). */
const STATUS_PILL: Record<
  StripeConnectStatus['status'],
  { label: string; className: string }
> = {
  not_started: { label: 'Not connected', className: 'bg-[#FDF0EE] text-[#B4432F]' },
  onboarding: { label: 'Onboarding', className: 'bg-[#FDF6E3] text-[#8A6D1F]' },
  restricted: { label: 'Action needed', className: 'bg-[#FDF0EE] text-[#B4432F]' },
  active: { label: 'Active', className: 'bg-[#E3F0E5] text-[#2E7048]' },
  error: { label: 'Could not check', className: 'bg-[#F1F4F3] text-[#6E7C76]' },
};

/**
 * Stripe Connect onboarding and its live status.
 *
 * The button label follows what is actually left to do — start, finish, or
 * manage — because "Connect with Stripe" on a half-onboarded account reads as
 * though the earlier attempt was lost.
 */
function StripeConnectionCard({ connect }: { connect: StripeConnectStatus }) {
  const start = useStartStripeConnect();
  const pill = STATUS_PILL[connect.status];

  const label = !connect.connected
    ? '🔗 Connect with Stripe'
    : connect.status === 'active'
      ? 'Manage Stripe account →'
      : 'Finish Stripe onboarding →';

  return (
    <Card className={SM_CARD_PAD}>
      <h2 className={SM_SECTION_HEAD}>Stripe connection</h2>
      <p className={SM_NOTE}>
        Real Stripe Connect Express account
        {connect.accountId && (
          <>
            {' — '}
            <code className="text-[12px]">{connect.accountId}</code>
          </>
        )}
        .
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          // Onboarding cannot complete without a secret key, so an environment
          // without one says so rather than opening a flow that dead-ends.
          disabled={!connect.configured || start.isPending}
          title={connect.configured ? undefined : 'Stripe keys are not configured yet'}
          className={cn(SM_GHOST_BTN, !connect.configured && 'cursor-not-allowed opacity-50')}
          onClick={() => {
            start.mutate();
          }}
        >
          {start.isPending ? 'Opening Stripe…' : label}
        </button>
        <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-bold', pill.className)}>
          {pill.label}
        </span>
      </div>

      {connect.requirementsDue.length > 0 && (
        <p className="mt-2 text-[12.5px] leading-[1.55] text-[#B4432F]">
          Stripe still needs: {connect.requirementsDue.join(', ')}
        </p>
      )}
    </Card>
  );
}
