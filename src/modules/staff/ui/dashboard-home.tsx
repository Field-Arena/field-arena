import Link from 'next/link';
import { NewShowButton } from '@/modules/shows/ui/show-manager/new-show-button';
import { formatMoney } from '@/shared/lib/format/currency';
import type {
  DashboardShowRow,
  DashboardTodo,
  ShowDocumentSummary,
  TicketSales,
} from '@/modules/shows/types';
import { ShowPicker } from './show-picker';

export interface HomeShow {
  show: DashboardShowRow;
  daysOut: number | null;
  entries: number | null;
  revenue: number;
  tickets: TicketSales;
  todos: DashboardTodo[];
  documents: ShowDocumentSummary;
}

export const STAGE_LABEL: Record<string, string> = {
  setup: 'Setup',
  'sales-open': 'Entries open',
  'sales-closed': 'Entries closed',
  live: 'Live',
  complete: 'Complete',
};

export function whenLabel(daysOut: number | null): string | null {
  if (daysOut === null) return null;
  if (daysOut <= 0) return 'Running now';
  return daysOut === 1 ? 'tomorrow' : `in ${String(daysOut)} days`;
}

const PRIORITY_BAR: Record<DashboardTodo['priority'], string> = {
  urgent: 'border-l-[#B4432F]',
  soon: 'border-l-[#C9A227]',
  later: 'border-l-[#C9D3CE]',
};

function shortDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(`${iso}T12:00:00`);
  return Number.isNaN(d.getTime())
    ? null
    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const plural = (n: number, word: string) => `${String(n)} ${word}${n === 1 ? '' : 's'}`;

/* Ticket sales row: a dot and Open/Closed on the left, days on the right. */
function TicketRow({ tickets }: { tickets: TicketSales }) {
  const { state, days } = tickets;
  const open = state === 'open';
  const closingSoon = open && days !== null && days <= 7;
  const tone = closingSoon
    ? 'border-[#E4B5AC] bg-[#FDEEEB]'
    : open
      ? 'border-[#BEDDCB] bg-[#E9F4EE]'
      : 'border-[#D9E1DD] bg-[#F5F7F6]';
  const right =
    state === 'open'
      ? days === null
        ? 'No close date'
        : days === 0
          ? 'Closes today'
          : `${plural(days, 'day')} left`
      : state === 'not-open'
        ? days === null
          ? 'Not open yet'
          : `opens in ${plural(days, 'day')}`
        : 'Sales ended';

  return (
    <div
      className={`mb-4 flex h-[46px] items-center justify-between rounded-[10px] border-[1.5px] px-3.5 ${tone}`}
    >
      <span
        className={`flex items-center gap-2.5 text-[14px] font-bold ${
          open ? 'text-[#1A5B3C]' : 'text-[#5A6B63]'
        }`}
      >
        <i
          className={`inline-block size-2.5 rounded-full ${open ? 'bg-[#1A5B3C]' : 'bg-[#98A29D]'}`}
        />
        {open ? 'Tickets open' : 'Tickets closed'}
      </span>
      <span
        className={`text-[14px] font-bold ${
          closingSoon ? 'text-[#98341F]' : open ? 'text-[#1A5B3C]' : 'text-[#3F4F48]'
        }`}
      >
        {right}
      </span>
    </div>
  );
}

/* Owner's colour scale for how much of a requirement is approved:
 * 50% or less red, 51–75% yellow, 76–90% light green, over 90% dark green.
 * Text uses a darker shade of each so it stays readable on white. */
export function approvalTone(pct: number | null): { text: string; bar: string } {
  if (pct === null) return { text: 'text-[#5A6B63]', bar: 'bg-[#EDF0EE]' };
  if (pct <= 50) return { text: 'text-[#B4432F]', bar: 'bg-[#B4432F]' };
  if (pct <= 75) return { text: 'text-[#9A6B00]', bar: 'bg-[#E0A800]' };
  if (pct <= 90) return { text: 'text-[#3E8E5A]', bar: 'bg-[#6CC08B]' };
  return { text: 'text-[#1A5B3C]', bar: 'bg-[#1A5B3C]' };
}

/* "Waivers approved 89% · 80 of 90" with a bar, coloured by approvalTone. */
function ApprovalStat({ label, done, total }: { label: string; done: number; total: number }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : null;
  const tone = approvalTone(pct);
  const color = tone.text;
  return (
    <div>
      <div className="text-[12.5px] font-semibold text-[#5A6B63]">{label}</div>
      <div className={`mt-0.5 text-[18px] font-bold ${color}`}>
        {pct === null ? '—' : `${String(pct)}%`}{' '}
        <span className="text-[13px] font-semibold">
          {pct === null ? 'no entries yet' : `· ${String(done)} of ${String(total)}`}
        </span>
      </div>
      <div className="mt-1.5 h-[7px] rounded bg-[#EDF0EE]">
        {pct !== null && (
          <i className={`block h-[7px] rounded ${tone.bar}`} style={{ width: `${String(pct)}%` }} />
        )}
      </div>
    </div>
  );
}

/** The organizer's landing view: three show boxes (soonest first), a picker
 * for any show, and one to-do list across all of them, soonest show first. */
