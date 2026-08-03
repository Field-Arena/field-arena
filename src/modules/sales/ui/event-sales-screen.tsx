'use client';

import { useMemo, useState } from 'react';
import { StatusBadge, type StatusTone } from '@/shared/ui/status-badge';
import { formatMoneyExact } from '@/shared/lib/format/currency';
import { formatTimestamp } from '@/shared/lib/format/date';
import { SALES_PAGE_SIZE } from '../constants';
import type { SaleRow } from '../data/queries';
import type { SalesStats } from '../utils';
import { RefundDialog } from './refund-dialog';
import { ChargeMoreDialog } from './charge-more-dialog';

const STATUS_TONE: Record<SaleRow['status'], StatusTone> = {
  paid: 'success',
  partial: 'warn',
  refunded: 'neutral',
};

const STATUS_LABEL: Record<SaleRow['status'], string> = {
  paid: 'Paid',
  partial: 'Partially refunded',
  refunded: 'Refunded',
};

/**
 * Event Sales — the transactions ledger, ported from showstaff.html's
 * renderEventSales / updateSalesTable. "By Product" and "By Rider" are the
 * legacy view's other two tabs; they aren't built yet, so they stay honest,
 * inert stubs rather than empty-looking real tabs.
 */
export function EventSalesScreen({
  showId,
  showName,
  isLive,
  canRefund,
  rows,
  stats,
}: {
  showId: string;
  showName: string;
  isLive: boolean;
  canRefund: boolean;
  rows: SaleRow[];
  stats: SalesStats;
}) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | SaleRow['type']>('all');
  const [page, setPage] = useState(0);
  const [refundTarget, setRefundTarget] = useState<SaleRow | null>(null);
  const [chargeTarget, setChargeTarget] = useState<SaleRow | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (typeFilter !== 'all' && r.type !== typeFilter) return false;
      if (!q) return true;
      return (
        r.customer.toLowerCase().includes(q) ||
        r.showName.toLowerCase().includes(q) ||
        String(r.amountTotal).includes(q) ||
        STATUS_LABEL[r.status].toLowerCase().includes(q)
      );
    });
  }, [rows, search, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / SALES_PAGE_SIZE));
  const clampedPage = Math.min(page, totalPages - 1);
  const pageRows = filtered.slice(
    clampedPage * SALES_PAGE_SIZE,
    clampedPage * SALES_PAGE_SIZE + SALES_PAGE_SIZE,
  );

  return (
    <div id="event-sales-root">
      <div className="mb-4 flex items-start gap-3 rounded-[10px] border border-[#BFE0F5] bg-[#EAF4FC] px-4 py-3.5 text-[13px] text-[#1F3A5F]">
        <StatusBadge tone={isLive ? 'info' : 'neutral'} className="mt-0.5 flex-none">
          {isLive ? 'LIVE' : 'TEST MODE'}
        </StatusBadge>
        <p className="leading-[1.5] text-pretty">
          &quot;Refund charge&quot; and &quot;Charge additional amount&quot; both move real money
          through Stripe for real rider orders and vendor bookings. Refunds always hold back the
          platform fee. Additional charges reuse the card saved at checkout — if a sale predates
          this feature (or its card was never saved), charging more will say so rather than silently
          failing.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="text-ink-deep min-w-0 flex-1 truncate text-[13.5px] font-semibold">
          {showName}
        </span>
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          placeholder="Search name, show, date, total, status…"
          className="min-w-[260px] flex-[2_1_260px] rounded-[10px] border border-[#D9E1DD] px-3.5 py-2.5 text-sm"
        />
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value as 'all' | SaleRow['type']);
            setPage(0);
          }}
          className="rounded-[10px] border border-[#D9E1DD] px-3 py-2.5 text-sm"
          aria-label="Filter by type"
        >
          <option value="all">All types</option>
          <option value="Rider">Rider</option>
          <option value="Vendor">Vendor</option>
        </select>
        <span className="text-[13px] text-[#98A29D]">
          {filtered.length} record{filtered.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="stat-grid">
        <div className="stat">
          <div className="stat-label">Total sales</div>
          <div className="stat-value">{formatMoneyExact(stats.totalSales)}</div>
          <div className="mt-1 text-[11.5px] text-[#98A29D]">
            paid, this filter
            {stats.refundedExcluded > 0 &&
              ` · ${String(stats.refundedExcluded)} refunded, excluded`}
          </div>
        </div>
        <div className="stat">
          <div className="stat-label">Transactions</div>
          <div className="stat-value">{stats.transactions}</div>
          <div className="mt-1 text-[11.5px] text-[#98A29D]">paid + refunded</div>
        </div>
        <div className="stat">
          <div className="stat-label">Rider entries</div>
          <div className="stat-value">{stats.riderCount}</div>
          <div className="mt-1 text-[11.5px] text-[#98A29D]">
            {formatMoneyExact(stats.riderTotal)}
          </div>
        </div>
        <div className="stat">
          <div className="stat-label">Vendor purchases</div>
          <div className="stat-value">{stats.vendorCount}</div>
          <div className="mt-1 text-[11.5px] text-[#98A29D]">
            {formatMoneyExact(stats.vendorTotal)}
          </div>
        </div>
      </div>

      <ViewTabs />

      <div className="mb-3 flex justify-end">
        <button
          type="button"
          onClick={() => {
            window.print();
          }}
          className="text-forest hover:border-gold inline-flex items-center gap-2 rounded-[9px] border border-[#D9E1DD] bg-white px-3.5 py-2.5 text-[12.5px] font-semibold transition-colors"
        >
          🖨 Print / Export PDF
        </button>
      </div>

      <div id="print-report" className="overflow-hidden rounded-[12px] border border-[#E9EDEB]">
        <div style={{ overflowX: 'auto' }}>
          <table className="w-full min-w-[760px] border-collapse text-[13.5px]">
            <caption className="sr-only">Paid rider entries and vendor purchases</caption>
            <thead>
              <tr className="border-b border-[#E9EDEB] bg-[#FAFAF6]">
                <Th>Customer</Th>
                <Th>Type</Th>
                <Th>Show</Th>
                <Th>Date</Th>
                <Th align="right">Total</Th>
                <Th>Status</Th>
                {canRefund && <Th align="right">Actions</Th>}
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={canRefund ? 7 : 6}
                    className="px-4 py-10 text-center text-[13px] text-[#98A29D]"
                  >
                    No sales match this filter yet.
                  </td>
                </tr>
              ) : (
                pageRows.map((row) => (
                  <tr key={`${row.saleType}-${row.id}`} className="border-b border-[#EEF2F0]">
                    <td className="text-ink-deep px-3 py-2.5 font-semibold">{row.customer}</td>
                    <td className="px-3 py-2.5">{row.type}</td>
                    <td className="px-3 py-2.5">{row.showName}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {row.date ? formatTimestamp(row.date) : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap">
                      {formatMoneyExact(row.amountTotal)}
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusBadge tone={STATUS_TONE[row.status]}>
                        {STATUS_LABEL[row.status]}
                      </StatusBadge>
                    </td>
                    {canRefund && (
                      <td className="px-3 py-2.5 text-right">
                        <div className="flex justify-end gap-3">
                          <button
                            type="button"
                            disabled={row.maxRefundable <= 0}
                            onClick={() => {
                              setRefundTarget(row);
                            }}
                            className="text-[12.5px] font-semibold text-[#B4432F] hover:underline disabled:cursor-not-allowed disabled:text-[#C7B9B5] disabled:no-underline"
                          >
                            Refund
                          </button>
                          <button
                            type="button"
                            disabled={!row.hasSavedCard}
                            title={row.hasSavedCard ? undefined : 'No saved card on file'}
                            onClick={() => {
                              setChargeTarget(row);
                            }}
                            className="text-forest text-[12.5px] font-semibold hover:underline disabled:cursor-not-allowed disabled:text-[#B7C0BB] disabled:no-underline"
                          >
                            Charge more
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 border-t border-[#E9EDEB] px-4 py-3.5">
            <button
              type="button"
              disabled={clampedPage === 0}
              onClick={() => {
                setPage((p) => Math.max(0, p - 1));
              }}
              className="text-forest rounded-[9px] border border-[#D9E1DD] bg-white px-3.5 py-2 text-[13px] font-semibold disabled:opacity-40"
            >
              ← Previous
            </button>
            <span className="text-[13px] text-[#6E7C76]">
              Page {clampedPage + 1} of {totalPages}
            </span>
            <button
              type="button"
              disabled={clampedPage >= totalPages - 1}
              onClick={() => {
                setPage((p) => Math.min(totalPages - 1, p + 1));
              }}
              className="text-forest rounded-[9px] border border-[#D9E1DD] bg-white px-3.5 py-2 text-[13px] font-semibold disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {refundTarget && (
        <RefundDialog
          showId={showId}
          sale={refundTarget}
          onClose={() => {
            setRefundTarget(null);
          }}
        />
      )}
      {chargeTarget && (
        <ChargeMoreDialog
          showId={showId}
          sale={chargeTarget}
          onClose={() => {
            setChargeTarget(null);
          }}
        />
      )}
    </div>
  );
}

function Th({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th
      scope="col"
      className={`px-3 py-2.5 text-[11px] font-bold tracking-[.06em] text-[#6E7C76] uppercase ${
        align === 'right' ? 'text-right' : 'text-left'
      }`}
    >
      {children}
    </th>
  );
}

/**
 * By Customer is the only real tab so far — By Product and By Rider are the
 * legacy view's own groupings of the same real data and aren't built yet.
 * Left visibly inert rather than silently missing, matching the same honesty
 * pattern as Show Manager's own unbuilt tabs.
 */
function ViewTabs() {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <span className="rounded-[9px] bg-[#0D2C23] px-4 py-2 text-[13px] font-bold text-white">
        By Customer
      </span>
      <span
        title="Not built yet — coming in a later update"
        className="cursor-not-allowed rounded-[9px] border border-[#D9E1DD] bg-white px-4 py-2 text-[13px] font-semibold text-[#B7C0BB]"
      >
        By Product
      </span>
      <span
        title="Not built yet — coming in a later update"
        className="cursor-not-allowed rounded-[9px] border border-[#D9E1DD] bg-white px-4 py-2 text-[13px] font-semibold text-[#B7C0BB]"
      >
        By Rider
      </span>
    </div>
  );
}
