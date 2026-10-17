'use client';

import { cn } from '@/shared/lib/utils';
import {
  EmptyState,
  FA_TABLE,
  FA_TABLE_WRAP,
  FA_TD,
  FA_TH,
  FA_THEAD_ROW,
  FA_TR,
  Pill,
  type PillTone,
} from '@/shared/ui/organizer/fa-page';
import { formatTimestamp } from '@/shared/lib/format/date';
import type { IssuesPageData } from '@/modules/shows/data/entry-issues-queries';
import { AddNoteDialog } from '@/modules/shows/ui/filing-cabinet/add-note-dialog';
import { ResolveIssueDialog } from '@/modules/shows/ui/filing-cabinet/resolve-issue-dialog';
import { CabinetSectionHead } from '@/modules/shows/ui/filing-cabinet/cabinet-section-head';

const KIND_TONE: Record<string, PillTone> = {
  document: 'yellow',
  membership: 'red',
  number: 'blue',
  note: 'grey',
  request: 'purple',
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
      <CabinetSectionHead
        title="Issues, notes & requests"
        lede={
          <>
            Which entries at {showName} aren&apos;t ready, why, and what to fix. Resolving an issue
            clears it from this list but keeps the record.
          </>
        }
        actions={entries.length > 0 && <AddNoteDialog showId={showId} entries={entries} />}
      />

      {issues.length === 0 ? (
        <EmptyState
          title="Nothing open"
          note="Every flagged document, membership issue, or staff note has been resolved."
        />
      ) : (
        <div className={FA_TABLE_WRAP}>
          <table className={FA_TABLE}>
            <caption className="sr-only">Open issues for {showName}</caption>
            <thead>
              <tr className={FA_THEAD_ROW}>
                <th scope="col" className={FA_TH}>
                  Entry #
                </th>
                <th scope="col" className={FA_TH}>
                  Bridle #
                </th>
                <th scope="col" className={FA_TH}>
                  Rider / Horse
                </th>
                <th scope="col" className={FA_TH}>
                  Kind
                </th>
                <th scope="col" className={FA_TH}>
                  Issue
                </th>
                <th scope="col" className={FA_TH}>
                  Detail
                </th>
                <th scope="col" className={FA_TH}>
                  Logged
                </th>
                <th scope="col" className={FA_TH} />
              </tr>
            </thead>
            <tbody>
              {issues.map((issue) => (
                <tr key={issue.id} className={FA_TR}>
                  <td className={FA_TD}>{issue.entryNumber}</td>
                  <td className={FA_TD}>{issue.bridleNumber}</td>
                  <td className={FA_TD}>
                    <div className="font-bold">{issue.riderName}</div>
                    <div className="text-[12px] text-[#5A6B63]">{issue.horseName}</div>
                  </td>
                  <td className={FA_TD}>
                    <Pill tone={KIND_TONE[issue.kind]}>{KIND_LABEL[issue.kind]}</Pill>
                  </td>
                  <td className={cn(FA_TD, 'max-w-[220px] font-semibold')}>{issue.message}</td>
                  <td className={cn(FA_TD, 'max-w-[220px] text-[12.5px] text-[#5A6B63]')}>
                    {issue.detail ?? '—'}
                  </td>
                  <td className={cn(FA_TD, 'text-[12px] text-[#5A6B63]')}>
                    {formatTimestamp(issue.createdAt)}
                  </td>
                  <td className={FA_TD}>
                    <ResolveIssueDialog showId={showId} issue={issue} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
