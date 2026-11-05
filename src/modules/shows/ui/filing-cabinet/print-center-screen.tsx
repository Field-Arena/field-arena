'use client';

import { useMemo, useState } from 'react';
import { PrinterIcon } from 'lucide-react';
import {
  CardTitle,
  EmptyState,
  FA_BTN,
  FA_SELECT,
  FaCard,
  Pill,
} from '@/shared/ui/organizer/fa-page';
import type {
  EntryLedgerPageData,
  RingPacketPageData,
  TestPrintPageData,
} from '@/modules/shows/types';
import { EntryLedgerPrintView } from '@/modules/shows/ui/filing-cabinet/print/entry-ledger-print-view';
import { NumberCardsPrintView } from '@/modules/shows/ui/filing-cabinet/print/number-cards-print-view';
import { TestPrintView } from '@/modules/shows/ui/filing-cabinet/print/test-print-view';
import { RingPacketPrintView } from '@/modules/shows/ui/filing-cabinet/print/ring-packet-print-view';
import { BackNumberOfficeListPrintView } from '@/modules/shows/ui/filing-cabinet/print/back-number-office-list-print-view';
import { BackNumberCardsPanel } from '@/modules/shows/ui/filing-cabinet/back-number-cards-panel';
import { useMarkRingPacketPrinted } from '@/modules/shows/hooks/use-print-center-mutations';
import { CabinetSectionHead } from '@/modules/shows/ui/filing-cabinet/cabinet-section-head';

type PrintJob = 'ledger' | 'numberCards' | 'testCopies' | 'ringPacket' | 'officeNumberList';

