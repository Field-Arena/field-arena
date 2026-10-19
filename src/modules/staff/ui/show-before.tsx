import Link from 'next/link';
import { cn } from '@/shared/lib/utils';
import { formatMoney } from '@/shared/lib/format/currency';
import { FA_BTN, FA_BTN_PRIMARY, FaCard, StatBox } from '@/shared/ui/organizer/fa-page';
import type { ShowListItem } from '@/modules/shows/data/queries';
import type { ReadinessItem, ShowCockpit } from '@/modules/shows/data/show-cockpit-queries';
import { TodoList } from './todo-list';
import { approvalTone, percent, shortDate } from './dashboard-format';

const READY_ICON: Record<ReadinessItem['state'], { mark: string; dot: string; text: string }> = {
  done: { mark: '✓', dot: 'bg-[#1A5B3C] text-white', text: 'text-[#1A5B3C]' },
  warn: { mark: '!', dot: 'bg-[#E0A800] text-white', text: 'text-[#9A6B00]' },
  todo: { mark: '✕', dot: 'bg-[#B4432F] text-white', text: 'text-[#B4432F]' },
};

export function dateRange(start: string | null, end: string | null): string | null {
  const a = shortDate(start);
  const b = shortDate(end);
  if (!a) return null;
  return b && b !== a ? `${a} – ${b}` : a;
}

