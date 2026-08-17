import { formatMoney } from '@/shared/lib/format/currency';
import { cn } from '@/shared/lib/utils';
import { OrganizationRowActions } from './organization-row-actions';
import type { OrganizationSummary } from '../types';

/**
 * The "Clients — Organizers" table, built to the Admin Console design.
 *
 * A CSS grid rather than a <table>: the design's rows are two-line cells (name +
 * status pill above location) with a right-aligned action cluster, and the
 * column track has to stay identical between the header strip and every row. A
 * grid states that once; a table would need matching widths on both.
 * Semantics are kept with explicit roles so it still reads as a table.
 *
 * Revenue is labelled an estimate because it is one — entries x avg_entry_value,
 * exactly as the legacy console computed it. Settled revenue lives on the
 * billing page and comes from paid orders.
 */

const COLUMNS = 'grid-cols-[minmax(200px,1fr)_72px_72px_84px_216px]';
const DISPLAY = 'font-[family-name:var(--font-nr)]';

function StatusPill({
  tone,
  children,
}: {
  tone: 'success' | 'warn' | 'danger' | 'info';
  children: React.ReactNode;
}) {
  const tones = {
    success: 'bg-[#E4F1E8] text-[#2E7048] [--dot:#3E8E5A]',
    warn: 'bg-[#F6EAC8] text-[#8A6D14] [--dot:#C9A227]',
    danger: 'bg-alert-bg text-alert-fg [--dot:#B4432F]',
    info: 'bg-mint text-forest [--dot:#5A6B63]',
  } as const;

  return (
    <span
      className={cn(
        'inline-flex h-[19px] flex-none items-center gap-[5px] rounded-full px-2 text-[10px] font-bold tracking-[.04em]',
        tones[tone]
      )}
    >
      <span aria-hidden className="size-[5px] rounded-full bg-[var(--dot)]" />
      {children}
    </span>
  );
}

export function OrganizationsTable({ organizations }: { organizations: OrganizationSummary[] }) {
  if (organizations.length === 0) {
    return (
      <div className="rounded-[14px] border border-line bg-white px-5 pb-[60px] pt-14 text-center">
        <div className={`${DISPLAY} mb-2 text-2xl text-forest`}>No organizers match.</div>
        <p className="m-0 text-[13.5px] text-fa-muted-2">
          Check the spelling, or clear the search to see every client.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[14px] border border-line bg-white">
      <div className="overflow-x-auto">
        <div role="table" aria-label="Organizers" className="min-w-[740px]">
          <div
            role="row"
            className={cn(
              'grid gap-3.5 border-b border-line bg-[#F6F3EC] px-5 py-[11px]',
              COLUMNS
            )}
          >
            {['Organizer', 'Shows', 'Riders', 'Revenue', 'Actions'].map((label, index) => (
              <span
                key={label}
                role="columnheader"
                className={cn(
                  'text-[10px] font-bold uppercase tracking-[.14em] text-fa-muted-2',
                  index > 0 && 'text-right'
                )}
              >
                {label}
              </span>
            ))}
          </div>

          {organizations.map((org) => (
            <div
              key={org.id}
              role="row"
              className={cn(
                'relative grid items-center gap-3.5 border-b border-[#EEF2EF] px-5 py-[15px] transition-colors last:border-b-0 hover:bg-[#FAFCFB]',
                COLUMNS
              )}
            >
              <div role="cell" className="flex min-w-0 flex-col gap-[5px]">
                <div className="flex flex-wrap items-center gap-[9px]">
                  {/* Plain text, not a link. It pointed at
                      /dashboard/superadmin/organizations/[id], which does not
                      exist — a 404 on the console's main table. Entering the
                      organizer is what that link was reaching for, and the row's
                      own primary action already does it. */}
                  <span className="text-sm font-bold tracking-[-.005em] text-forest">
                    {org.name}
                  </span>
                  {org.onboarded ? (
                    <StatusPill tone="success">Onboard</StatusPill>
                  ) : (
                    <StatusPill tone="warn">Pending</StatusPill>
                  )}
                  {org.deletedAt && <StatusPill tone="danger">Deleted</StatusPill>}
                  {org.suspended && <StatusPill tone="danger">Suspended</StatusPill>}
                  {org.isDemo && <StatusPill tone="info">Demo</StatusPill>}
                </div>
                <span className="text-xs leading-[1.45] text-fa-muted-2">
                  {[org.city, org.region].filter(Boolean).join(', ') || 'No location set'}
                </span>
              </div>

              {/* Zero reads as absence, not as a measurement, so it is greyed —
                  the design draws empty counts in a lighter tone for exactly
                  that reason. */}
              <span
                role="cell"
                className={cn(
                  `${DISPLAY} text-right text-xl`,
                  org.showCount > 0 ? 'text-forest' : 'text-[#C4CDC8]'
                )}
              >
                {org.showCount}
              </span>
              <span
                role="cell"
                className={cn(
                  `${DISPLAY} text-right text-xl`,
                  org.riderCount > 0 ? 'text-forest' : 'text-[#C4CDC8]'
                )}
              >
                {org.riderCount}
              </span>
              <span
                role="cell"
                className={cn(
                  `${DISPLAY} text-right text-xl`,
                  org.revenueEstimate > 0 ? 'text-forest' : 'text-[#C4CDC8]'
                )}
              >
                {formatMoney(org.revenueEstimate, org.currency, org.locale)}
              </span>

              <div role="cell" className="flex items-center justify-end gap-1.5">
                <OrganizationRowActions org={org} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 px-5 py-3.5">
        <span className="text-[12.5px] text-fa-muted-2">
          {organizations.length} {organizations.length === 1 ? 'organizer' : 'organizers'}
        </span>
        <span className="text-[12.5px] text-[#9AA6A0]">
          Revenue is estimated from entered fees — nothing has been collected yet.
        </span>
      </div>
    </div>
  );
}