export function PrintCenterScreen({
  data,
  testPrintData,
  ringPacketData,
}: {
  data: EntryLedgerPageData;
  testPrintData: TestPrintPageData | null;
  ringPacketData: RingPacketPageData | null;
}) {
  const { showId, showName, rows } = data;
  const backNumberRows = useMemo(() => rows.filter((r) => r.backNumber !== null), [rows]);
  const [job, setJob] = useState<PrintJob | null>(null);
  const [dayFilter, setDayFilter] = useState('');
  const [ringFilter, setRingFilter] = useState('');
  const [onlyChanged, setOnlyChanged] = useState(false);
  const markPrinted = useMarkRingPacketPrinted();

  const testRows = useMemo(() => testPrintData?.rows ?? [], [testPrintData]);
  const packetClasses = useMemo(() => ringPacketData?.classes ?? [], [ringPacketData]);
  const days = useMemo(
    () =>
      [...new Set([...testRows.map((r) => r.date), ...packetClasses.map((c) => c.date)])]
        .filter((d): d is string => !!d)
        .sort(),
    [testRows, packetClasses],
  );
  const rings = useMemo(
    () =>
      [...new Set([...testRows.map((r) => r.location), ...packetClasses.map((c) => c.location)])]
        .filter((l): l is string => !!l)
        .sort(),
    [testRows, packetClasses],
  );
  const filteredTestRows = useMemo(
    () =>
      testRows.filter(
        (r) => (!dayFilter || r.date === dayFilter) && (!ringFilter || r.location === ringFilter),
      ),
    [testRows, dayFilter, ringFilter],
  );
  const filteredPacketClasses = useMemo(
    () =>
      packetClasses.filter(
        (c) =>
          (!dayFilter || c.date === dayFilter) &&
          (!ringFilter || c.location === ringFilter) &&
          (!onlyChanged || c.needsReprint),
      ),
    [packetClasses, dayFilter, ringFilter, onlyChanged],
  );

  function runPrint(next: PrintJob) {
    setJob(next);
    if (next === 'ringPacket' && ringPacketData && filteredPacketClasses.length > 0) {
      markPrinted.mutate({
        showId: ringPacketData.showId,
        classIds: filteredPacketClasses.map((c) => c.classId),
      });
    }
    // Let the print-only view render before the print dialog opens.
    requestAnimationFrame(() => {
      window.print();
    });
  }

  return (
    <div className="text-ink-deep font-[family-name:var(--font-ar)]">
      <CabinetSectionHead
        className="print:hidden"
        title="Print center"
        lede={<>Print the entry ledger or entry/bridle/back number cards for {showName}.</>}
      />

      {rows.length === 0 ? (
        <div className="print:hidden">
          <EmptyState title="Nothing to print yet" note="Entries appear once riders check out." />
        </div>
      ) : (
        <div className="flex flex-wrap gap-3 print:hidden">
          <button
            type="button"
            className={FA_BTN}
            onClick={() => {
              runPrint('ledger');
            }}
          >
            <PrinterIcon className="size-4" aria-hidden />
            Print Entry Ledger ({rows.length})
          </button>
          <button
            type="button"
            className={FA_BTN}
            onClick={() => {
              runPrint('numberCards');
            }}
          >
            <PrinterIcon className="size-4" aria-hidden />
            Print Number Cards ({rows.length})
          </button>
        </div>
      )}

      {testRows.length > 0 && (
        <FaCard className="mt-4 print:hidden">
          <CardTitle className="mb-3 text-[17px]">Test copy counts</CardTitle>
          <div className="mb-3 flex flex-wrap gap-3">
            <select
              value={dayFilter}
              onChange={(e) => {
                setDayFilter(e.target.value);
              }}
              className={FA_SELECT}
              aria-label="Filter by day"
            >
              <option value="">All days</option>
              {days.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <select
              value={ringFilter}
              onChange={(e) => {
                setRingFilter(e.target.value);
              }}
              className={FA_SELECT}
              aria-label="Filter by ring"
            >
              <option value="">All rings</option>
              {rings.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            className={FA_BTN}
            onClick={() => {
              runPrint('testCopies');
            }}
          >
            <PrinterIcon className="size-4" aria-hidden />
            Print Test Copy Counts ({filteredTestRows.length})
          </button>
        </FaCard>
      )}

      {packetClasses.length > 0 && (
        <FaCard className="mt-4 print:hidden">
          <CardTitle className="mb-3 text-[17px]">Ring packet — rides in order</CardTitle>
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <select
              value={dayFilter}
              onChange={(e) => {
                setDayFilter(e.target.value);
              }}
              className={FA_SELECT}
              aria-label="Filter by day"
            >
              <option value="">All days</option>
              {days.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <select
              value={ringFilter}
              onChange={(e) => {
                setRingFilter(e.target.value);
              }}
              className={FA_SELECT}
              aria-label="Filter by ring"
            >
              <option value="">All rings</option>
              {rings.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-1.5 text-[13px] font-semibold text-[#5A6B63]">
              <input
                type="checkbox"
                checked={onlyChanged}
                onChange={(e) => {
                  setOnlyChanged(e.target.checked);
                }}
              />
              Only classes changed since last print
            </label>
          </div>

          <ul className="mb-3 flex flex-col gap-1 text-[12.5px] text-[#5A6B63]">
            {filteredPacketClasses.map((c) => (
              <li key={c.classId} className="flex items-center gap-2">
                <span>{c.classLabel}</span>
                {c.needsReprint && <Pill tone="yellow">needs reprint</Pill>}
              </li>
            ))}
          </ul>

          <button
            type="button"
            className={FA_BTN}
            disabled={markPrinted.isPending}
            onClick={() => {
              runPrint('ringPacket');
            }}
          >
            <PrinterIcon className="size-4" aria-hidden />
            Print Ring Packet ({filteredPacketClasses.length} class
            {filteredPacketClasses.length === 1 ? '' : 'es'})
          </button>
        </FaCard>
      )}

      {backNumberRows.length > 0 && (
        <FaCard className="mt-4 print:hidden">
          <CardTitle className="mb-3 text-[17px]">Rider back numbers</CardTitle>
          <BackNumberCardsPanel showId={showId} rows={backNumberRows} />
          <button
            type="button"
            className={FA_BTN}
            onClick={() => {
              runPrint('officeNumberList');
            }}
          >
            <PrinterIcon className="size-4" aria-hidden />
            Print office list ({backNumberRows.length})
          </button>
        </FaCard>
      )}

      {job === 'ledger' && <EntryLedgerPrintView showName={showName} rows={rows} />}
      {job === 'numberCards' && <NumberCardsPrintView showName={showName} rows={rows} />}
      {job === 'testCopies' && <TestPrintView showName={showName} rows={filteredTestRows} />}
      {job === 'ringPacket' && (
        <RingPacketPrintView showName={showName} classes={filteredPacketClasses} />
      )}
      {job === 'officeNumberList' && (
        <BackNumberOfficeListPrintView showName={showName} rows={backNumberRows} />
      )}
    </div>
  );
}