/* 'YYYY-MM-DD' optionally followed by ' HH:MM' or ' · HH:MM' → 'Oct 31, 12:00 PM'. */
function whenText(value: string | null): string | null {
  const day = shortDate(value);
  if (!value || !day) return value;
  const time = /(\d{1,2}):(\d{2})\s*$/.exec(value.slice(10));
  if (!time) return day;
  const h = Number(time[1]);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${day}, ${String(h12)}:${time[2] ?? '00'} ${h < 12 ? 'AM' : 'PM'}`;
}

/** Links into the rest of the workspace for one show. */
export function showLinks(ref: string) {
  const q = `?show=${encodeURIComponent(ref)}`;
  return [
    { label: 'Schedule', href: `/dashboard/schedule${q}` },
    { label: 'Riders', href: `/dashboard/riders${q}` },
    { label: 'Horses', href: `/dashboard/horses${q}` },
    { label: 'Vendors', href: `/dashboard/users${q}` },
    { label: 'Event Sales', href: `/dashboard/event-sales${q}` },
  ];
}

function PercentBox({ label, done, total }: { label: string; done: number; total: number }) {
  const pct = percent(done, total);
  const tone = approvalTone(pct);
  return (
    <div className="rounded-[12px] border-[1.5px] border-[#D9E1DD] bg-white px-4 py-3">
      <span className="block text-[12.5px] font-semibold text-[#5A6B63]">{label}</span>
      <span className={cn('block text-[26px] leading-tight font-bold', tone.text)}>
        {pct === null ? '—' : `${String(pct)}%`}
      </span>
      <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-[#EDF0EE]">
        <span
          className={cn('block h-full rounded-full', tone.bar)}
          style={{ width: `${String(pct ?? 0)}%` }}
        />
      </span>
      <span className="mt-1 block text-[12px] font-semibold text-[#5A6B63]">
        {total === 0 ? 'no entries yet' : `${String(done)} of ${String(total)}`}
      </span>
    </div>
  );
}

/* The show page from setup until the first day of the show: a countdown,
 * the key numbers, a readiness checklist and the prep to-do list. */
export function ShowBefore({
  show,
  cockpit,
  daysOut,
  canViewMoney,
}: {
  show: ShowListItem;
  cockpit: ShowCockpit;
  daysOut: number | null;
  canViewMoney: boolean;
}) {
  const ref = show.slug ?? show.id;
  const { detail, documents, tickets, readiness } = cockpit;
  const ready = readiness.filter((r) => r.state === 'done').length;
  const readyTone = approvalTone(percent(ready, readiness.length));
  const subline = [dateRange(show.startDate, show.endDate), show.venueName ?? detail.venue]
    .filter(Boolean)
    .join(' · ');
  const vendorRevenue = detail.vendors.revenue;

  return (
    <div className="text-ink-deep font-[family-name:var(--font-ar)]">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[13px] font-bold tracking-[.02em] text-[#5A6B63]">
            <span className="uppercase">Before the show</span>
            {subline ? ` · ${subline}` : ''}
          </p>
          <h1 className="mt-1 font-[family-name:var(--ws-fraunces)] text-[34px] leading-[1.1] font-bold text-[#0D2C23]">
            {show.name}
          </h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href={`/dashboard/shows/${ref}`} prefetch={false} className={FA_BTN_PRIMARY}>
              Show Manager setup
            </Link>
            {showLinks(ref).map((l) => (
              <Link key={l.label} href={l.href} prefetch={false} className={FA_BTN}>
                {l.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="min-w-[170px] rounded-[16px] bg-[#0D2C23] px-6 py-4 text-center text-white">
          <p className="font-[family-name:var(--ws-fraunces)] text-[44px] leading-none font-bold">
            {daysOut === null ? '—' : String(Math.max(daysOut, 0))}
          </p>
          <p className="mt-1 text-[13px] font-semibold text-[#DCE8E1]">
            {daysOut === null
              ? 'dates not set'
              : daysOut === 1
                ? 'day until the show'
                : 'days until the show'}
          </p>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatBox
          label="Entries"
          value={cockpit.entries}
          note={
            cockpit.newOrdersThisWeek > 0
              ? `+${String(cockpit.newOrdersThisWeek)} paid this week`
              : 'none new this week'
          }
        />
        <StatBox
          label="Riders · Horses"
          value={`${String(detail.riders)} · ${String(detail.horses)}`}
          note={`${String(detail.classes)} tests · ${String(detail.rings)} rings`}
        />
        <StatBox
          label="Revenue"
          value={canViewMoney ? formatMoney(cockpit.revenue) : '—'}
          note={
            canViewMoney
              ? vendorRevenue > 0
                ? `vendors ${formatMoney(vendorRevenue)}`
                : 'collected so far'
              : 'hidden for your role'
          }
        />
        <StatBox
          label="Ticket sales"
          tone={tickets.state === 'open' ? 'green' : tickets.state === 'closed' ? 'red' : 'default'}
          value={
            tickets.state === 'open'
              ? tickets.days === null
                ? 'Open'
                : `Open · ${String(tickets.days)}d left`
              : tickets.state === 'closed'
                ? 'Closed'
                : 'Not open'
          }
          note={
            tickets.state === 'not-open'
              ? detail.ticketOpen
                ? `opens ${whenText(detail.ticketOpen) ?? ''}`
                : 'no open date set'
              : detail.ticketClose
                ? `closes ${whenText(detail.ticketClose) ?? ''}`
                : 'no close date set'
          }
        />
        <PercentBox
          label="Waivers approved"
          done={documents.waiversSigned}
          total={documents.waiversTotal}
        />
        <PercentBox
          label="Coggins approved"
          done={documents.cogginsConfirmed}
          total={documents.cogginsTotal}
        />
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <FaCard className="p-[20px_22px]">
          <h2 className="font-[family-name:var(--ws-fraunces)] text-[22px] font-bold text-[#0D2C23]">
            Show readiness
          </h2>
          <p className="mt-1 flex items-baseline gap-3">
            <span className={cn('text-[30px] font-bold', readyTone.text)}>
              {ready} of {readiness.length}
            </span>
            <span className="text-[14px] font-semibold text-[#5A6B63]">ready for show day</span>
          </p>
          <div className="mt-2 mb-3 h-2.5 overflow-hidden rounded-full bg-[#EDF0EE]">
            <div
              className={cn('h-full rounded-full', readyTone.bar)}
              style={{ width: `${String(percent(ready, readiness.length) ?? 0)}%` }}
            />
          </div>
          <ul className="m-0 list-none p-0">
            {readiness.map((item, i) => {
              const icon = READY_ICON[item.state];
              return (
                <li
                  key={item.label}
                  className={cn(
                    'flex items-center gap-3 py-2.5 text-[15px]',
                    i > 0 && 'border-t border-[#EDF0EE]',
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      'grid size-[22px] flex-none place-items-center rounded-full text-[12px] font-extrabold',
                      icon.dot,
                    )}
                  >
                    {icon.mark}
                  </span>
                  <span className="flex-1 font-semibold text-[#0D2C23]">{item.label}</span>
                  <span className={cn('text-[13px] font-bold', icon.text)}>{item.status}</span>
                </li>
              );
            })}
          </ul>
        </FaCard>

        <FaCard className="p-[20px_22px]">
          <h2 className="mb-3 font-[family-name:var(--ws-fraunces)] text-[22px] font-bold text-[#0D2C23]">
            To-do before the show
          </h2>
          <TodoList todos={cockpit.todos} limit={6} />
        </FaCard>
      </div>
    </div>
  );
}
