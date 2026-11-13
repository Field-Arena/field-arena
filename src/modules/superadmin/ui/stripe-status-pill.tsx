import { cn } from '@/shared/lib/utils';
import type { StripeConnectStatus } from '@/modules/superadmin/types';

/* Legacy stripeStatusPill(). The five states matter operationally: an account
 * that submitted its details but still can't charge is `restricted` and needs
 * chasing, and an account mid-onboarding hasn't finished verification — both
 * have an id on file, so a "connected / not connected" boolean reports them as
 * healthy. `error` means Stripe itself was unreachable, not that anything is
 * wrong with the account. */
const STATUS: Record<StripeConnectStatus, { label: string; bg: string; fg: string; dot: string }> =
  {
    active: { label: 'Active', bg: '#EAF5EF', fg: '#15794F', dot: '#146A47' },
    onboarding: { label: 'Onboarding', bg: '#FDF2E3', fg: '#B45309', dot: '#146A47' },
    restricted: {
      label: 'Restricted — info needed',
      bg: '#FEF3F2',
      fg: '#B42318',
      dot: '#B42318',
    },
    not_connected: { label: 'Not connected', bg: '#FDF2E3', fg: '#B45309', dot: '#146A47' },
    error: { label: 'Could not load Stripe status', bg: '#FEF3F2', fg: '#B42318', dot: '#B42318' },
  };

/** The remediation line legacy showed under a non-active account. */
export const STATUS_GUIDANCE: Record<StripeConnectStatus, string> = {
  active: '',
  not_connected:
    "No Stripe Connect account linked yet — this organizer can't receive payouts until one is connected.",
  onboarding:
    'Onboarding incomplete — bank account and identity verification are still needed before payouts can begin.',
  restricted:
    'Payouts are paused — Stripe needs updated business details before funds can move again.',
  error: 'Could not reach Stripe for this account — try again shortly.',
};

export function StripeStatusPill({
  status,
  className,
}: {
  status: StripeConnectStatus;
  className?: string;
}) {
  const meta = STATUS[status];
  return (
    <span
      className={cn(
        'inline-flex min-h-[22px] w-fit max-w-full items-center gap-[6px] rounded-full px-2.5 py-0.5 text-[10.5px] leading-tight font-bold',
        className,
      )}
      style={{ background: meta.bg, color: meta.fg }}
    >
      <span aria-hidden className="size-[5px] rounded-full" style={{ background: meta.dot }} />
      {meta.label}
    </span>
  );
}
