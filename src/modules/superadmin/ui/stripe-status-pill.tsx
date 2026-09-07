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
    active: { label: 'Active', bg: '#E4F1E8', fg: '#2E7048', dot: '#3E8E5A' },
    onboarding: { label: 'Onboarding', bg: '#F6EAC8', fg: '#8A6D14', dot: '#C9A227' },
    restricted: {
      label: 'Restricted — info needed',
      bg: '#FCF1EF',
      fg: '#8E3627',
      dot: '#B4432F',
    },
    not_connected: { label: 'Not connected', bg: '#F6EAC8', fg: '#8A6D14', dot: '#C9A227' },
    error: { label: 'Could not load Stripe status', bg: '#FCF1EF', fg: '#8E3627', dot: '#B4432F' },
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
        'inline-flex h-[22px] w-fit flex-none items-center gap-[6px] rounded-full px-2.5 text-[10.5px] font-bold whitespace-nowrap',
        className,
      )}
      style={{ background: meta.bg, color: meta.fg }}
    >
      <span aria-hidden className="size-[5px] rounded-full" style={{ background: meta.dot }} />
      {meta.label}
    </span>
  );
}
