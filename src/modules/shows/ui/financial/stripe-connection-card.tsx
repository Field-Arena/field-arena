'use client';

import { FA_BTN, FA_MUTED, FaCard, Pill, type PillTone } from '@/shared/ui/organizer/fa-page';
import { useStartStripeConnect } from '@/modules/organizations/hooks/use-stripe-connect';
import type { StripeConnectStatus } from '@/modules/shows/data/queries';

const STATUS_PILL: Record<StripeConnectStatus['status'], { label: string; tone: PillTone }> = {
  not_started: { label: 'Not connected', tone: 'red' },
  onboarding: { label: 'Onboarding', tone: 'yellow' },
  restricted: { label: 'Action needed', tone: 'red' },
  active: { label: 'Active', tone: 'green' },
  error: { label: 'Could not check', tone: 'grey' },
};

export function StripeConnectionCard({ connect }: { connect: StripeConnectStatus }) {
  const start = useStartStripeConnect();
  const pill = STATUS_PILL[connect.status];
  const active = connect.status === 'active';

  const label = !connect.connected
    ? '🔗 Connect with Stripe'
    : active
      ? 'Manage Stripe →'
      : 'Finish Stripe onboarding →';

  return (
    <FaCard
      tone={active ? 'live' : connect.status === 'restricted' ? 'warn' : 'default'}
      className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2"
    >
      <Pill tone={pill.tone}>Stripe · {pill.label}</Pill>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-bold text-[#0D2C23]">
          {active ? 'Payouts are on' : 'Stripe connection'}
          {connect.accountId && (
            <>
              {' — '}
              <code className="text-[12.5px] font-semibold">{connect.accountId}</code>
            </>
          )}
        </p>
        <p className={FA_MUTED}>
          Riders and vendors pay Field &amp; Arena; your share is paid out to this Stripe Connect
          Express account.
        </p>
        {connect.requirementsDue.length > 0 && (
          <p className="mt-1 text-[12.5px] font-semibold text-[#B4432F]">
            Stripe still needs: {connect.requirementsDue.join(', ')}
          </p>
        )}
      </div>
      <button
        type="button"
        disabled={!connect.configured || start.isPending}
        title={connect.configured ? undefined : 'Stripe keys are not configured yet'}
        className={FA_BTN}
        onClick={() => {
          start.mutate();
        }}
      >
        {start.isPending ? 'Opening Stripe…' : label}
      </button>
    </FaCard>
  );
}
