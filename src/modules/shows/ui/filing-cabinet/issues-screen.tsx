'use client';

import { ScreenTitle, ScreenLede, Card } from '@/shared/ui/organizer/card';
import { StatusBadge, type StatusTone } from '@/shared/ui/status-badge';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/shadcn/table';
import { formatTimestamp } from '@/shared/lib/format/date';
import type { IssuesPageData } from '@/modules/shows/data/entry-issues-queries';
import { AddNoteDialog } from '@/modules/shows/ui/filing-cabinet/add-note-dialog';
import { ResolveIssueDialog } from '@/modules/shows/ui/filing-cabinet/resolve-issue-dialog';

const KIND_TONE: Record<string, StatusTone> = {
  document: 'warn',
  membership: 'danger',
  number: 'info',
  note: 'neutral',
  request: 'info',
};

const KIND_LABEL: Record<string, string> = {
  document: 'Document',
  membership: 'Membership',
  number: 'Number',
  note: 'Note',
  request: 'Request',
};

export function IssuesScreen({ data }: { data: IssuesPageData }) {
  const { showId, showName, issues, entries } = data;

  return (
    <div className="text-ink-deep font-[family-name:var(--font-ar)]">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <ScreenTitle className="mb-1.5">Issues / Notes / Requests</ScreenTitle>
          <ScreenLede className="mb-0">
            Which entries at {showName} aren&apos;t ready, why, and what to fix. Resolving an
            issue clears it from this list but keeps the record.
          </ScreenLede>
        </div>
        {entries.length > 0 && <AddNoteDialog showId={showId} entries={entries} />}
      </div>

      {issues.length === 0 ? (
        <Card className="p-[18px_20px_20px]">
          <p className="py-8 text-center text-[13.5px] text-[#7A8781] italic">
            Nothing open — every flagged document, membership issue, or staff note has been
            resolved.
          </p>
        </Card>
      ) : (
        <Card className="overflow-x-auto p-0">
          <Table>
            <TableCaption className="sr-only">Open issues for {showName}</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Entry #</TableHead>
                <TableHead scope="col">Bridle #</TableHead>
                <TableHead scope="col">Rider / Horse</TableHead>
                <TableHead scope="col">Kind</TableHead>
                <TableHead scope="col">Issue</TableHead>
                <TableHead scope="col">Detail</TableHead>
                <TableHead scope="col">Logged</TableHead>
                <TableHead scope="col" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {issues.map((issue) => (
                <TableRow key={issue.id}>
                  <TableCell>{issue.entryNumber}</TableCell>
                  <TableCell>{issue.bridleNumber}</TableCell>
                  <TableCell>
                    <div className="font-semibold">{issue.riderName}</div>
                    <div className="text-[12px] text-[#7A8781]">{issue.horseName}</div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge tone={KIND_TONE[issue.kind]}>{KIND_LABEL[issue.kind]}</StatusBadge>
                  </TableCell>
                  <TableCell className="max-w-[220px] font-semibold">{issue.message}</TableCell>
                  <TableCell className="max-w-[220px] text-[12.5px] text-[#5A6B63]">
                    {issue.detail ?? '—'}
                  </TableCell>
                  <TableCell className="text-[12px] text-[#7A8781]">
                    {formatTimestamp(issue.createdAt)}
                  </TableCell>
                  <TableCell>
                    <ResolveIssueDialog showId={showId} issue={issue} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
