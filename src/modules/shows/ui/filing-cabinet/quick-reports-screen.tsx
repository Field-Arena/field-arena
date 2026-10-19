'use client';

import { useState } from 'react';
import {
  Chip,
  ChipRow,
  EmptyState,
  FA_TABLE,
  FA_TABLE_WRAP,
  FA_TD,
  FA_TH,
  FA_THEAD_ROW,
  FA_TR,
} from '@/shared/ui/organizer/fa-page';
import { formatMoney } from '@/shared/lib/format/currency';
import { cn } from '@/shared/lib/utils';
import type { QuickReportsPageData } from '@/modules/shows/types';
import { CabinetSectionHead } from '@/modules/shows/ui/filing-cabinet/cabinet-section-head';

type Section = 'horses' | 'documents' | 'tests' | 'ribbons' | 'balances' | 'association';

const SECTIONS: { key: Section; label: string }[] = [
  { key: 'horses', label: 'Horses' },
  { key: 'documents', label: 'Unprocessed Documents' },
  { key: 'tests', label: 'Test Counts' },
  { key: 'ribbons', label: 'Ribbon Counts' },
  { key: 'balances', label: 'Entrant Balances' },
  { key: 'association', label: 'By Association' },
];

export function QuickReportsScreen({ data }: { data: QuickReportsPageData }) {
  const [section, setSection] = useState<Section>('horses');

  return (
    <div className="text-ink-deep font-[family-name:var(--font-ar)]">
      <CabinetSectionHead
        title="Quick reports"
        lede={
          <>
            Live snapshots for {data.showName} — pulled straight from the same records used
            everywhere else, not a separate spreadsheet.
          </>
        }
      />

      <ChipRow>
        {SECTIONS.map((s) => (
          <Chip
            key={s.key}
            active={section === s.key}
            onClick={() => {
              setSection(s.key);
            }}
          >
            {s.label}
          </Chip>
        ))}
      </ChipRow>

      {section === 'horses' && <HorsesSection data={data} />}
      {section === 'documents' && <DocumentsSection data={data} />}
      {section === 'tests' && <TestsSection data={data} />}
      {section === 'ribbons' && <RibbonsSection data={data} />}
      {section === 'balances' && <BalancesSection data={data} />}
      {section === 'association' && <AssociationSection data={data} />}
    </div>
  );
}

function Empty({ children }: { children: string }) {
  return <EmptyState title={children} />;
}

