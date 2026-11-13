'use client';

import { useMemo, useState } from 'react';
import { SearchIcon } from 'lucide-react';
import type { StatusTone } from '@/shared/ui/status-badge';
import { cn } from '@/shared/lib/utils';
import { formatMoneyExact } from '@/shared/lib/format/currency';
import { formatTimestamp } from '@/shared/lib/format/date';
import {
  Chip,
  ChipRow,
  FA_BTN,
  FA_BTN_SMALL,
  FA_MUTED,
  FA_TABLE,
  FA_TABLE_WRAP,
  FA_TD,
  FA_TH,
  FA_THEAD_ROW,
  FA_TR,
  FaCard,
  PageHeader,
  Pill,
  type PillTone,
  StatBox,
  StatGrid,
} from '@/shared/ui/organizer/fa-page';
import { FaShowSelect } from '@/shared/ui/organizer/fa-show-select';
import { SALES_PAGE_SIZE } from '@/modules/sales/constants';
import type { SaleRow, SalesStats } from '@/modules/sales/types';
import { buildSalesCsv } from '@/modules/sales/utils/build-sales-csv';
import { salesCsvFilename } from '@/modules/sales/utils/sales-csv-filename';
import { RefundDialog } from '@/modules/sales/ui/refund-dialog';
import { ChargeMoreDialog } from '@/modules/sales/ui/charge-more-dialog';
import { InvoiceModal } from '@/modules/sales/ui/invoice-modal';
import { ByProductView } from '@/modules/sales/ui/by-product-view';
import { ByRiderView } from '@/modules/sales/ui/by-rider-view';

type EventSalesViewMode = 'customer' | 'product' | 'rider';

const VIEWS: { mode: EventSalesViewMode; label: string }[] = [
  { mode: 'customer', label: 'By customer' },
  { mode: 'product', label: 'By product' },
  { mode: 'rider', label: 'By rider' },
];

const TYPES: { type: 'all' | SaleRow['type']; label: string }[] = [
  { type: 'all', label: 'All types' },
  { type: 'Rider', label: 'Riders' },
  { type: 'Vendor', label: 'Vendors' },
];

/* Legacy moneyCell(amount, isPaid): when money is hidden it did NOT drop the
 * column — it swapped the amount for a Paid/Unpaid pill, so a Show Admin keeps
 * the operational signal (has this rider settled?) without seeing the figure.
 * Blanking the column entirely loses information legacy deliberately kept. */
function PaidPill({ row }: { row: SaleRow }) {
  const settled = row.status !== 'refunded' && row.amountTotal > 0;
  return <Pill tone={settled ? 'green' : 'grey'}>{settled ? 'Paid' : 'Unpaid'}</Pill>;
}

export const STATUS_TONE: Record<SaleRow['status'], StatusTone> = {
  paid: 'success',
  partial: 'warn',
  refunded: 'neutral',
};

const STATUS_PILL: Record<SaleRow['status'], PillTone> = {
  paid: 'green',
  partial: 'yellow',
  refunded: 'grey',
};

export const STATUS_LABEL: Record<SaleRow['status'], string> = {
  paid: 'Paid',
  partial: 'Partially refunded',
  refunded: 'Refunded',
};

