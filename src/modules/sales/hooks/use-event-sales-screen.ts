'use client';

import { useMemo, useState } from 'react';
import { SALES_PAGE_SIZE, STATUS_LABEL } from '@/modules/sales/constants';
import type { SaleRow } from '@/modules/sales/types';
import { buildSalesCsv } from '@/modules/sales/utils/build-sales-csv';
import { salesCsvFilename } from '@/modules/sales/utils/sales-csv-filename';

export function useEventSalesScreen(rows: SaleRow[], showName: string) {
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

  function updateSearch(value: string) {
    setSearch(value);
    setPage(0);
  }

  function updateTypeFilter(value: 'all' | SaleRow['type']) {
    setTypeFilter(value);
    setPage(0);
  }

  function goToPreviousPage() {
    setPage((p) => Math.max(0, p - 1));
  }

  function goToNextPage() {
    setPage((p) => Math.min(totalPages - 1, p + 1));
  }

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

  function printReport() {
    window.print();
  }

  return {
    search,
    updateSearch,
    typeFilter,
    updateTypeFilter,
    filteredCount: filtered.length,
    pageRows,
    totalPages,
    clampedPage,
    goToPreviousPage,
    goToNextPage,
    exportCsv,
    printReport,
    refundTarget,
    setRefundTarget,
    chargeTarget,
    setChargeTarget,
  };
}
