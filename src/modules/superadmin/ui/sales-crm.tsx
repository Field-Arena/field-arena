'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SearchIcon } from 'lucide-react';
import type { ContactRow } from '@/modules/superadmin/data/queries';
import { AddTargetDialog } from '@/modules/superadmin/ui/add-target-dialog';
import {
  useInviteLeadAsOrganizer,
  useSetLeadNoShow,
} from '@/modules/superadmin/hooks/use-lead-mutations';
import { useResendOrganizerInvite } from '@/modules/superadmin/hooks/use-organization-mutations';

type Filter = 'all' | 'demo-pending' | 'demo-complete' | 'invite-pending' | 'signed-up' | 'no-demo';

const FILTERS: [Filter, string][] = [
  ['all', 'All'],
  ['demo-pending', 'Demo pending'],
  ['demo-complete', 'Demo complete'],
  ['invite-pending', 'Invite pending'],
  ['signed-up', 'Signed up'],
  ['no-demo', 'No demo yet'],
];

const matches = (c: ContactRow, f: Filter) =>
  f === 'all' ||
  (f === 'demo-pending' && c.demo === 'pending') ||
  (f === 'demo-complete' && c.demo === 'complete') ||
  (f === 'invite-pending' && c.organizer === 'pending') ||
  (f === 'signed-up' && c.organizer === 'signed-up') ||
  (f === 'no-demo' && (c.demo === 'none' || c.demo === 'no-show'));

const pill = 'inline-block rounded-[7px] px-2.5 py-0.5 text-[11.5px] font-extrabold';
const btn =
  'inline-flex cursor-pointer items-center rounded-[9px] border-2 border-[#1A5B3C] px-3 py-1.5 text-[13px] font-bold whitespace-nowrap disabled:opacity-50';

