'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/shared/ui/shadcn/button';
import { Input } from '@/shared/ui/shadcn/input';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from '@/shared/ui/shadcn/table';
import { StatusBadge, type StatusTone } from '@/shared/ui/status-badge';
import { cn } from '@/shared/lib/utils';
import { formatMoneyExact } from '@/shared/lib/format/currency';
import { formatTimestamp } from '@/shared/lib/format/date';
import { SALES_PAGE_SIZE } from '@/modules/sales/constants';
import type { SaleRow, SalesStats } from '@/modules/sales/types';
import { buildSalesCsv } from '@/modules/sales/utils/build-sales-csv';
import { salesCsvFilename } from '@/modules/sales/utils/sales-csv-filename';
import { RefundDialog } from '@/modules/sales/ui/refund-dialog';
import { ChargeMoreDialog } from '@/modules/sales/ui/charge-more-dialog';
import { EventSalesViewTabs } from '@/modules/sales/ui/event-sales-view-tabs';

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

const HEAD_CELL_CLASS = 'h-auto px-3 py-2.5 text-[11px] font-bold tracking-[.06em] text-[#6E7C76] uppercase';

const COLUMNS: { key: string; label: string; align?: 'right' }[] = [
  { key: 'customer', label: 'Customer' },
  { key: 'type', label: 'Type' },
  { key: 'show', label: 'Show' },
  { key: 'date', label: 'Date' },
  { key: 'total', label: 'Total', align: 'right' },
  { key: 'status', label: 'Status' },
];

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

  const statTiles: { label: string; value: React.ReactNode; sub: React.ReactNode }[] = [
    {
      label: 'Total sales',
      value: formatMoneyExact(stats.totalSales),
      sub: (
        <>
          paid, this filter
          {stats.refundedExcluded > 0 && ` · ${String(stats.refundedExcluded)} refunded, excluded`}
        </>
      ),
    },
    { label: 'Transactions', value: stats.transactions, sub: 'paid + refunded' },
    { label: 'Rider entries', value: stats.riderCount, sub: formatMoneyExact(stats.riderTotal) },
    { label: 'Vendor purchases', value: stats.vendorCount, sub: formatMoneyExact(stats.vendorTotal) },
  ];

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
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          placeholder="Search name, show, date, total, status…"
          className="h-auto min-w-[260px] flex-[2_1_260px] rounded-[10px] border-[#D9E1DD] px-3.5 py-2.5 text-sm outline-none focus-visible:ring-0"
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
        {statTiles.map((tile) => (
          <div className="stat" key={tile.label}>
            <div className="stat-label">{tile.label}</div>
            <div className="stat-value">{tile.value}</div>
            <div className="mt-1 text-[11.5px] text-[#98A29D]">{tile.sub}</div>
          </div>
        ))}
      </div>

      <EventSalesViewTabs />

      <div className="mb-3 flex justify-end gap-2.5">
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            const csv = buildSalesCsv(
              filtered.map((r) => ({
                customer: r.customer,
                type: r.type,
                showName: r.showName,
                date: r.date,
                amountTotal: r.amountTotal,
                statusLabel: STATUS_LABEL[r.status],
              })),
            );
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = salesCsvFilename(showName);
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
          }}
          className="h-auto gap-2 rounded-[9px] border border-[#D9E1DD] bg-white px-3.5 py-2.5 text-[12.5px] font-semibold text-forest transition-colors hover:border-gold hover:bg-transparent"
        >
          ⬇ Export Contact List
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            window.print();
          }}
          className="h-auto gap-2 rounded-[9px] border border-[#D9E1DD] bg-white px-3.5 py-2.5 text-[12.5px] font-semibold text-forest transition-colors hover:border-gold hover:bg-transparent"
        >
          🖨 Print / Export PDF
        </Button>
      </div>

      <div id="print-report" className="overflow-hidden rounded-[12px] border border-[#E9EDEB]">
        <div style={{ overflowX: 'auto' }}>
          <Table className="w-full min-w-[760px] border-collapse text-[13.5px]">
            <TableCaption className="sr-only">Paid rider entries and vendor purchases</TableCaption>
            <TableHeader>
              <TableRow className="border-b border-[#E9EDEB] bg-[#FAFAF6] hover:bg-transparent">
                {COLUMNS.map((col) => (
                  <TableHead
                    key={col.key}
                    scope="col"
                    className={cn(HEAD_CELL_CLASS, col.align === 'right' ? 'text-right' : 'text-left')}
                  >
                    {col.label}
                  </TableHead>
                ))}
                {canRefund && (
                  <TableHead scope="col" className={cn(HEAD_CELL_CLASS, 'text-right')}>
                    Actions
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody className="[&_tr:last-child]:border-b">
              {pageRows.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={canRefund ? 7 : 6}
                    className="px-4 py-10 text-center text-[13px] whitespace-normal text-[#98A29D]"
                  >
                    No sales match this filter yet.
                  </TableCell>
                </TableRow>
              ) : (
                pageRows.map((row) => (
                  <TableRow
                    key={`${row.saleType}-${row.id}`}
                    className="border-b border-[#EEF2F0] hover:bg-transparent"
                  >
                    <TableCell className="text-ink-deep px-3 py-2.5 font-semibold whitespace-normal">
                      {row.customer}
                    </TableCell>
                    <TableCell className="px-3 py-2.5 whitespace-normal">{row.type}</TableCell>
                    <TableCell className="px-3 py-2.5 whitespace-normal">{row.showName}</TableCell>
                    <TableCell className="px-3 py-2.5">
                      {row.date ? formatTimestamp(row.date) : '—'}
                    </TableCell>
                    <TableCell className="px-3 py-2.5 text-right">
                      {formatMoneyExact(row.amountTotal)}
                    </TableCell>
                    <TableCell className="px-3 py-2.5 whitespace-normal">
                      <StatusBadge tone={STATUS_TONE[row.status]}>
                        {STATUS_LABEL[row.status]}
                      </StatusBadge>
                    </TableCell>
                    {canRefund && (
                      <TableCell className="px-3 py-2.5 text-right whitespace-normal">
                        <div className="flex justify-end gap-3">
                          <Button
                            type="button"
                            variant="ghost"
                            disabled={row.maxRefundable <= 0}
                            onClick={() => {
                              setRefundTarget(row);
                            }}
                            className="h-auto rounded-none px-0 py-0 text-[12.5px] font-semibold text-[#B4432F] hover:bg-transparent hover:underline disabled:cursor-not-allowed disabled:text-[#C7B9B5] disabled:no-underline disabled:opacity-100"
                          >
                            Refund
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            disabled={!row.hasSavedCard}
                            title={row.hasSavedCard ? undefined : 'No saved card on file'}
                            onClick={() => {
                              setChargeTarget(row);
                            }}
                            className="text-forest h-auto rounded-none px-0 py-0 text-[12.5px] font-semibold hover:bg-transparent hover:underline disabled:cursor-not-allowed disabled:text-[#B7C0BB] disabled:no-underline disabled:opacity-100"
                          >
                            Charge more
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 border-t border-[#E9EDEB] px-4 py-3.5">
            <Button
              type="button"
              variant="ghost"
              disabled={clampedPage === 0}
              onClick={() => {
                setPage((p) => Math.max(0, p - 1));
              }}
              className="text-forest h-auto rounded-[9px] border border-[#D9E1DD] bg-white px-3.5 py-2 text-[13px] font-semibold hover:bg-transparent disabled:opacity-40"
            >
              ← Previous
            </Button>
            <span className="text-[13px] text-[#6E7C76]">
              Page {clampedPage + 1} of {totalPages}
            </span>
            <Button
              type="button"
              variant="ghost"
              disabled={clampedPage >= totalPages - 1}
              onClick={() => {
                setPage((p) => Math.min(totalPages - 1, p + 1));
              }}
              className="text-forest h-auto rounded-[9px] border border-[#D9E1DD] bg-white px-3.5 py-2 text-[13px] font-semibold hover:bg-transparent disabled:opacity-40"
            >
              Next →
            </Button>
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
