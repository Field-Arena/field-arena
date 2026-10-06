'use client';

import { Button } from '@/shared/ui/shadcn/button';
import { Card } from '@/shared/ui/organizer/card';
import { cn } from '@/shared/lib/utils';
import { useStartStripeConnect } from '@/modules/organizations/public';
import type { StripeConnectStatus } from '@/modules/shows/types';
import {
  SM_CARD_PAD,
  SM_SECTION_HEAD,
  SM_NOTE,
  SM_GHOST_BTN,
} from '@/modules/shows/ui/show-manager/tokens';

const STATUS_PILL: Record<StripeConnectStatus['status'], { label: string; className: string }> = {
  not_started: { label: 'Not connected', className: 'bg-[#FDF0EE] text-[#B42318]' },
  onboarding: { label: 'Onboarding', className: 'bg-[#FDF6E3] text-[#8A6D1F]' },
  restricted: { label: 'Action needed', className: 'bg-[#FDF0EE] text-[#B42318]' },
  active: { label: 'Active', className: 'bg-[#E3F0E5] text-[#15794F]' },
  error: { label: 'Could not check', className: 'bg-[#EEF1F4] text-[#8A94A3]' },
};

export function StripeConnectionCard({ connect }: { connect: StripeConnectStatus }) {
  const start = useStartStripeConnect();
  const pill = STATUS_PILL[connect.status];

  const label = !connect.connected
    ? 'Connect with Stripe'
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
        <p className="mt-2 text-[12.5px] leading-[1.55] text-[#B42318]">
          Stripe still needs: {connect.requirementsDue.join(', ')}
        </p>
      )}
    </Card>
  );
}
