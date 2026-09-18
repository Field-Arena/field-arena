'use client';

import { useState } from 'react';
import { ScreenTitle, ScreenLede, Card } from '@/shared/ui/organizer/card';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/shadcn/table';
import { formatMoney } from '@/shared/lib/format/currency';
import { cn } from '@/shared/lib/utils';
import type { QuickReportsPageData } from '@/modules/shows/data/quick-reports-queries';

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
      <ScreenTitle className="mb-1.5">Quick Reports</ScreenTitle>
      <ScreenLede className="mb-5">
        Live snapshots for {data.showName} — pulled straight from the same records used
        everywhere else, not a separate spreadsheet.
      </ScreenLede>

      <div className="mb-[22px] flex flex-nowrap items-center gap-1 overflow-x-auto rounded-full border border-[#E9EDEB] bg-[#F4F7F5] p-1">
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => {
              setSection(s.key);
            }}
            className={cn(
              'flex-none rounded-full px-3.5 py-[9px] text-[13.5px] font-medium whitespace-nowrap transition-colors',
              section === s.key
                ? 'bg-forest font-bold text-white shadow-sm'
                : 'text-[#6E7C76] hover:bg-white hover:text-[#2B3B33]',
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {section === 'horses' && <HorsesSection data={data} />}
      {section === 'documents' && <DocumentsSection data={data} />}
      {section === 'tests' && <TestsSection data={data} />}
      {section === 'ribbons' && <RibbonsSection data={data} />}
      {section === 'balances' && <BalancesSection data={data} />}
      {section === 'association' && <AssociationSection data={data} />}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <Card className="p-[18px_20px_20px]">
      <p className="py-8 text-center text-[13.5px] text-[#7A8781] italic">{children}</p>
    </Card>
  );
}

