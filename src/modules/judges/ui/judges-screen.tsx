'use client';

import { useState } from 'react';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import {
  EmptyState,
  FA_BTN_DANGER,
  FA_BTN_PRIMARY,
  FA_BTN_SMALL,
  FA_MUTED,
  FA_TABLE,
  FA_TABLE_WRAP,
  FA_TD,
  FA_TH,
  FA_THEAD_ROW,
  FA_TR,
  PageHeader,
  Pill,
  StatBox,
  StatGrid,
} from '@/shared/ui/organizer/fa-page';
import { useDeleteJudge } from '@/modules/judges/hooks/use-judge-mutations';
import { judgeStats, usefIdSourceInfo } from '@/modules/judges/utils/judge-display';
import { JudgeFormDialog } from '@/modules/judges/ui/judge-form-dialog';
import type { JudgeListItem } from '@/modules/judges/types';

export function JudgesScreen({ judges }: { judges: JudgeListItem[] }) {
  const stats = judgeStats(judges);
  const [dialog, setDialog] = useState<{ judge: JudgeListItem | null } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<JudgeListItem | null>(null);
  const del = useDeleteJudge({
    onSuccess: () => {
      setPendingDelete(null);
    },
  });

  return (
    <div className="text-ink-deep font-[family-name:var(--font-ar)]">
      <PageHeader
        eyebrow="Your organization's reusable judges"
        title="Judges"
        actions={
          <button
            type="button"
            className={FA_BTN_PRIMARY}
            onClick={() => {
              setDialog({ judge: null });
            }}
          >
            <span aria-hidden>+</span> Add judge
          </button>
        }
      />
      <p className={`${FA_MUTED} mb-4`}>
        Add a judge once, then bring them into any show from Users. Their USEF ID goes with them.
      </p>

      <StatGrid cols={4}>
        <StatBox label="Judges" value={stats.total} />
        <StatBox label="With a USEF ID" value={stats.withUsefId} tone="green" />
        <StatBox
          label="Missing a USEF ID"
          value={stats.missingUsefId}
          tone={stats.missingUsefId > 0 ? 'red' : 'default'}
        />
        <StatBox label="In an upcoming show" value={stats.inUpcomingShow} />
      </StatGrid>

      {judges.length === 0 ? (
        <EmptyState
          title="No judges yet"
          note="Add your first judge, or add one from a show's Users page and they will appear here."
        />
      ) : (
        <div className={FA_TABLE_WRAP}>
          <table className={FA_TABLE}>
            <thead>
              <tr className={FA_THEAD_ROW}>
                <th className={FA_TH}>Judge</th>
                <th className={FA_TH}>USEF ID</th>
                <th className={FA_TH}>Source</th>
                <th className={FA_TH}>Email · Phone</th>
                <th className={FA_TH}>Shows</th>
                <th className={FA_TH} />
              </tr>
            </thead>
            <tbody>
              {judges.map((judge) => {
                const source = usefIdSourceInfo(judge);
                return (
                  <tr key={judge.id} className={FA_TR}>
                    <td className={`${FA_TD} font-bold`}>{judge.name}</td>
                    <td className={FA_TD}>
                      {judge.usefId ?? <span className={FA_MUTED}>— missing</span>}
                    </td>
                    <td className={FA_TD}>
                      <Pill tone={source.tone}>{source.label}</Pill>
                    </td>
                    <td className={`${FA_TD} ${FA_MUTED}`}>
                      {[judge.email, judge.phone].filter(Boolean).join(' · ') || '—'}
                    </td>
                    <td className={FA_TD}>
                      {judge.shows.length === 0 ? (
                        <span className={FA_MUTED}>Not in a show yet</span>
                      ) : (
                        judge.shows.map((s) => s.name).join(', ')
                      )}
                    </td>
                    <td className={`${FA_TD} whitespace-nowrap`}>
                      <button
                        type="button"
                        className={FA_BTN_SMALL}
                        onClick={() => {
                          setDialog({ judge });
                        }}
                      >
                        Edit
                      </button>{' '}
                      <button
                        type="button"
                        className={FA_BTN_DANGER}
                        disabled={del.isPending}
                        onClick={() => {
                          setPendingDelete(judge);
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <JudgeFormDialog
        open={dialog !== null}
        judge={dialog?.judge ?? null}
        onClose={() => {
          setDialog(null);
        }}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title="Delete this judge?"
        description={
          pendingDelete?.shows.length
            ? `${pendingDelete.name} is on ${String(pendingDelete.shows.length)} show${pendingDelete.shows.length === 1 ? '' : 's'}. Remove them from those shows first, then delete them here.`
            : `${pendingDelete?.name ?? 'This judge'} will be removed from your list. This cannot be undone.`
        }
        confirmLabel="Delete"
        destructive
        pending={del.isPending}
        onConfirm={() => {
          if (pendingDelete?.shows.length === 0) del.mutate(pendingDelete.id);
          else setPendingDelete(null);
        }}
      />
    </div>
  );
}