export function DashboardHome({
  orgName,
  shows,
  upcomingShows,
  finishedShows,
  canViewMoney,
}: {
  orgName: string;
  shows: HomeShow[];
  upcomingShows: DashboardShowRow[];
  finishedShows: DashboardShowRow[];
  canViewMoney: boolean;
}) {
  if (shows.length === 0) {
    return (
      <section>
        <h1 className="m-0 text-[32px] font-bold text-[#0D2C23]">Your shows</h1>
        <div className="mt-5 rounded-2xl border-[1.5px] border-[#C9D3CE] bg-white p-6">
          <h2 className="m-0 text-[20px] font-bold text-[#0D2C23]">No current shows</h2>
          <p className="mt-1.5 mb-4 text-[15px] text-[#5A6B63]">
            {orgName} has nothing coming up. Create a show, or open a finished one below.
          </p>
          <NewShowButton />
        </div>
        {finishedShows.length > 0 && (
          <div className="mt-6">
            <ShowPicker upcoming={upcomingShows} finished={finishedShows} />
          </div>
        )}
      </section>
    );
  }

  // One list across every show: soonest show first, most urgent first within it.
  const allTodos = shows.flatMap(({ show, daysOut, todos }) =>
    todos.map((todo) => ({ todo, show, daysOut })),
  );

  return (
    <section>
      <div className="mb-[18px] flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="m-0 text-[32px] leading-tight font-bold text-[#0D2C23]">Your shows</h1>
          <p className="mt-1 mb-0 text-[14.5px] text-[#5A6B63]">
            Soonest on the left. Click a show to go into it.
          </p>
        </div>
        <NewShowButton />
      </div>

      <div className="grid gap-[18px] lg:grid-cols-3">
        {shows.map(({ show, daysOut, entries, revenue, tickets, documents }, i) => {
          const ref = show.slug ?? show.id;
          return (
            <Link
              key={show.id}
              href={`/dashboard?show=${ref}`}
              prefetch={false}
              className={`group block rounded-2xl border-[1.5px] bg-white p-5 no-underline transition hover:shadow-[0_10px_28px_-14px_rgba(16,40,32,.35)] ${
                i === 0 ? 'border-[#1A5B3C]' : 'border-[#C9D3CE] hover:border-[#1A5B3C]'
              }`}
            >
              <div className="text-[13px] font-semibold text-[#5A6B63]">
                {[show.dateLabel, whenLabel(daysOut)].filter(Boolean).join(' · ')}
              </div>
              <h2 className="mt-1 mb-3.5 text-[22px] leading-tight font-bold text-[#0D2C23]">
                {show.name}
              </h2>
              <TicketRow tickets={tickets} />
              <div className="grid grid-cols-2 gap-x-4 gap-y-3.5">
                <div>
                  <div className="text-[12.5px] font-semibold text-[#5A6B63]">Entries</div>
                  <div className="mt-0.5 text-[28px] leading-tight font-bold text-[#0D2C23]">
                    {entries ?? '—'}
                  </div>
                </div>
                <div>
                  <div className="text-[12.5px] font-semibold text-[#5A6B63]">Revenue</div>
                  <div className="mt-0.5 text-[28px] leading-tight font-bold text-[#0D2C23]">
                    {canViewMoney ? formatMoney(revenue) : '—'}
                  </div>
                </div>
                <ApprovalStat
                  label="Waivers approved"
                  done={documents.waiversSigned}
                  total={documents.waiversTotal}
                />
                <ApprovalStat
                  label="Coggins approved"
                  done={documents.cogginsConfirmed}
                  total={documents.cogginsTotal}
                />
              </div>
              <span className="mt-4 block text-[15px] font-extrabold text-[#1A5B3C] group-hover:underline">
                Enter show →
              </span>
            </Link>
          );
        })}
      </div>

      <div className="mt-[22px]">
        <ShowPicker upcoming={upcomingShows} finished={finishedShows} />
      </div>

      <h2 className="mt-7 mb-0.5 text-[24px] font-bold text-[#0D2C23]">To-do</h2>
      <p className="mt-0 mb-1 text-[14.5px] text-[#5A6B63]">
        Every open item across your shows, soonest show first.
      </p>
      {allTodos.length === 0 ? (
        <p className="mt-3 rounded-xl bg-[#E9F4EE] px-4 py-3 text-[15px] font-semibold text-[#1A5B3C]">
          ✓ Nothing open across your shows.
        </p>
      ) : (
        <ul className="m-0 list-none p-0">
          {allTodos.map(({ todo, show, daysOut }) => (
            <li
              key={`${show.id}-${todo.key}`}
              className={`mt-2.5 grid grid-cols-[86px_1fr_auto] items-center gap-4 rounded-xl border border-l-[6px] border-[#D9E1DD] bg-white px-4 py-3 ${PRIORITY_BAR[todo.priority]}`}
            >
              <div>
                <div className="text-[14px] font-bold text-[#0D2C23]">
                  {shortDate(show.startDate) ?? 'No date'}
                </div>
                <div className="text-[12px] text-[#5A6B63]">{whenLabel(daysOut) ?? ''}</div>
              </div>
              <div className="min-w-0">
                <div className="text-[15.5px] font-bold text-[#0D2C23]">
                  <span className="mr-2 inline-block max-w-[220px] truncate rounded-[7px] bg-[#EDF0EE] px-2.5 py-0.5 align-middle text-[11.5px] font-bold text-[#16261F]">
                    {show.name}
                  </span>
                  {todo.label}
                </div>
                <div className="mt-0.5 text-[13px] text-[#5A6B63]">{todo.detail}</div>
              </div>
              <Link
                href={todo.href}
                prefetch={false}
                className="inline-flex h-10 items-center rounded-[9px] border-2 border-[#1A5B3C] bg-white px-4 text-[14px] font-bold whitespace-nowrap text-[#1A5B3C] no-underline transition-colors hover:bg-[#1A5B3C] hover:text-white"
              >
                {todo.actionLabel}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
