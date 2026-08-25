import { formatMoney } from '@/shared/lib/format/currency';
import { cn } from '@/shared/lib/utils';
import { OrganizationRowActions } from '@/modules/superadmin/ui/organization-row-actions';
import { StatusPill } from '@/modules/superadmin/ui/organizations-table-status-pill';
import type { OrganizationSummary } from '@/modules/superadmin/types';

const COLUMNS = 'grid-cols-[minmax(200px,1fr)_72px_72px_84px_216px]';
const DISPLAY = 'font-[family-name:var(--font-nr)]';

export function OrganizationsTable({ organizations }: { organizations: OrganizationSummary[] }) {
  if (organizations.length === 0) {
    return (
      <div className="border-line rounded-[14px] border bg-white px-5 pt-14 pb-[60px] text-center">
        <div className={`${DISPLAY} text-forest mb-2 text-2xl`}>No organizers match.</div>
        <p className="text-fa-muted-2 m-0 text-[13.5px]">
          Check the spelling, or clear the search to see every client.
        </p>
      </div>
    );
  }

  return (
    <div className="border-line rounded-[14px] border bg-white">
      <div className="overflow-x-auto">
        <div role="table" aria-label="Organizers" className="min-w-[740px]">
          <div
            role="row"
            className={cn('border-line grid gap-3.5 border-b bg-[#F6F3EC] px-5 py-[11px]', COLUMNS)}
          >
            {['Organizer', 'Shows', 'Riders', 'Revenue', 'Actions'].map((label, index) => (
              <span
                key={label}
                role="columnheader"
                className={cn(
                  'text-fa-muted-2 text-[10px] font-bold tracking-[.14em] uppercase',
                  index > 0 && 'text-right',
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
                COLUMNS,
              )}
            >
              <div role="cell" className="flex min-w-0 flex-col gap-[5px]">
                <div className="flex flex-wrap items-center gap-[9px]">
                  <span className="text-forest text-sm font-bold tracking-[-.005em]">
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
                <span className="text-fa-muted-2 text-xs leading-[1.45]">
                  {[org.city, org.region].filter(Boolean).join(', ') || 'No location set'}
                </span>
              </div>

              <span
                role="cell"
                className={cn(
                  `${DISPLAY} text-right text-xl`,
                  org.showCount > 0 ? 'text-forest' : 'text-[#C4CDC8]',
                )}
              >
                {org.showCount}
              </span>
              <span
                role="cell"
                className={cn(
                  `${DISPLAY} text-right text-xl`,
                  org.riderCount > 0 ? 'text-forest' : 'text-[#C4CDC8]',
                )}
              >
                {org.riderCount}
              </span>
              <span
                role="cell"
                className={cn(
                  `${DISPLAY} text-right text-xl`,
                  org.revenueEstimate > 0 ? 'text-forest' : 'text-[#C4CDC8]',
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
        <span className="text-fa-muted-2 text-[12.5px]">
          {organizations.length} {organizations.length === 1 ? 'organizer' : 'organizers'}
        </span>
        <span className="text-[12.5px] text-[#9AA6A0]">
          Revenue is estimated from entered fees — nothing has been collected yet.
        </span>
      </div>
    </div>
  );
}
