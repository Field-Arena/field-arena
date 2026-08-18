'use client';

import { Button } from '@/shared/ui/shadcn/button';
import { Card } from '@/shared/ui/organizer/card';
import { cn } from '@/shared/lib/utils';
import { useStartStripeConnect } from '@/modules/organizations/hooks/use-stripe-connect';
import type { StripeConnectStatus } from '@/modules/shows/data/queries';
import {
  SM_CARD_PAD,
  SM_SECTION_HEAD,
  SM_NOTE,
  SM_GHOST_BTN,
} from '@/modules/shows/ui/show-manager/tokens';

/** The pill's wording and colour per state, from stripeConnectStatusPill(). */
const STATUS_PILL: Record<StripeConnectStatus['status'], { label: string; className: string }> = {
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
export function StripeConnectionCard({ connect }: { connect: StripeConnectStatus }) {
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
        <Button
          type="button"
          variant="ghost"
          // Onboarding cannot complete without a secret key, so an environment
          // without one says so rather than opening a flow that dead-ends.
          disabled={!connect.configured || start.isPending}
          title={connect.configured ? undefined : 'Stripe keys are not configured yet'}
          className={cn(
            SM_GHOST_BTN,
            'h-auto hover:bg-transparent disabled:opacity-100',
            !connect.configured && 'cursor-not-allowed opacity-50',
          )}
          onClick={() => {
            start.mutate();
          }}
        >
          {start.isPending ? 'Opening Stripe…' : label}
        </Button>
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
