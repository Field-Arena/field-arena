import Link from 'next/link';
import { StatusBadge } from '@/shared/ui/status-badge';
import { formatMoney } from '@/shared/lib/format/currency';
import type { OrganizationSummary } from '../data/queries';

/**
 * The "Clients — Organizers" table, matching the legacy console's columns:
 * organizer (with onboarding state and location), shows, riders, estimated
 * revenue, then per-row actions.
 *
 * Revenue is labelled an estimate because it is one — entries x avg_entry_value,
 * exactly as the legacy console computed it. Settled revenue lives on the billing
 * page and comes from paid orders.
 *
 * Show and rider counts are derived per organization in the query rather than
 * read from a stored column: the legacy schema carried shows.entries_count and
 * its own comment called it a placeholder for a computed count, which is right —
 * a stored counter is a second source of truth that drifts the moment an entry is
 * written by a path that forgets to increment it.
 */
export function OrganizationsTable({ organizations }: { organizations: OrganizationSummary[] }) {
  if (organizations.length === 0) {
    return (
      <p className="text-fa-muted rounded-xl border border-dashed border-border bg-white px-5 py-8 text-center text-sm">
        No organizers yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-white">
      <table className="w-full border-collapse text-[13.5px]">
        <caption className="sr-only">
          Every organizer on the platform, with shows, riders and estimated revenue
        </caption>
        <thead>
          <tr className="bg-hunter-pale">
            <th
              scope="col"
              className="text-fa-muted px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-[0.04em]"
            >
              Organizer
            </th>
            <th
              scope="col"
              className="text-fa-muted px-3 py-2.5 text-right text-[11px] font-bold uppercase tracking-[0.04em]"
            >
              Shows
            </th>
            <th
              scope="col"
              className="text-fa-muted px-3 py-2.5 text-right text-[11px] font-bold uppercase tracking-[0.04em]"
            >
              Riders
            </th>
            <th
              scope="col"
              className="text-fa-muted px-3 py-2.5 text-right text-[11px] font-bold uppercase tracking-[0.04em]"
            >
              Revenue (est.)
            </th>
            <th
              scope="col"
              className="text-fa-muted px-4 py-2.5 text-right text-[11px] font-bold uppercase tracking-[0.04em]"
            >
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {organizations.map((org) => (
            <tr key={org.id} className="border-b border-border last:border-b-0">
              <td className="px-4 py-3">
                <span className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/dashboard/superadmin/organizations/${org.id}`}
                    className="font-bold text-hunter-deep no-underline hover:underline"
                  >
                    {org.name}
                  </Link>
                  {org.onboarded ? (
                    <StatusBadge tone="success">Onboard</StatusBadge>
                  ) : (
                    <StatusBadge tone="warn">Pending</StatusBadge>
                  )}
                  {org.deletedAt && <StatusBadge tone="danger">Deleted</StatusBadge>}
                  {org.suspended && <StatusBadge tone="danger">Suspended</StatusBadge>}
                  {org.isDemo && <StatusBadge tone="info">Demo</StatusBadge>}
                </span>
                <span className="text-fa-muted mt-0.5 block text-xs">
                  {[org.city, org.region].filter(Boolean).join(', ') || '—'}
                </span>
              </td>
              <td className="px-3 py-3 text-right font-semibold text-hunter-deep">
                {org.showCount}
              </td>
              <td className="px-3 py-3 text-right font-semibold text-hunter-deep">
                {org.riderCount}
              </td>
              <td className="px-3 py-3 text-right font-semibold text-hunter-deep">
                {formatMoney(org.revenueEstimate, org.currency, org.locale)}
              </td>
              <td className="px-4 py-3">
                <span className="flex flex-wrap justify-end gap-1.5">
                  {/*
                    Edit and "Enter as organizer" are rendered but inert, and
                    explicitly marked so. Editing needs a form this pass has not
                    built, and entering as an organizer needs the organizer
                    workspace to accept an impersonated org context, which it does
                    not yet — it still renders fixed demo figures. A button that
                    looks live and silently does nothing is worse than one that
                    says why.
                  */}
                  <button
                    type="button"
                    disabled
                    title="Editing an organization is not migrated yet"
                    className="rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs font-bold text-hunter-deep opacity-45"
                  >
                    Edit
                  </button>
                  {!org.onboarded && (
                    <button
                      type="button"
                      disabled
                      title="Sending invite email needs the email provider wired"
                      className="rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs font-bold text-hunter-deep opacity-45"
                    >
                      Resend invite
                    </button>
                  )}
                  <button
                    type="button"
                    disabled
                    title="Impersonation needs the organizer workspace to accept an org context"
                    className="rounded-lg border border-gold bg-gold-pale px-2.5 py-1.5 text-xs font-bold text-hunter-deep opacity-45"
                  >
                    Enter as organizer →
                  </button>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
