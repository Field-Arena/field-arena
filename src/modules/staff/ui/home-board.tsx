'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatMoney } from '@/shared/lib/format/currency';
import type {
  DashboardShowRow,
  DashboardTodo,
  ShowDocumentSummary,
  ShowPanelDetail,
  TicketSales,
} from '@/modules/shows/types';
import { approvalTone, percent, shortDate, whenLabel } from './dashboard-format';
import { ShowPicker } from './show-picker';

export interface HomeShow {
  show: DashboardShowRow;
  daysOut: number | null;
  entries: number | null;
  revenue: number;
  tickets: TicketSales;
  todos: DashboardTodo[];
  documents: ShowDocumentSummary;
  detail: ShowPanelDetail;
}

const plural = (n: number, word: string) =>
  `${String(n)} ${n === 1 ? word : /(s|ss|x|ch|sh)$/.test(word) ? `${word}es` : `${word}s`}`;

/* 'YYYY-MM-DD' → 'Sat'. */
function weekdayShort(iso: string | null): string | null {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  return new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short' });
}

const PRIORITY: Record<DashboardTodo['priority'], { label: string; pill: string; bar: string }> = {
  urgent: { label: 'URGENT', pill: 'bg-[#B4432F] text-white', bar: 'border-l-[#B4432F]' },
  soon: { label: 'SOON', pill: 'bg-[#FCF3E4] text-[#8A6D14]', bar: 'border-l-[#C9A227]' },
  later: { label: 'LATER', pill: 'bg-[#EDF0EE] text-[#5A6B63]', bar: 'border-l-[#C9D3CE]' },
};

const actionBtn =
  'inline-flex h-10 items-center rounded-[9px] border-2 border-[#1A5B3C] bg-white px-4 text-[14px] font-bold whitespace-nowrap text-[#1A5B3C] no-underline transition-colors hover:bg-[#1A5B3C] hover:text-white';

/* Ticket sales row: a dot and Open/Closed on the left, days on the right. */
function TicketRow({ tickets, compact }: { tickets: TicketSales; compact?: boolean }) {
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
      className={`flex items-center justify-between rounded-[10px] border-[1.5px] px-3 ${
        compact ? 'mb-2.5 h-10' : 'mb-4 h-[46px]'
      } ${tone}`}
    >
      <span
        className={`flex items-center gap-2 text-[13px] font-bold ${open ? 'text-[#1A5B3C]' : 'text-[#5A6B63]'}`}
      >
        <i
          className={`inline-block size-[9px] rounded-full ${open ? 'bg-[#1A5B3C]' : 'bg-[#98A29D]'}`}
        />
        {open ? 'Tickets open' : 'Tickets closed'}
      </span>
      <span
        className={`text-[13px] font-bold ${
          closingSoon ? 'text-[#98341F]' : open ? 'text-[#1A5B3C]' : 'text-[#3F4F48]'
        }`}
      >
        {right}
      </span>
    </div>
  );
}

function TodoRow({
  todo,
  show,
  daysOut,
}: {
  todo: DashboardTodo;
  show?: DashboardShowRow;
  daysOut?: number | null;
}) {
  const p = PRIORITY[todo.priority];
  return (
    <li
      className={`mt-2.5 grid items-center gap-4 rounded-xl border border-l-[6px] border-[#D9E1DD] bg-white px-4 py-3 ${p.bar} ${
        show ? 'grid-cols-[86px_1fr_auto]' : 'grid-cols-[1fr_auto]'
      }`}
    >
      {show && (
        <div>
          <div className="text-[14px] font-bold text-[#0D2C23]">
            {shortDate(show.startDate) ?? 'No date'}
          </div>
          <div className="text-[12px] text-[#5A6B63]">{whenLabel(daysOut ?? null) ?? ''}</div>
        </div>
      )}
      <div className="min-w-0">
        <div className="text-[15.5px] font-bold text-[#0D2C23]">
          {show ? (
            <span className="mr-2 inline-block max-w-[220px] truncate rounded-[7px] bg-[#EDF0EE] px-2.5 py-0.5 align-middle text-[11.5px] font-bold text-[#16261F]">
              {show.name}
            </span>
          ) : (
            <span
              className={`mr-2 inline-block rounded-[7px] px-2.5 py-0.5 align-middle text-[11px] font-extrabold tracking-wide ${p.pill}`}
            >
              {p.label}
            </span>
          )}
          {todo.label}
        </div>
        <div className="mt-0.5 text-[13px] text-[#5A6B63]">{todo.detail}</div>
      </div>
      <Link href={todo.href} prefetch={false} className={actionBtn}>
        {todo.actionLabel}
      </Link>
    </li>
  );
}