function HorsesSection({ data }: { data: QuickReportsPageData }) {
  const rows = data.horses.rows;
  if (rows.length === 0) return <Empty>No horses entered yet.</Empty>;
  return (
    <Card className="overflow-x-auto p-0">
      <Table>
        <TableCaption className="sr-only">Horses entered in {data.showName}</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Horse</TableHead>
            <TableHead scope="col">Rider(s)</TableHead>
            <TableHead scope="col">Classes</TableHead>
            <TableHead scope="col">Height</TableHead>
            <TableHead scope="col">Farrier</TableHead>
            <TableHead scope="col">Shared</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.key}>
              <TableCell className="font-semibold">{row.horseName}</TableCell>
              <TableCell>{row.riders.length > 0 ? row.riders.join(', ') : row.riderLabel}</TableCell>
              <TableCell>{row.classesCount}</TableCell>
              <TableCell>{row.height ?? '—'}</TableCell>
              <TableCell>{row.farrier ?? '—'}</TableCell>
              <TableCell>{row.isMultiEntry ? 'Yes' : '—'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

function DocumentsSection({ data }: { data: QuickReportsPageData }) {
  const rows = data.horses.rows.flatMap((horse) =>
    horse.documents
      .filter((doc) => doc.status !== 'approved')
      .map((doc) => ({ horse, doc })),
  );
  if (rows.length === 0) return <Empty>Nothing outstanding — every document is processed.</Empty>;
  return (
    <Card className="overflow-x-auto p-0">
      <Table>
        <TableCaption className="sr-only">Unprocessed documents for {data.showName}</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Horse</TableHead>
            <TableHead scope="col">Rider(s)</TableHead>
            <TableHead scope="col">Item</TableHead>
            <TableHead scope="col">Status</TableHead>
            <TableHead scope="col">Reason</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ horse, doc }) => (
            <TableRow key={`${horse.key}-${doc.requirementId}`}>
              <TableCell className="font-semibold">{horse.horseName}</TableCell>
              <TableCell>{horse.riders.length > 0 ? horse.riders.join(', ') : horse.riderLabel}</TableCell>
              <TableCell>{doc.label}</TableCell>
              <TableCell className="capitalize">{doc.status.replace('_', ' ')}</TableCell>
              <TableCell>{doc.rejectionNote ?? doc.rejectionReason ?? '—'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

function TestsSection({ data }: { data: QuickReportsPageData }) {
  const rows = data.testPrint.rows;
  if (rows.length === 0) return <Empty>No classes yet.</Empty>;
  return (
    <Card className="overflow-x-auto p-0">
      <Table>
        <TableCaption className="sr-only">Test copy counts for {data.showName}</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Class</TableHead>
            <TableHead scope="col">Test</TableHead>
            <TableHead scope="col">Rides</TableHead>
            <TableHead scope="col">Judges</TableHead>
            <TableHead scope="col">Copies needed</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.classId}>
              <TableCell className="font-semibold">{row.classLabel}</TableCell>
              <TableCell>
                {row.testName ?? '—'}
                {row.testEdition ? ` (${row.testEdition})` : ''}
              </TableCell>
              <TableCell>{row.rideCount}</TableCell>
              <TableCell>{row.judgeCount}</TableCell>
              <TableCell className="font-semibold">{row.totalCopies}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

function RibbonsSection({ data }: { data: QuickReportsPageData }) {
  const rows = data.ribbons.rows;
  if (rows.length === 0) return <Empty>No classes yet.</Empty>;
  return (
    <Card className="overflow-x-auto p-0">
      <Table>
        <TableCaption className="sr-only">Ribbon counts for {data.showName}</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Group</TableHead>
            <TableHead scope="col">Classes</TableHead>
            <TableHead scope="col">Entries</TableHead>
            <TableHead scope="col">Places</TableHead>
            <TableHead scope="col">Ribbon sets</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.unitLabel}>
              <TableCell className="font-semibold">{row.unitLabel}</TableCell>
              <TableCell>{row.classLabels.join(', ')}</TableCell>
              <TableCell>{row.entryCount}</TableCell>
              <TableCell>1st–{ordinal(row.ribbonPlaces)}</TableCell>
              <TableCell className="font-semibold">{row.ribbonSets}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

function BalancesSection({ data }: { data: QuickReportsPageData }) {
  const rows = data.ledger.rows.filter((row) => row.balance > 0);
  if (rows.length === 0) return <Empty>No outstanding balances.</Empty>;
  return (
    <Card className="overflow-x-auto p-0">
      <Table>
        <TableCaption className="sr-only">Outstanding entrant balances for {data.showName}</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Entry #</TableHead>
            <TableHead scope="col">Rider</TableHead>
            <TableHead scope="col">Fees</TableHead>
            <TableHead scope="col">Paid</TableHead>
            <TableHead scope="col">Balance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.showEntryId}>
              <TableCell>{row.entryNumber}</TableCell>
              <TableCell className="font-semibold">{row.riderName}</TableCell>
              <TableCell>{formatMoney(row.fees)}</TableCell>
              <TableCell>{formatMoney(row.amountPaid)}</TableCell>
              <TableCell className="font-semibold">{formatMoney(row.balance)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

function AssociationSection({ data }: { data: QuickReportsPageData }) {
  const rows = data.byAssociation;
  if (rows.length === 0) return <Empty>No entries yet.</Empty>;
  return (
    <Card className="overflow-x-auto p-0">
      <Table>
        <TableCaption className="sr-only">Revenue by association for {data.showName}</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Association</TableHead>
            <TableHead scope="col">Entries</TableHead>
            <TableHead scope="col">Fees</TableHead>
            <TableHead scope="col">Paid</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.association}>
              <TableCell className="font-semibold">{row.association}</TableCell>
              <TableCell>{row.entryCount}</TableCell>
              <TableCell>{formatMoney(row.fees)}</TableCell>
              <TableCell>{formatMoney(row.amountPaid)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${String(n)}${s[(v - 20) % 10] ?? s[v] ?? s[0] ?? 'th'}`;
}
