'use client';

import { useState } from 'react';
import type { RiderListRow, ShowEntries, ShowRiders } from '@/modules/shows/types';
import { formatMoney } from '@/shared/lib/format/currency';
import { OrgAvatar } from '@/shared/ui/organizer/org-avatar';
import { EntriesListScreen } from './entries-list-screen';

type Filter = 'all' | 'paid' | 'pending' | 'scratched';

const FILTER_LABEL: Record<Filter, string> = {
  all: 'All',
  paid: 'Paid',
  pending: 'Pending',
  scratched: 'Scratched',
};

function toCsv(rows: RiderListRow[]): string {
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lines = [
    ['Bib', 'Rider', 'Horses', 'Classes', 'Fees', 'Payment', 'Outstanding'].map(esc).join(','),
    ...rows.map((r) =>
      [
        r.num,
        r.name,
        r.horses.join('; '),
        r.classCodes.map((c) => c.code).join(' '),
        String(r.total),
        r.payment,
        String(r.outstanding),
      ]
        .map(esc)
        .join(','),
    ),
  ];
  return lines.join('\n');
}

/** The redesign's Rider Entries screen: one row per rider for the focused
 * show, with payment standing; the class-grouped list is one toggle away. */
export function RiderEntriesScreen({
  riders,
  entries,
  canViewMoney,
  publicUrl,
}: {
  riders: ShowRiders;
  entries: ShowEntries;
  canViewMoney: boolean;
  publicUrl: string;
}) {
  const [view, setView] = useState<'riders' | 'classes'>('riders');
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<string | null>(null);

  const rows = riders.riders;
  const counts = {
    all: rows.length,
    paid: rows.filter((r) => r.payment === 'paid').length,
    pending: rows.filter((r) => r.payment === 'pending').length,
    scratched: rows.filter((r) => r.payment === 'scratched').length,
  };
  const needle = query.trim().toLowerCase();
  const shown = rows.filter(
    (r) =>
      (filter === 'all' || r.payment === filter) &&
      (!needle ||
        r.name.toLowerCase().includes(needle) ||
        r.num.toLowerCase().includes(needle) ||
        r.horses.some((h) => h.toLowerCase().includes(needle))),
  );

  const horses = new Set(rows.flatMap((r) => r.horses)).size;
  const outstanding = rows.reduce((sum, r) => sum + r.outstanding, 0);
  const unpaidRiders = rows.filter((r) => r.outstanding > 0).length;
  const classCount = entries.classes.length;

  function exportCsv() {
    const blob = new Blob([toCsv(shown)], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${riders.showName.replace(/[^\w-]+/g, '-')}-rider-entries.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="fa-stats">
        <div className="fa-stat">
          <div
            className="fa-ico"
            style={{ background: 'var(--fa-violet-tint)', color: 'var(--fa-violet)' }}
          >
            <svg
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 20v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2M10 10a3 3 0 100-6 3 3 0 000 6z"
              />
            </svg>
          </div>
          <div className="fa-num">{rows.length}</div>
          <div className="fa-lab">Riders</div>
          <div className="fa-sub">entered</div>
        </div>
        <div className="fa-stat">
          <div
            className="fa-ico"
            style={{ background: 'var(--fa-sky-tint)', color: 'var(--fa-sky)' }}
          >
            <svg
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5h10M9 12h10M9 19h10M5 5h.01M5 12h.01M5 19h.01"
              />
            </svg>
          </div>
          <div className="fa-num">{entries.entries.length}</div>
          <div className="fa-lab">Class entries</div>
          <div className="fa-sub">
            across {classCount} class{classCount === 1 ? '' : 'es'}
          </div>
        </div>
        <div className="fa-stat">
          <div
            className="fa-ico"
            style={{ background: 'var(--fa-brand-tint)', color: 'var(--fa-brand)' }}
          >
            <svg fill="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path d="M6 22h12v-1.5H6V22zm1.5-2.5h9c.4-3.3-.6-6-2.7-7.9.6-.6 1-1.5.9-2.4 0-.3.3-.6.6-.4.7.3 1.5-.3 1.4-1.1-.1-2.2-1.5-4-3.5-4.8l.3-1.3c.1-.5-.4-.9-.9-.6-.8.4-1.5 1.1-1.9 1.9C8 4 6.4 5.8 6.4 8c0 .3 0 .5.1.8L5.1 10c-.5.4-.4 1.1.2 1.3l1.3.5c-.9 1.7-1.2 3.5-.9 5.3.1.5.3 1 .6 1.4z" />
            </svg>
          </div>
          <div className="fa-num">{horses}</div>
          <div className="fa-lab">Horses</div>
          <div className="fa-sub">registered</div>
        </div>
        {canViewMoney && (
          <div className="fa-stat">
            <div
              className="fa-ico"
              style={{ background: 'var(--fa-amber-tint)', color: 'var(--fa-amber)' }}
            >
              <svg
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8v4l3 2M12 3a9 9 0 100 18 9 9 0 000-18z"
                />
              </svg>
            </div>
            <div className="fa-num">{formatMoney(outstanding)}</div>
            <div className="fa-lab">Outstanding</div>
            <div className="fa-sub">
              {unpaidRiders} rider{unpaidRiders === 1 ? '' : 's'} unpaid
            </div>
          </div>
        )}
      </div>

      <div className="fa-subtoggle">
        <button
          type="button"
          className={view === 'riders' ? 'fa-active' : ''}
          onClick={() => {
            setView('riders');
          }}
        >
          By rider
        </button>
        <button
          type="button"
          className={view === 'classes' ? 'fa-active' : ''}
          onClick={() => {
            setView('classes');
          }}
        >
          By class
        </button>
      </div>

      {view === 'classes' ? (
        <div className="fa-card p-5">
          <EntriesListScreen data={entries} canViewMoney={canViewMoney} embedded />
        </div>
      ) : (
        <div className="fa-card">
          <div className="fa-card-head">
            <div className="fa-filterbar">
              {(['all', 'paid', 'pending', 'scratched'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  className={`fa-chip ${filter === f ? 'fa-active' : ''}`}
                  onClick={() => {
                    setFilter(f);
                  }}
                >
                  {FILTER_LABEL[f]}
                  <span className="fa-ct">{counts[f]}</span>
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="fa-mini-search">
                <svg
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
                </svg>
                <input
                  type="text"
                  placeholder="Search riders, horses…"
                  value={query}
                  aria-label="Search riders and horses"
                  onChange={(e) => {
                    setQuery(e.target.value);
                  }}
                />
              </div>
              <button type="button" className="fa-btn fa-btn-ghost" onClick={exportCsv}>
                <svg
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4v11m0 0l-4-4m4 4l4-4M5 19h14"
                  />
                </svg>
                Export
              </button>
              <a
                href={publicUrl}
                target="_blank"
                rel="noreferrer"
                className="fa-btn fa-btn-primary"
                title="Opens the show's entry page — enter a rider there on their behalf"
              >
                <svg
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                </svg>
                Add entry
              </a>
            </div>
          </div>

          {shown.length === 0 ? (
            <p className="px-5 py-10 text-center text-[13.5px] text-[var(--fa-ink-3)]">
              {rows.length === 0 ? 'No riders have entered this show yet.' : 'No riders match.'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="fa-table min-w-[820px]">
                <thead>
                  <tr>
                    <th>Rider</th>
                    <th>Horse</th>
                    <th>Classes</th>
                    {canViewMoney && <th className="fa-num">Fees</th>}
                    {canViewMoney && <th>Payment</th>}
                    <th aria-label="Details" />
                  </tr>
                </thead>
                <tbody>
                  {shown.map((r) => (
                    <RiderRow
                      key={r.num}
                      row={r}
                      canViewMoney={canViewMoney}
                      open={open === r.num}
                      onToggle={() => {
                        setOpen(open === r.num ? null : r.num);
                      }}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="border-t border-[var(--fa-line-soft)] px-5 py-3.5 text-[12.5px] text-[var(--fa-ink-3)]">
            Showing {shown.length} of {rows.length} riders
          </div>
        </div>
      )}
    </>
  );
}

function RiderRow({
  row,
  canViewMoney,
  open,
  onToggle,
}: {
  row: RiderListRow;
  canViewMoney: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  const cols = canViewMoney ? 6 : 4;
  return (
    <>
      <tr>
        <td>
          <div className="fa-org-cell">
            <OrgAvatar name={row.name || '?'} size={34} />
            <div>
              <div className="fa-org-name !text-[13.5px]">{row.name || 'Unnamed rider'}</div>
              <div className="fa-org-loc">Bib #{row.num}</div>
            </div>
          </div>
        </td>
        <td>
          <div className="text-[var(--fa-ink)]">{row.horses[0] ?? row.horse}</div>
          {row.horses.length > 1 && (
            <div className="text-[12px] text-[var(--fa-ink-3)]">
              {row.horses.slice(1).join(', ')}
            </div>
          )}
        </td>
        <td>
          <div className="flex flex-wrap gap-1">
            {row.classCodes.map((c, i) => (
              <span
                key={`${c.code}-${String(i)}`}
                className={`fa-tag-usef ${c.scratched ? 'line-through' : ''}`}
              >
                {c.code}
              </span>
            ))}
          </div>
        </td>
        {canViewMoney && <td className="fa-num">{formatMoney(row.total)}</td>}
        {canViewMoney && (
          <td>
            {row.payment === 'paid' ? (
              <span className="fa-badge fa-live">
                <span className="fa-dot" />
                Paid
              </span>
            ) : row.payment === 'scratched' ? (
              <span className="fa-badge fa-red">
                <span className="fa-dot" />
                Scratched{row.refunded > 0 ? ' · refunded' : ''}
              </span>
            ) : (
              <span className="fa-badge fa-pending">
                <span className="fa-dot" />
                Pending · {formatMoney(row.outstanding)}
              </span>
            )}
          </td>
        )}
        <td className="text-right">
          <button
            type="button"
            className="fa-filelink border-0 bg-transparent"
            aria-expanded={open}
            onClick={onToggle}
          >
            {open ? 'Hide' : 'View'}
          </button>
        </td>
      </tr>
      {open && (
        <tr className="!bg-[var(--fa-surface-2)]">
          <td colSpan={cols}>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <div className="mb-1 text-[11px] font-semibold tracking-[.07em] text-[var(--fa-ink-3)] uppercase">
                  Classes
                </div>
                <ul className="m-0 list-none p-0 text-[12.5px] text-[var(--fa-ink-2)]">
                  {row.classes.map((c, i) => (
                    <li key={`${c}-${String(i)}`}>{c}</li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="mb-1 text-[11px] font-semibold tracking-[.07em] text-[var(--fa-ink-3)] uppercase">
                  Horse documents
                </div>
                {row.documents.length === 0 ? (
                  <span className="text-[12.5px] text-[var(--fa-ink-3)]">None uploaded</span>
                ) : (
                  <ul className="m-0 list-none p-0 text-[12.5px] text-[var(--fa-ink-2)]">
                    {row.documents.map((d, i) => (
                      <li key={`${d.label}-${String(i)}`}>
                        {d.horseName}: {d.label}{' '}
                        <span
                          className={
                            d.verified ? 'text-[var(--fa-emerald)]' : 'text-[var(--fa-amber)]'
                          }
                        >
                          {d.verified ? '✓ verified' : '· unverified'}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <div className="mb-1 text-[11px] font-semibold tracking-[.07em] text-[var(--fa-ink-3)] uppercase">
                  Past shows
                </div>
                <span className="text-[12.5px] text-[var(--fa-ink-2)]">
                  {row.pastShows.length > 0 ? row.pastShows.join(', ') : 'First show with you'}
                </span>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