function Breakdown({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; value: string; tone: string }[];
}) {
  return (
    <div className="rounded-xl border-[1.5px] border-[#D9E1DD] px-4 py-3.5">
      <h4 className="m-0 mb-2 text-[16px] font-bold text-[#0D2C23]">{title}</h4>
      {rows.map((r) => (
        <div
          key={r.label}
          className="flex items-center justify-between border-b border-[#EDF0EE] py-1.5 text-[14px] font-semibold text-[#16261F] last:border-b-0"
        >
          <span>{r.label}</span>
          <span className={`rounded-[7px] px-2.5 py-0.5 text-[12.5px] font-bold ${r.tone}`}>
            {r.value}
          </span>
        </div>
      ))}
    </div>
  );
}

const GOOD = 'bg-[#E9F4EE] text-[#1A5B3C]';
const WAIT = 'bg-[#FCF3E4] text-[#8A6D14]';
const BAD = 'bg-[#FDEEEB] text-[#98341F]';
const NEUTRAL = 'bg-[#EDF0EE] text-[#3F4F48]';
const toneIf = (n: number, bad: string) => (n > 0 ? bad : NEUTRAL);

/* The expanded panel for the selected show: details, breakdowns, its to-dos. */
function ShowPanel({
  item,
  canViewMoney,
  onClose,
}: {
  item: HomeShow;
  canViewMoney: boolean;
  onClose: () => void;
}) {
  const { show, daysOut, entries, revenue, tickets, documents: d, detail, todos } = item;
  const ref = show.slug ?? show.id;
  const waiverPct = percent(d.waiversSigned, d.waiversTotal);
  const cogginsPct = percent(d.cogginsConfirmed, d.cogginsTotal);
  const wTone = approvalTone(waiverPct);
  const cTone = approvalTone(cogginsPct);
  const ticketWord =
    tickets.state === 'open' ? 'Open' : tickets.state === 'not-open' ? 'Not on sale' : 'Closed';
  const ticketSub =
    tickets.state === 'open'
      ? shortDate(detail.ticketClose)
        ? `closes ${shortDate(detail.ticketClose) ?? ''}`
        : 'no close date'
      : tickets.state === 'not-open'
        ? shortDate(detail.ticketOpen)
          ? `opens ${shortDate(detail.ticketOpen) ?? ''}`
          : 'no open date'
        : shortDate(detail.ticketClose)
          ? `ended ${shortDate(detail.ticketClose) ?? ''}`
          : 'sales ended';
  const v = detail.vendors;
  const booked = v.paid + v.approvedUnpaid;

  const kpi = 'rounded-xl border-[1.5px] border-[#D9E1DD] px-3.5 py-3';
  const kl = 'text-[12.5px] font-semibold text-[#5A6B63]';
  const kn = 'mt-0.5 text-[26px] leading-tight font-bold';
  const ks = 'mt-0.5 text-[12px] font-semibold text-[#5A6B63]';

  return (
    <div className="mt-[22px] rounded-[18px] border-[2.5px] border-[#1A5B3C] bg-white px-6 py-[22px]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[12.5px] font-semibold text-[#5A6B63]">
            {[show.dateLabel, detail.venue, whenLabel(daysOut)].filter(Boolean).join(' · ')}
          </div>
          <h2 className="mt-1 mb-0 text-[28px] leading-tight font-bold text-[#0D2C23]">
            {show.name}
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/dashboard?show=${ref}`}
            prefetch={false}
            className="inline-flex h-10 items-center rounded-[9px] border-2 border-[#1A5B3C] bg-[#1A5B3C] px-4 text-[14px] font-bold text-white no-underline"
          >
            Open full show →
          </Link>
          {[
            ['Schedule', `/dashboard/schedule?show=${ref}`],
            ['Riders', `/dashboard/riders?show=${ref}`],
            ['Horses', `/dashboard/horses?show=${ref}`],
            ['Vendors', `/dashboard/users?show=${ref}`],
          ].map(([label, href]) => (
            <Link key={label} href={href ?? '#'} prefetch={false} className={actionBtn}>
              {label}
            </Link>
          ))}
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 cursor-pointer items-center rounded-[9px] border-[1.5px] border-[#C9D3CE] bg-white px-3 text-[13px] font-bold text-[#5A6B63]"
          >
            ✕ Close
          </button>
        </div>
      </div>

      <div className="my-[18px] grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <div className={kpi}>
          <div className={kl}>Tests</div>
          <div className={`${kn} text-[#0D2C23]`}>{detail.tests.length}</div>
          <div className={ks}>
            offered · {plural(detail.rings, 'ring')}
            {detail.testDays > 0 ? ` · ${plural(detail.testDays, 'day')}` : ''}
          </div>
        </div>
        <div className={kpi}>
          <div className={kl}>Entries</div>
          <div className={`${kn} text-[#0D2C23]`}>{entries ?? '—'}</div>
          <div className={ks}>
            {plural(detail.riders, 'rider')} · {plural(detail.horses, 'horse')}
          </div>
        </div>
        <div className={kpi}>
          <div className={kl}>Revenue</div>
          <div className={`${kn} text-[#0D2C23]`}>{canViewMoney ? formatMoney(revenue) : '—'}</div>
          <div className={ks}>{canViewMoney ? 'collected' : 'hidden for your role'}</div>
        </div>
        <div className={kpi}>
          <div className={kl}>Tickets</div>
          <div className="mt-[7px] text-[20px] font-bold text-[#0D2C23]">{ticketWord}</div>
          <div className={ks}>{ticketSub}</div>
        </div>
        <div className={kpi}>
          <div className={kl}>Waivers approved</div>
          <div className={`${kn} ${wTone.text}`}>
            {waiverPct === null ? '—' : `${String(waiverPct)}%`}
          </div>
          <div className="mt-1.5 h-[7px] rounded bg-[#EDF0EE]">
            {waiverPct !== null && (
              <i
                className={`block h-[7px] rounded ${wTone.bar}`}
                style={{ width: `${String(waiverPct)}%` }}
              />
            )}
          </div>
          <div className={`mt-1 text-[12px] font-semibold ${wTone.text}`}>
            {d.waiversTotal > 0
              ? `${String(d.waiversSigned)} of ${String(d.waiversTotal)}`
              : 'no entries yet'}
          </div>
        </div>
        <div className={kpi}>
          <div className={kl}>Coggins approved</div>
          <div className={`${kn} ${cTone.text}`}>
            {cogginsPct === null ? '—' : `${String(cogginsPct)}%`}
          </div>
          <div className="mt-1.5 h-[7px] rounded bg-[#EDF0EE]">
            {cogginsPct !== null && (
              <i
                className={`block h-[7px] rounded ${cTone.bar}`}
                style={{ width: `${String(cogginsPct)}%` }}
              />
            )}
          </div>
          <div className={`mt-1 text-[12px] font-semibold ${cTone.text}`}>
            {d.cogginsTotal > 0
              ? `${String(d.cogginsConfirmed)} of ${String(d.cogginsTotal)}`
              : 'no entries yet'}
          </div>
        </div>
      </div>

      {detail.tests.length > 0 && (
        <div className="mb-[18px] rounded-xl border-[1.5px] border-[#D9E1DD] px-4 py-3.5">
          <h4 className="m-0 mb-1.5 text-[16px] font-bold text-[#0D2C23]">Tests in this show</h4>
          {detail.tests.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between border-b border-[#EDF0EE] py-1.5 text-[14px] font-semibold text-[#16261F] last:border-b-0"
            >
              <span>{t.label}</span>
              <span className="text-[13px] text-[#5A6B63]">
                {[weekdayShort(t.date), t.ring, plural(t.rides, 'ride')]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="mb-[18px] grid gap-4 lg:grid-cols-3">
        <Breakdown
          title="Coggins"
          rows={[
            { label: 'Approved', value: String(d.cogginsConfirmed), tone: GOOD },
            {
              label: 'Waiting for your review',
              value: String(d.cogginsAwaiting),
              tone: toneIf(d.cogginsAwaiting, WAIT),
            },
            {
              label: 'Expired',
              value: String(d.cogginsExpired),
              tone: toneIf(d.cogginsExpired, BAD),
            },
            ...(d.cogginsRejected > 0
              ? [{ label: 'Rejected', value: String(d.cogginsRejected), tone: BAD }]
              : []),
            {
              label: 'Not uploaded',
              value: String(d.cogginsNotUploaded),
              tone: toneIf(d.cogginsNotUploaded, WAIT),
            },
          ]}
        />
        <Breakdown
          title="Waivers"
          rows={[
            { label: 'Signed', value: String(d.waiversSigned), tone: GOOD },
            {
              label: 'Not signed',
              value: String(d.waiversTotal - d.waiversSigned),
              tone: toneIf(d.waiversTotal - d.waiversSigned, BAD),
            },
            { label: 'Riders entered', value: String(d.waiversTotal), tone: NEUTRAL },
          ]}
        />
        <Breakdown
          title="Vendors"
          rows={[
            { label: 'Confirmed & paid', value: String(v.paid), tone: GOOD },
            {
              label: 'Applications to review',
              value: String(v.pending),
              tone: toneIf(v.pending, WAIT),
            },
            {
              label: 'Approved, not paid',
              value: String(v.approvedUnpaid),
              tone: toneIf(v.approvedUnpaid, BAD),
            },
            ...(v.spaces !== null
              ? [
                  {
                    label: 'Booth spaces',
                    value: `${String(booked)} of ${String(v.spaces)}`,
                    tone: NEUTRAL,
                  },
                ]
              : []),
            {
              label: 'Vendor revenue',
              value: canViewMoney ? formatMoney(v.revenue) : '—',
              tone: 'text-[#0D2C23] text-[15px]',
            },
          ]}
        />
      </div>

      <h3 className="m-0 text-[21px] font-bold text-[#0D2C23]">To-do for this show</h3>
      {todos.length === 0 ? (
        <p className="mt-3 mb-0 rounded-xl bg-[#E9F4EE] px-4 py-3 text-[15px] font-semibold text-[#1A5B3C]">
          ✓ Nothing open for this show.
        </p>
      ) : (
        <ul className="m-0 list-none p-0">
          {todos.map((todo) => (
            <TodoRow key={todo.key} todo={todo} />
          ))}
        </ul>
      )}
    </div>
  );
}

/** The three show boxes (click to expand a show's panel), the any-show
 * picker, and — when no show is open — one to-do list across all shows. */
export function HomeBoard({
  shows,
  upcomingShows,
  finishedShows,
  canViewMoney,
}: {
  shows: HomeShow[];
  upcomingShows: DashboardShowRow[];
  finishedShows: DashboardShowRow[];
  canViewMoney: boolean;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = shows.find((s) => s.show.id === openId) ?? null;

  const allTodos = shows.flatMap(({ show, daysOut, todos }) =>
    todos.map((todo) => ({ todo, show, daysOut })),
  );

  return (
    <>
      <div className="grid gap-[18px] lg:grid-cols-3">
        {shows.map(({ show, daysOut, entries, revenue, tickets, documents, detail }) => {
          const selected = show.id === openId;
          const waiverPct = percent(documents.waiversSigned, documents.waiversTotal);
          const cogginsPct = percent(documents.cogginsConfirmed, documents.cogginsTotal);
          return (
            <button
              key={show.id}
              type="button"
              aria-expanded={selected}
              onClick={() => {
                setOpenId(selected ? null : show.id);
              }}
              className={`relative block w-full cursor-pointer rounded-2xl bg-white px-[18px] py-4 text-left transition ${
                selected
                  ? "border-[2.5px] border-[#1A5B3C] shadow-[0_10px_26px_-14px_rgba(16,40,32,.4)] after:absolute after:-bottom-[13px] after:left-1/2 after:size-5 after:-translate-x-1/2 after:rotate-45 after:border-r-[2.5px] after:border-b-[2.5px] after:border-[#1A5B3C] after:bg-white after:content-['']"
                  : `border-[1.5px] border-[#C9D3CE] hover:border-[#1A5B3C] ${openId ? 'opacity-60 hover:opacity-100' : ''}`
              }`}
            >
              <div className="text-[12.5px] font-semibold text-[#5A6B63]">
                {[show.dateLabel, whenLabel(daysOut), plural(detail.tests.length, 'test')]
                  .filter(Boolean)
                  .join(' · ')}
              </div>
              <h2 className="mt-[3px] mb-2.5 text-[19px] leading-tight font-bold text-[#0D2C23]">
                {show.name}
              </h2>
              <TicketRow tickets={tickets} compact />
              <div className="grid grid-cols-4 gap-2 text-[12px] font-semibold text-[#5A6B63]">
                <div>
                  Entries<b className="block text-[17px] text-[#0D2C23]">{entries ?? '—'}</b>
                </div>
                <div>
                  Revenue
                  <b className="block text-[17px] text-[#0D2C23]">
                    {canViewMoney ? formatMoney(revenue) : '—'}
                  </b>
                </div>
                <div>
                  Waivers
                  <b className={`block text-[17px] ${approvalTone(waiverPct).text}`}>
                    {waiverPct === null ? '—' : `${String(waiverPct)}%`}
                  </b>
                </div>
                <div>
                  Coggins
                  <b className={`block text-[17px] ${approvalTone(cogginsPct).text}`}>
                    {cogginsPct === null ? '—' : `${String(cogginsPct)}%`}
                  </b>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {open && (
        <ShowPanel
          item={open}
          canViewMoney={canViewMoney}
          onClose={() => {
            setOpenId(null);
          }}
        />
      )}

      <div className="mt-[22px]">
        <ShowPicker upcoming={upcomingShows} finished={finishedShows} />
      </div>

      {!open && (
        <>
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
                <TodoRow key={`${show.id}-${todo.key}`} todo={todo} show={show} daysOut={daysOut} />
              ))}
            </ul>
          )}
        </>
      )}
    </>
  );
}