export function EventSalesScreen({
  shows,
  currentRef,
  showId,
  showName,
  isLive,
  canRefund,
  canViewMoney,
  rows,
  stats,
}: {
  shows: { id: string; slug: string | null; name: string }[];
  /** The open show's slug or id, for the show picker. */
  currentRef: string;
  showId: string;
  showName: string;
  isLive: boolean;
  canRefund: boolean;

  /* Show Admin without money access still gets this screen — legacy showed it
   * with quantities and payment status, only the dollar figures removed. */
  canViewMoney: boolean;
  rows: SaleRow[];
  stats: SalesStats;
}) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | SaleRow['type']>('all');
  const [page, setPage] = useState(0);
  const [refundTarget, setRefundTarget] = useState<SaleRow | null>(null);
  const [chargeTarget, setChargeTarget] = useState<SaleRow | null>(null);
  const [invoiceTarget, setInvoiceTarget] = useState<SaleRow | null>(null);
  const [viewMode, setViewMode] = useState<EventSalesViewMode>('customer');

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

  function exportCsv() {
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
  }

  const columnCount = canRefund ? 6 : 5;

  return (
    <div id="event-sales-root" className="text-ink-deep font-[family-name:var(--font-ar)]">
      <PageHeader
        eyebrow={
          <span className="inline-flex flex-wrap items-center gap-2">
            Rider entries and add-ons · {showName}
            <Pill tone={isLive ? 'green' : 'yellow'}>{isLive ? 'LIVE' : 'TEST MODE'}</Pill>
          </span>
        }
        title="Event Sales"
        actions={
          <>
            {/* The CSV carries amountTotal, so it follows the same gate as the
                column — legacy removed its report buttons the same way
                (showstaff.html:14302). */}
            {canViewMoney && (
              <button type="button" className={FA_BTN} onClick={exportCsv}>
                <span aria-hidden>⇩</span> Contact list
              </button>
            )}
            <button
              type="button"
              className={FA_BTN}
              onClick={() => {
                window.print();
              }}
            >
              <span aria-hidden>🖨</span> Print / PDF
            </button>
            <FaShowSelect shows={shows} currentRef={currentRef} />
          </>
        }
      />

      <FaCard tone="dashed" className="mb-4 p-[10px_14px]">
        <p className="text-[12.5px] leading-[1.5] font-semibold text-pretty text-[#5A6B63]">
          &quot;Refund&quot; and &quot;Charge more&quot; both move real money through Stripe for
          real rider orders and vendor bookings. Refunds always hold back the platform fee.
          Additional charges reuse the card saved at checkout — if a sale predates this feature (or
          its card was never saved), charging more will say so rather than silently failing.
        </p>
      </FaCard>

      <StatGrid cols={4}>
        <StatBox
          label="Total sales"
          value={canViewMoney ? formatMoneyExact(stats.totalSales) : '—'}
          tone="green"
          note={
            <>
              paid, refunds netted
              {stats.refundedExcluded > 0 &&
                ` · ${String(stats.refundedExcluded)} with refunds, netted out`}
            </>
          }
        />
        <StatBox label="Transactions" value={stats.transactions} note="paid + refunded" />
        <StatBox
          label="Rider entries"
          value={
            canViewMoney
              ? `${String(stats.riderCount)} · ${formatMoneyExact(stats.riderTotal)}`
              : stats.riderCount
          }
        />
        <StatBox
          label="Vendor purchases"
          value={
            canViewMoney
              ? `${String(stats.vendorCount)} · ${formatMoneyExact(stats.vendorTotal)}`
              : stats.vendorCount
          }
        />
      </StatGrid>

      <ChipRow className="print:hidden">
        {VIEWS.map((view) => (
          <Chip
            key={view.mode}
            active={viewMode === view.mode}
            onClick={() => {
              setViewMode(view.mode);
            }}
          >
            {view.label}
          </Chip>
        ))}
        {viewMode === 'customer' && (
          <>
            <span aria-hidden className="mx-1 h-6 w-px bg-[#C9D3CE]" />
            {TYPES.map((t) => (
              <Chip
                key={t.type}
                active={typeFilter === t.type}
                onClick={() => {
                  setTypeFilter(t.type);
                  setPage(0);
                }}
              >
                {t.label}
              </Chip>
            ))}
            <label className="ml-auto flex h-10 w-[290px] max-w-full items-center gap-2 rounded-[10px] border-2 border-[#C9D3CE] bg-white px-3 focus-within:border-[#1A5B3C]">
              <SearchIcon className="size-4 text-[#98A29D]" aria-hidden />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                placeholder="Name, date, total, status"
                aria-label="Search sales"
                className="w-full border-0 bg-transparent text-[14px] outline-none"
              />
            </label>
          </>
        )}
      </ChipRow>

      <div id="print-report">
        {viewMode === 'product' && (
          <FaCard>
            <ByProductView rows={rows} canViewMoney={canViewMoney} />
          </FaCard>
        )}
        {viewMode === 'rider' && (
          <FaCard>
            <ByRiderView rows={rows} canViewMoney={canViewMoney} />
          </FaCard>
        )}
        {viewMode === 'customer' && (
          <>
            <div className={FA_TABLE_WRAP}>
              <table className={cn(FA_TABLE, 'min-w-[680px]')}>
                <caption className="sr-only">Paid rider entries and vendor purchases</caption>
                <thead>
                  <tr className={FA_THEAD_ROW}>
                    <th scope="col" className={FA_TH}>
                      Customer
                    </th>
                    <th scope="col" className={FA_TH}>
                      Type
                    </th>
                    <th scope="col" className={FA_TH}>
                      Date
                    </th>
                    <th scope="col" className={cn(FA_TH, 'text-right')}>
                      Total
                    </th>
                    <th scope="col" className={FA_TH}>
                      Status
                    </th>
                    {canRefund && (
                      <th scope="col" className={cn(FA_TH, 'text-right')}>
                        <span className="sr-only">Actions</span>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {pageRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={columnCount}
                        className="px-4 py-10 text-center text-[13.5px] text-[#5A6B63]"
                      >
                        No sales match this filter yet.
                      </td>
                    </tr>
                  ) : (
                    pageRows.map((row) => (
                      <tr
                        key={`${row.saleType}-${row.id}`}
                        onClick={() => {
                          setInvoiceTarget(row);
                        }}
                        className={cn(FA_TR, 'cursor-pointer hover:bg-[#FBFCFB]')}
                      >
                        <td className={cn(FA_TD, 'font-bold')}>{row.customer}</td>
                        <td className={FA_TD}>
                          <Pill tone="grey">{row.type}</Pill>
                        </td>
                        <td className={cn(FA_TD, FA_MUTED)}>
                          {row.date ? formatTimestamp(row.date) : '—'}
                        </td>
                        <td className={cn(FA_TD, 'text-right font-bold')}>
                          {canViewMoney ? (
                            formatMoneyExact(row.amountTotal)
                          ) : (
                            <PaidPill row={row} />
                          )}
                        </td>
                        <td className={FA_TD}>
                          <Pill tone={STATUS_PILL[row.status]}>{STATUS_LABEL[row.status]}</Pill>
                          {row.reviewReason && (
                            <span title={row.reviewReason} className="ml-1.5">
                              <Pill tone="red">Needs review</Pill>
                            </span>
                          )}
                        </td>
                        {canRefund && (
                          <td
                            className={cn(FA_TD, 'text-right')}
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                          >
                            <div className="flex justify-end gap-1.5">
                              <button
                                type="button"
                                className={FA_BTN_SMALL}
                                disabled={!row.hasRefundableBalance}
                                onClick={() => {
                                  setRefundTarget(row);
                                }}
                              >
                                Refund
                              </button>
                              <button
                                type="button"
                                className={FA_BTN_SMALL}
                                disabled={!row.hasSavedCard}
                                title={row.hasSavedCard ? undefined : 'No saved card on file'}
                                onClick={() => {
                                  setChargeTarget(row);
                                }}
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

            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-3">
              <span className={FA_MUTED}>
                {filtered.length} record{filtered.length === 1 ? '' : 's'} · click a sale for its
                invoice
              </span>
              {totalPages > 1 && (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className={FA_BTN_SMALL}
                    disabled={clampedPage === 0}
                    onClick={() => {
                      setPage((p) => Math.max(0, p - 1));
                    }}
                  >
                    ← Previous
                  </button>
                  <span className={FA_MUTED}>
                    Page {clampedPage + 1} of {totalPages}
                  </span>
                  <button
                    type="button"
                    className={FA_BTN_SMALL}
                    disabled={clampedPage >= totalPages - 1}
                    onClick={() => {
                      setPage((p) => Math.min(totalPages - 1, p + 1));
                    }}
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {invoiceTarget && (
        <InvoiceModal
          sale={invoiceTarget}
          canRefund={canRefund}
          canViewMoney={canViewMoney}
          onClose={() => {
            setInvoiceTarget(null);
          }}
          onRefund={() => {
            setRefundTarget(invoiceTarget);
            setInvoiceTarget(null);
          }}
          onChargeMore={() => {
            setChargeTarget(invoiceTarget);
            setInvoiceTarget(null);
          }}
        />
      )}
      {refundTarget && (
        <RefundDialog
          showId={showId}
          sale={refundTarget}
          canViewMoney={canViewMoney}
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
