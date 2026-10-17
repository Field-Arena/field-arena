import Link from 'next/link';
import { cn } from '@/shared/lib/utils';
import { SHOW_STAGES } from '@/shared/constants/show-stages';

import { Card, Eyebrow, ScreenTitle, ScreenLede } from '@/shared/ui/organizer/card';
import { ghostButtonClass, primaryButtonClass } from '@/shared/ui/organizer/buttons';
import { DashIcon } from '@/shared/ui/dash-icon';
import { formatMoney } from '@/shared/lib/format/currency';
import type { InventoryRow, ShowListItem, ShowStats } from '@/modules/shows/data/queries';
import type { DashboardTodo, ShowDocumentSummary } from '@/modules/shows/types';
import { TodoList } from './todo-list';
import { DocumentStatusChips } from './document-status-chips';
import { STAGE_LABEL, whenLabel } from './dashboard-home';

export function DashboardOverview({
  orgName,
  shows,
  currentShow,
  stats,
  inventory,
  stage,
  rings,
  todos = [],
  documents = null,
  daysOut = null,
  canViewMoney,
}: {
  orgName: string;
  shows: ShowListItem[];
  currentShow: ShowListItem | null;
  stats: ShowStats | null;
  inventory: InventoryRow[];
  stage: string;
  rings: string[];

  todos?: DashboardTodo[];
  documents?: ShowDocumentSummary | null;
  daysOut?: number | null;
  canViewMoney: boolean;
}) {
  const currentIndex = SHOW_STAGES.findIndex((s) => s.key === stage);

  if (!currentShow || !stats) {
    return (
      <div className="text-ink-deep font-[family-name:var(--font-ar)]">
        <ScreenTitle>Dashboard</ScreenTitle>
        <ScreenLede>Everything across your shows, in one place.</ScreenLede>
        <Card className="p-[18px]">
          <p className="text-forest text-lg font-semibold">No shows yet</p>
          <p className="mt-1 text-[13.5px] text-[#5A6B63]">
            {orgName} has no shows on the platform. Create one to see entries, staffing and revenue
            here.
          </p>
        </Card>
      </div>
    );
  }

  const incompleteCount = shows.filter((s) => !s.published).length;

  return (
    <div className="text-ink-deep font-[family-name:var(--font-ar)]">
      <div className="mb-6">
        <h1 className="m-0 text-[32px] leading-tight font-extrabold text-[#0D2C23]">
          {currentShow.name}
        </h1>
        <p className="mt-1.5 mb-0 text-[16px] font-semibold text-[#16261F]">
          {[
            currentShow.dateLabel,
            currentShow.venueName,
            STAGE_LABEL[stage] ?? stage,
            whenLabel(daysOut),
          ]
            .filter(Boolean)
            .join(' · ') || 'No dates set yet'}
        </p>
      </div>

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border-[1.5px] border-[#C9D3CE] bg-white px-5 py-4">
          <div className="text-[14px] font-bold text-[#5A6B63]">Entries</div>
          <div className="mt-1 text-[34px] leading-none font-extrabold text-[#0D2C23]">
            {stats.entries}
          </div>
          <div className="mt-2 text-[13.5px] font-semibold text-[#5A6B63]">
            {stats.riders} riders · {stats.horses} horses
          </div>
        </div>
        <div className="rounded-2xl border-[1.5px] border-[#C9D3CE] bg-white px-5 py-4">
          <div className="text-[14px] font-bold text-[#5A6B63]">Revenue</div>
          <div className="mt-1 text-[34px] leading-none font-extrabold text-[#0D2C23]">
            {canViewMoney ? formatMoney(stats.settledRevenue) : '—'}
          </div>
          <div className="mt-2 text-[13.5px] font-semibold text-[#5A6B63]">
            {canViewMoney ? 'Collected so far' : 'Hidden for your role'}
          </div>
        </div>
        <div
          className={`rounded-2xl border-[1.5px] bg-white px-5 py-4 ${
            todos.length > 0 ? 'border-[#B4432F]' : 'border-[#C9D3CE]'
          }`}
        >
          <div className="text-[14px] font-bold text-[#5A6B63]">Open items</div>
          <div
            className={`mt-1 text-[34px] leading-none font-extrabold ${
              todos.length > 0 ? 'text-[#B4432F]' : 'text-[#0D2C23]'
            }`}
          >
            {todos.length}
          </div>
          {documents && (
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[14px] font-bold">
              {[
                {
                  label: 'Coggins',
                  done: documents.cogginsConfirmed,
                  total: documents.cogginsTotal,
                },
                { label: 'Waivers', done: documents.waiversSigned, total: documents.waiversTotal },
              ].map((c) => (
                <span
                  key={c.label}
                  className={c.done < c.total ? 'text-[#B4432F]' : 'text-[#1A5B3C]'}
                >
                  {c.label} {c.done}/{c.total}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mb-8 rounded-2xl border-[1.5px] border-[#C9D3CE] bg-white p-5">
        <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="m-0 text-[22px] font-extrabold text-[#0D2C23]">To-do</h2>
          {documents && <DocumentStatusChips documents={documents} />}
        </div>
        <TodoList todos={todos} />
      </div>

      <Eyebrow className="mb-2.5 block">Show lifecycle</Eyebrow>
      <Card className="mb-[18px] flex flex-wrap items-center gap-2.5 p-[14px_18px]">
        {SHOW_STAGES.map((s, i) => (
          <span key={s.key} className="contents">
            <span
              className={`inline-flex items-center gap-2 text-[13px] whitespace-nowrap ${
                i === currentIndex ? 'text-forest font-semibold' : 'text-[#5A6B63]'
              }`}
            >
              <span
                className={`size-2 rounded-full border ${
                  i <= currentIndex
                    ? 'border-[#3E8E5A] bg-[#3E8E5A]'
                    : 'border-[#D9E1DD] bg-transparent'
                }`}
              />
              {s.label}
            </span>
            {i < SHOW_STAGES.length - 1 && <span className="h-px min-w-6 flex-1 bg-[#E9EDEB]" />}
          </span>
        ))}
      </Card>

      <Card className="mb-[18px] p-[16px_18px_18px]">
        <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
          <span className="text-[15px] font-bold text-[#0D2C23]">Rings</span>
          <Link
            href={`/dashboard/awards?show=${currentShow.slug ?? currentShow.id}`}
            prefetch={false}
            className={ghostButtonClass}
          >
            <DashIcon name="trophy" size={14} /> Awards
          </Link>
        </div>

        {canViewMoney && stats.entryValue > 0 && stats.settledRevenue === 0 && (
          <p className="mb-4 text-[12.5px] text-pretty text-[#7C8A84]">
            The roster is worth {formatMoney(stats.entryValue)} at current class prices, but nothing
            has been collected — rider checkout is not migrated yet, so this is genuinely unpaid
            rather than missing.
          </p>
        )}

        {rings.length > 0 ? (
          <div className="flex items-stretch overflow-hidden rounded-[10px] border border-[#E9EDEB]">
            <span className="bg-forest text-gold px-4 py-2.5 font-mono text-sm font-bold whitespace-nowrap">
              {rings.length} ring{rings.length === 1 ? '' : 's'}
            </span>
            {rings.map((ring) => (
              <span
                key={ring}
                className="text-forest grid flex-1 place-items-center bg-[#F5F7F6] px-2.5 py-2.5 text-[12.5px] font-bold"
              >
                {ring}
              </span>
            ))}
          </div>
        ) : (
          <div className="rounded-[10px] border border-dashed border-[#E9EDEB] px-4 py-3 text-[12.5px] text-[#98A29D]">
            No rings running for this show.
          </div>
        )}
      </Card>

      {incompleteCount > 0 && (
        <Card className="mb-[18px] flex flex-wrap items-center gap-4 border-l-[3px] border-l-[#B4432F] p-[16px_18px]">
          <span className="text-[13.5px] text-[#48574F]">
            {incompleteCount} show{incompleteCount === 1 ? '' : 's'} still{' '}
            {incompleteCount === 1 ? 'needs' : 'need'} setup before they can open entries.
          </span>
          <Link
            href="/dashboard/shows/incomplete"
            prefetch={false}
            className={cn(ghostButtonClass, 'ml-auto')}
          >
            View incomplete shows →
          </Link>
        </Card>
      )}

      <div className="overflow-hidden rounded-[12px] border border-l-[3px] border-[#E9EDEB] border-l-[#1A5B3C]">
        <div className="p-[16px_18px_14px]">
          <div className="text-forest mb-[5px] font-[Newsreader,serif] text-[19px] font-semibold">
            {currentShow.name}
          </div>
          <div className="text-[12.5px] text-[#7A8781]">
            {[currentShow.dateLabel, currentShow.venueName].filter(Boolean).join(' · ')}
          </div>
        </div>

        <div className="border-t border-[#E9EDEB] px-[18px] py-3.5">
          <div className="mb-2 grid grid-cols-[minmax(0,1fr)_auto_auto] gap-3.5 text-[9.5px] font-bold tracking-[.14em] text-[#6E7C76] uppercase">
            <span>Purchases &amp; inventory</span>
            <span className="text-right">Qty</span>
            <span className="text-right">{canViewMoney ? 'Value' : ''}</span>
          </div>
          {inventory.map((row) => (
            <div
              key={row.name}
              className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3.5 border-t border-[#EFE9DB] py-2.5 text-[13.5px]"
            >
              <span className="text-ink-deep font-semibold">{row.name}</span>
              <span className="text-ink-deep text-right">{row.qty}</span>
              <span className="text-ink-deep text-right">
                {canViewMoney && (
                  <>
                    {formatMoney(row.revenue)}
                    {!row.settled && row.revenue > 0 && (
                      <span className="block text-[11.5px] font-normal text-[#98A29D]">
                        owed, not collected
                      </span>
                    )}
                  </>
                )}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4 border-t border-[#E9EDEB] bg-[#F5F7F6] px-[18px] py-3.5">
          <span className="text-[13px] text-[#5A6B63]">
            {currentShow.published
              ? 'This show is published and visible to riders.'
              : 'This show is not published — riders cannot see or enter it yet.'}
          </span>
          <Link
            href={`/dashboard/shows/${currentShow.slug ?? currentShow.id}`}
            prefetch={false}
            className={cn(primaryButtonClass, 'ml-auto')}
          >
            Open Show Manager
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M8 5v14l11-7z" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