function fmtDemo(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function csv(rows: ContactRow[]): string {
  const esc = (v: string | number | null | undefined) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const head = [
    'Contact',
    'Organization',
    'Email',
    'Phone',
    'City',
    'State',
    'Website',
    'Shows per year',
    'Demo',
    'Demo date',
    'Organizer',
    'Source',
  ];
  const body = rows.map(({ lead, demo, organizer }) =>
    [
      lead.contact_name,
      lead.org_name,
      lead.email,
      lead.phone,
      lead.city,
      lead.state,
      lead.website,
      lead.shows_per_year,
      demo,
      lead.demo_at,
      organizer,
      lead.calendly_event_uri ? 'Calendly' : 'Added by hand',
    ]
      .map(esc)
      .join(','),
  );
  return [head.map(esc).join(','), ...body].join('\n');
}

/** Sales pipeline as a contact CRM: every prospect with full contact info,
 * shows per year, demo status and where their organizer invite stands. */
export function SalesCrm({ contacts }: { contacts: ContactRow[] }) {
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const invite = useInviteLeadAsOrganizer();
  const resend = useResendOrganizerInvite();
  const noShow = useSetLeadNoShow();

  const count = (f: Filter) => contacts.filter((c) => matches(c, f)).length;
  const signedUp = contacts.filter((c) => c.organizer === 'signed-up');
  const signedShows = signedUp.reduce((sum, c) => sum + (c.lead.shows_per_year ?? 0), 0);

  const needle = query.trim().toLowerCase();
  const rows = contacts
    .filter((c) => matches(c, filter))
    .filter((c) => {
      if (!needle) return true;
      const l = c.lead;
      return [l.contact_name, l.org_name, l.email, l.city, l.state, l.phone]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(needle));
    });

  const stat = 'rounded-xl border-[1.5px] border-[#D9E1DD] bg-white px-3.5 py-3';

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[13px] font-semibold text-[#5A6B63]">
            Every organizer prospect — Calendly bookings flow in automatically
          </div>
          <h1 className="mt-1 mb-0 text-[30px] font-bold text-[#0D2C23]">Sales pipeline</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={`${btn} bg-white text-[#1A5B3C]`}
            onClick={() => {
              const blob = new Blob([csv(rows)], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'field-arena-contacts.csv';
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            ⇩ Export CSV
          </button>
          <AddTargetDialog />
        </div>
      </div>

      <div className="my-4 grid grid-cols-2 gap-3 md:grid-cols-5">
        <div className={stat}>
          <div className="text-[12.5px] font-semibold text-[#5A6B63]">Contacts</div>
          <div className="mt-0.5 text-[26px] font-bold text-[#0D2C23]">{contacts.length}</div>
        </div>
        <div className={stat}>
          <div className="text-[12.5px] font-semibold text-[#5A6B63]">Demo pending</div>
          <div className="mt-0.5 text-[26px] font-bold text-[#8A6D14]">{count('demo-pending')}</div>
        </div>
        <div className={stat}>
          <div className="text-[12.5px] font-semibold text-[#5A6B63]">Demo complete</div>
          <div className="mt-0.5 text-[26px] font-bold text-[#1A5B3C]">
            {count('demo-complete')}
          </div>
        </div>
        <div className={stat}>
          <div className="text-[12.5px] font-semibold text-[#5A6B63]">Invited to organize</div>
          <div className="mt-0.5 text-[26px] font-bold text-[#0D2C23]">
            {contacts.filter((c) => c.organizer !== 'none').length}
          </div>
        </div>
        <div className={stat}>
          <div className="text-[12.5px] font-semibold text-[#5A6B63]">Signed up</div>
          <div className="mt-0.5 text-[26px] font-bold text-[#1A5B3C]">{signedUp.length}</div>
          <div className="text-[12px] font-semibold text-[#5A6B63]">
            ≈ {signedShows} shows / year
          </div>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        {FILTERS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setFilter(key);
            }}
            className={`inline-flex h-9 cursor-pointer items-center rounded-full border-2 px-3.5 text-[13px] font-bold ${
              filter === key
                ? 'border-[#1A5B3C] bg-[#1A5B3C] text-white'
                : 'border-[#C9D3CE] bg-white text-[#16261F] hover:border-[#1A5B3C]'
            }`}
          >
            {label}
            {key === 'all' ? '' : ` (${String(count(key))})`}
          </button>
        ))}
        <label className="ml-auto flex h-10 w-[300px] max-w-full items-center gap-2 rounded-[10px] border-2 border-[#C9D3CE] bg-white px-3 focus-within:border-[#1A5B3C]">
          <SearchIcon className="size-4 text-[#98A29D]" aria-hidden />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
            }}
            placeholder="Name, organization, email, state"
            aria-label="Search contacts"
            className="w-full border-0 bg-transparent text-[14px] outline-none"
          />
        </label>
      </div>

      <div className="overflow-x-auto rounded-[14px] border-[1.5px] border-[#C9D3CE] bg-white">
        <table className="w-full border-collapse text-[13.5px]">
          <thead>
            <tr className="bg-[#F5F7F6] text-left text-[11px] tracking-[.06em] text-[#5A6B63] uppercase">
              <th className="px-3 py-2.5">Contact</th>
              <th className="px-3 py-2.5">Phone · Email</th>
              <th className="px-3 py-2.5">Location · Website</th>
              <th className="px-3 py-2.5">Shows / yr</th>
              <th className="px-3 py-2.5">Demo</th>
              <th className="px-3 py-2.5">Organizer</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-[14px] text-[#5A6B63]">
                  {contacts.length === 0
                    ? 'No contacts yet. Calendly bookings will appear here, or add one by hand.'
                    : 'No contacts match.'}
                </td>
              </tr>
            )}
            {rows.map((c) => {
              const l = c.lead;
              const location = [l.city, l.state].filter(Boolean).join(', ');
              return (
                <tr key={l.id} className="border-t border-[#EDF0EE] align-middle">
                  <td className="px-3 py-3">
                    <Link
                      href={`/dashboard/superadmin/sales/${l.id}`}
                      prefetch={false}
                      className="text-[14.5px] font-bold text-[#0D2C23] no-underline hover:underline"
                    >
                      {l.contact_name ?? l.org_name}
                    </Link>
                    <div className="text-[12.5px] font-semibold text-[#5A6B63]">
                      {l.contact_name ? l.org_name : ''}
                    </div>
                    <span
                      className={`mt-1 inline-block rounded-md px-1.5 py-px text-[11px] font-bold ${
                        l.calendly_event_uri
                          ? 'bg-[#EEF3FB] text-[#3E6FA8]'
                          : 'bg-[#EDF0EE] text-[#5A6B63]'
                      }`}
                    >
                      {l.calendly_event_uri ? 'Calendly' : 'Added by hand'}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-[12.5px] leading-[1.5] text-[#3F4F48]">
                    {l.phone ?? '—'}
                    <br />
                    {l.email ? <a href={`mailto:${l.email}`}>{l.email}</a> : '—'}
                  </td>
                  <td className="px-3 py-3 text-[12.5px] leading-[1.5] text-[#3F4F48]">
                    {location || '—'}
                    <br />
                    {l.website ?? '—'}
                  </td>
                  <td className="px-3 py-3 text-[17px] font-bold text-[#0D2C23]">
                    {l.shows_per_year ?? '—'}
                  </td>
                  <td className="px-3 py-3">
                    {c.demo === 'none' ? (
                      <span className={`${pill} bg-[#EDF0EE] text-[#5A6B63]`}>No demo yet</span>
                    ) : c.demo === 'no-show' ? (
                      <span className={`${pill} bg-[#FDEEEB] text-[#98341F]`}>No-show</span>
                    ) : c.demo === 'complete' ? (
                      <span className={`${pill} bg-[#E9F4EE] text-[#1A5B3C]`}>Complete</span>
                    ) : (
                      <span className={`${pill} bg-[#FCF3E4] text-[#8A6D14]`}>Pending</span>
                    )}
                    {l.demo_at && (
                      <div className="mt-0.5 text-[12.5px] text-[#3F4F48]">
                        {fmtDemo(l.demo_at)}
                      </div>
                    )}
                    {(c.demo === 'complete' || c.demo === 'no-show') && (
                      <button
                        type="button"
                        disabled={noShow.isPending}
                        onClick={() => {
                          noShow.mutate({ id: l.id, noShow: c.demo === 'complete' });
                        }}
                        className="mt-0.5 cursor-pointer border-0 bg-transparent p-0 text-[12px] text-[#5A6B63] underline"
                      >
                        {c.demo === 'complete' ? 'Mark no-show' : 'Undo no-show'}
                      </button>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {c.organizer === 'signed-up' ? (
                      <>
                        <span className={`${pill} bg-[#E9F4EE] text-[#1A5B3C]`}>✓ Signed up</span>
                        <div className="mt-0.5 text-[12.5px] text-[#3F4F48]">
                          {c.showsCreated} show{c.showsCreated === 1 ? '' : 's'} created
                        </div>
                      </>
                    ) : c.organizer === 'pending' ? (
                      <>
                        <span className={`${pill} bg-[#FCF3E4] text-[#8A6D14]`}>
                          Invite pending
                        </span>
                        <div className="mt-0.5 text-[12.5px] text-[#3F4F48]">
                          {l.invited_at
                            ? `sent ${new Date(l.invited_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · `
                            : ''}
                          <button
                            type="button"
                            disabled={resend.isPending || !l.org_id}
                            onClick={() => {
                              if (l.org_id) resend.mutate(l.org_id);
                            }}
                            className="cursor-pointer border-0 bg-transparent p-0 text-[12.5px] text-[#3F4F48] underline"
                          >
                            resend
                          </button>
                        </div>
                      </>
                    ) : (
                      <button
                        type="button"
                        disabled={invite.isPending}
                        title={
                          l.email
                            ? `Creates ${l.org_name} and emails ${l.email} an organizer invite`
                            : 'Add an email first'
                        }
                        onClick={() => {
                          invite.mutate(l.id);
                        }}
                        className={`${btn} ${
                          c.demo === 'complete'
                            ? 'bg-[#1A5B3C] text-white'
                            : 'bg-white text-[#1A5B3C]'
                        }`}
                      >
                        Invite to be organizer
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2.5 text-[12.5px] font-semibold text-[#5A6B63]">
        Click a contact for full details, notes and history. Demo turns <b>Complete</b>{' '}
        automatically once its time has passed. “Invite to be organizer” creates their organization
        and emails a sign-up link; it shows <b>Signed up</b> once they finish setting up their
        account.
      </p>
    </div>
  );
}