function HorsesSection({ data }: { data: QuickReportsPageData }) {
  const rows = data.horses.rows;
  if (rows.length === 0) return <Empty>No horses entered yet.</Empty>;
  return (
    <div className={FA_TABLE_WRAP}>
      <table className={FA_TABLE}>
        <caption className="sr-only">Horses entered in {data.showName}</caption>
        <thead>
          <tr className={FA_THEAD_ROW}>
            <th scope="col" className={FA_TH}>
              Horse
            </th>
            <th scope="col" className={FA_TH}>
              Rider(s)
            </th>
            <th scope="col" className={FA_TH}>
              Classes
            </th>
            <th scope="col" className={FA_TH}>
              Height
            </th>
            <th scope="col" className={FA_TH}>
              Farrier
            </th>
            <th scope="col" className={FA_TH}>
              Shared
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className={FA_TR}>
              <td className={cn(FA_TD, 'font-bold')}>{row.horseName}</td>
              <td className={FA_TD}>
                {row.riders.length > 0 ? row.riders.join(', ') : row.riderLabel}
              </td>
              <td className={FA_TD}>{row.classesCount}</td>
              <td className={FA_TD}>{row.height ?? '—'}</td>
              <td className={FA_TD}>{row.farrier ?? '—'}</td>
              <td className={FA_TD}>{row.isMultiEntry ? 'Yes' : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DocumentsSection({ data }: { data: QuickReportsPageData }) {
  const rows = data.horses.rows.flatMap((horse) =>
    horse.documents.filter((doc) => doc.status !== 'approved').map((doc) => ({ horse, doc })),
  );
  if (rows.length === 0) return <Empty>Nothing outstanding — every document is processed.</Empty>;
  return (
    <div className={FA_TABLE_WRAP}>
      <table className={FA_TABLE}>
        <caption className="sr-only">Unprocessed documents for {data.showName}</caption>
        <thead>
          <tr className={FA_THEAD_ROW}>
            <th scope="col" className={FA_TH}>
              Horse
            </th>
            <th scope="col" className={FA_TH}>
              Rider(s)
            </th>
            <th scope="col" className={FA_TH}>
              Item
            </th>
            <th scope="col" className={FA_TH}>
              Status
            </th>
            <th scope="col" className={FA_TH}>
              Reason
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ horse, doc }) => (
            <tr key={`${horse.key}-${doc.requirementId}`} className={FA_TR}>
              <td className={cn(FA_TD, 'font-bold')}>{horse.horseName}</td>
              <td className={FA_TD}>
                {horse.riders.length > 0 ? horse.riders.join(', ') : horse.riderLabel}
              </td>
              <td className={FA_TD}>{doc.label}</td>
              <td className={cn(FA_TD, 'capitalize')}>{doc.status.replace('_', ' ')}</td>
              <td className={FA_TD}>{doc.rejectionNote ?? doc.rejectionReason ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TestsSection({ data }: { data: QuickReportsPageData }) {
  const rows = data.testPrint.rows;
  if (rows.length === 0) return <Empty>No classes yet.</Empty>;
  return (
    <div className={FA_TABLE_WRAP}>
      <table className={FA_TABLE}>
        <caption className="sr-only">Test copy counts for {data.showName}</caption>
        <thead>
          <tr className={FA_THEAD_ROW}>
            <th scope="col" className={FA_TH}>
              Class
            </th>
            <th scope="col" className={FA_TH}>
              Test
            </th>
            <th scope="col" className={FA_TH}>
              Rides
            </th>
            <th scope="col" className={FA_TH}>
              Judges
            </th>
            <th scope="col" className={FA_TH}>
              Copies needed
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.classId} className={FA_TR}>
              <td className={cn(FA_TD, 'font-bold')}>{row.classLabel}</td>
              <td className={FA_TD}>
                {row.testName ?? '—'}
                {row.testEdition ? ` (${row.testEdition})` : ''}
              </td>
              <td className={FA_TD}>{row.rideCount}</td>
              <td className={FA_TD}>{row.judgeCount}</td>
              <td className={cn(FA_TD, 'font-bold')}>{row.totalCopies}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RibbonsSection({ data }: { data: QuickReportsPageData }) {
  const rows = data.ribbons.rows;
  if (rows.length === 0) return <Empty>No classes yet.</Empty>;
  return (
    <div className={FA_TABLE_WRAP}>
      <table className={FA_TABLE}>
        <caption className="sr-only">Ribbon counts for {data.showName}</caption>
        <thead>
          <tr className={FA_THEAD_ROW}>
            <th scope="col" className={FA_TH}>
              Group
            </th>
            <th scope="col" className={FA_TH}>
              Classes
            </th>
            <th scope="col" className={FA_TH}>
              Entries
            </th>
            <th scope="col" className={FA_TH}>
              Places
            </th>
            <th scope="col" className={FA_TH}>
              Ribbon sets
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.unitLabel} className={FA_TR}>
              <td className={cn(FA_TD, 'font-bold')}>{row.unitLabel}</td>
              <td className={FA_TD}>{row.classLabels.join(', ')}</td>
              <td className={FA_TD}>{row.entryCount}</td>
              <td className={FA_TD}>1st–{ordinal(row.ribbonPlaces)}</td>
              <td className={cn(FA_TD, 'font-bold')}>{row.ribbonSets}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BalancesSection({ data }: { data: QuickReportsPageData }) {
  const rows = data.ledger.rows.filter((row) => row.balance > 0);
  if (rows.length === 0) return <Empty>No outstanding balances.</Empty>;
  return (
    <div className={FA_TABLE_WRAP}>
      <table className={FA_TABLE}>
        <caption className="sr-only">Outstanding entrant balances for {data.showName}</caption>
        <thead>
          <tr className={FA_THEAD_ROW}>
            <th scope="col" className={FA_TH}>
              Entry #
            </th>
            <th scope="col" className={FA_TH}>
              Rider
            </th>
            <th scope="col" className={FA_TH}>
              Fees
            </th>
            <th scope="col" className={FA_TH}>
              Paid
            </th>
            <th scope="col" className={FA_TH}>
              Balance
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.showEntryId} className={FA_TR}>
              <td className={FA_TD}>{row.entryNumber}</td>
              <td className={cn(FA_TD, 'font-bold')}>{row.riderName}</td>
              <td className={FA_TD}>{formatMoney(row.fees)}</td>
              <td className={FA_TD}>{formatMoney(row.amountPaid)}</td>
              <td className={cn(FA_TD, 'font-bold')}>{formatMoney(row.balance)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AssociationSection({ data }: { data: QuickReportsPageData }) {
  const rows = data.byAssociation;
  if (rows.length === 0) return <Empty>No entries yet.</Empty>;
  return (
    <div className={FA_TABLE_WRAP}>
      <table className={FA_TABLE}>
        <caption className="sr-only">Revenue by association for {data.showName}</caption>
        <thead>
          <tr className={FA_THEAD_ROW}>
            <th scope="col" className={FA_TH}>
              Association
            </th>
            <th scope="col" className={FA_TH}>
              Entries
            </th>
            <th scope="col" className={FA_TH}>
              Fees
            </th>
            <th scope="col" className={FA_TH}>
              Paid
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.association} className={FA_TR}>
              <td className={cn(FA_TD, 'font-bold')}>{row.association}</td>
              <td className={FA_TD}>{row.entryCount}</td>
              <td className={FA_TD}>{formatMoney(row.fees)}</td>
              <td className={FA_TD}>{formatMoney(row.amountPaid)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${String(n)}${s[(v - 20) % 10] ?? s[v] ?? s[0] ?? 'th'}`;
}
