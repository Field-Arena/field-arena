'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, Loader2Icon, MailIcon } from 'lucide-react';
import { LEAD_STATUSES } from '../constants';
import type { LeadRow } from '../types';
import type { ChecklistItem } from '../schemas';
import { parseMoneyField, toChecklist } from '../utils';
import { useUpdateLead, useSendLeadOnboarding } from '../hooks/use-lead-mutations';
import { LeadStatusPill } from './lead-status-pill';

const INPUT =
  'w-full rounded-[9px] border border-[#D7E0DA] bg-white px-3.5 py-3 text-[14px] text-[#16261F] focus-visible:border-gold focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-gold/[.15]';
const LABEL = 'mb-[7px] block text-[10.5px] font-bold uppercase tracking-[0.12em] text-fa-muted-2';
const SECTION = 'rounded-[14px] border border-[#E2E8E4] bg-white px-7 pb-7 pt-[26px]';
const H2 = 'font-[family-name:var(--font-nr)] text-[21px] font-medium tracking-[-.012em] text-hunter-deep';
const SAVE =
  'rounded-[9px] bg-hunter-deep px-5 py-[11px] text-[13.5px] font-bold text-paper transition hover:bg-gold hover:text-hunter-deep disabled:opacity-60';
const GRID = 'grid gap-[18px] [grid-template-columns:repeat(auto-fit,minmax(258px,1fr))]';

/**
 * The full target detail page — Contact & account, Deal economics, Notes, and
 * Onboarding — matching the Admin Console design. Each section saves
 * independently through updateLead, so one Save never touches another's fields.
 */
export function LeadDetail({ lead }: { lead: LeadRow }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-8">
        <div className="max-w-[700px]">
          <h1 className="mb-3 font-[family-name:var(--font-nr)] text-[32px] font-medium leading-[1.06] tracking-[-.022em] text-hunter-deep">
            {lead.org_name}
          </h1>
          <LeadStatusPill status={lead.status} size="md" />
        </div>
        <Link
          href="/dashboard/superadmin/sales"
          className="inline-flex items-center gap-2 rounded-[9px] border border-[#D7E0DA] bg-white px-[15px] py-2.5 text-[13px] font-semibold text-hunter-deep transition-colors hover:border-gold"
        >
          <ArrowLeftIcon className="size-[14px]" aria-hidden />
          Back to funnel
        </Link>
      </div>

      <ContactSection lead={lead} />
      <EconomicsSection lead={lead} />
      <NotesSection lead={lead} />
      {/*
        Keyed so the section remounts — and re-reads the checklist from props —
        when the checklist is first seeded (its length jumps 0→N) or re-sent
        (sent-at changes). Toggling an item's `done` flag does not change the
        length, so those edits are NOT lost to a remount before they are saved.
      */}
      <OnboardingSection
        key={`${lead.onboarding_email_sent_at ?? 'unsent'}:${String(
          toChecklist(lead.onboarding_checklist).length
        )}`}
        lead={lead}
      />
    </div>
  );
}

function ContactSection({ lead }: { lead: LeadRow }) {
  const [orgName, setOrgName] = useState(lead.org_name);
  const [contactName, setContactName] = useState(lead.contact_name ?? '');
  const [email, setEmail] = useState(lead.email ?? '');
  const [phone, setPhone] = useState(lead.phone ?? '');
  const [website, setWebsite] = useState(lead.website ?? '');
  const [shows, setShows] = useState(lead.shows_per_year != null ? String(lead.shows_per_year) : '');
  const [status, setStatus] = useState(lead.status ?? 'new');
  const update = useUpdateLead({ successMessage: 'Contact saved' });

  return (
    <section className={SECTION}>
      <h2 className={`${H2} mb-5`}>Contact and account</h2>
      <div className={GRID}>
        <Field label="Organization name" value={orgName} onChange={setOrgName} />
        <Field label="Contact name" value={contactName} onChange={setContactName} placeholder="Not captured yet" />
        <Field label="Email" value={email} onChange={setEmail} type="email" />
        <Field label="Phone" value={phone} onChange={setPhone} placeholder="Not captured yet" />
        <Field label="Website" value={website} onChange={setWebsite} placeholder="example.com" />
        <Field label="Shows per year" value={shows} onChange={setShows} placeholder="Unknown until the demo" />
        <div>
          <label htmlFor="ld-status" className={LABEL}>
            Status
          </label>
          <select
            id="ld-status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
            }}
            className={INPUT}
          >
            {LEAD_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-[22px] flex flex-wrap items-center gap-3.5 border-t border-[#EEF2EF] pt-5">
        <button
          type="button"
          disabled={update.isPending}
          className={SAVE}
          onClick={() => {
            update.mutate({
              id: lead.id,
              orgName,
              contactName,
              email,
              phone,
              website,
              status: status as (typeof LEAD_STATUSES)[number]['value'],
              showsPerYear: shows.trim() ? Math.max(0, Math.floor(Number(shows) || 0)) : null,
            });
          }}
        >
          {update.isPending ? 'Saving…' : 'Save'}
        </button>
        <span className="text-[12.5px] text-[#9AA6A0]">
          Changing the status moves this target in the funnel counts.
        </span>
      </div>
    </section>
  );
}

function EconomicsSection({ lead }: { lead: LeadRow }) {
  const [cost, setCost] = useState(lead.cost_per_event != null ? String(lead.cost_per_event) : '');
  const [rev, setRev] = useState(
    lead.avg_revenue_per_show != null ? String(lead.avg_revenue_per_show) : ''
  );
  const update = useUpdateLead({ successMessage: 'Economics saved' });

  return (
    <section className={SECTION}>
      <h2 className={`${H2} mb-1.5`}>Deal economics</h2>
      <p className="mb-5 text-[13px] leading-[1.55] text-fa-muted-2">
        What this account is projected to cost us to run and what it&apos;s worth — fill in after the
        demo.
      </p>
      <div className={GRID}>
        <Field label="Cost per event" value={cost} onChange={setCost} placeholder="$0" />
        <Field label="Average revenue per show" value={rev} onChange={setRev} placeholder="$0" />
      </div>
      <div className="mt-[22px] border-t border-[#EEF2EF] pt-5">
        <button
          type="button"
          disabled={update.isPending}
          className={SAVE}
          onClick={() => {
            update.mutate({
              id: lead.id,
              costPerEvent: parseMoneyField(cost),
              avgRevenuePerShow: parseMoneyField(rev),
            });
          }}
        >
          {update.isPending ? 'Saving…' : 'Save'}
        </button>
      </div>
    </section>
  );
}

function NotesSection({ lead }: { lead: LeadRow }) {
  const [notes, setNotes] = useState(lead.notes ?? '');
  const update = useUpdateLead({ successMessage: 'Notes saved' });

  return (
    <section className={SECTION}>
      <h2 className={`${H2} mb-4`}>Notes</h2>
      <textarea
        value={notes}
        onChange={(e) => {
          setNotes(e.target.value);
        }}
        placeholder="Call notes, objections, who else is involved in the decision…"
        className={`${INPUT} min-h-[132px] resize-y leading-[1.55]`}
      />
      <div className="mt-[18px]">
        <button
          type="button"
          disabled={update.isPending}
          className={SAVE}
          onClick={() => {
            update.mutate({ id: lead.id, notes });
          }}
        >
          {update.isPending ? 'Saving…' : 'Save notes'}
        </button>
      </div>
    </section>
  );
}

function OnboardingSection({ lead }: { lead: LeadRow }) {
  // datetime-local wants "YYYY-MM-DDTHH:mm"; slice the stored ISO string to fit.
  const [when, setWhen] = useState(lead.onboarding_at ? lead.onboarding_at.slice(0, 16) : '');
  const [checklist, setChecklist] = useState<ChecklistItem[]>(
    toChecklist(lead.onboarding_checklist)
  );
  const schedule = useUpdateLead({ successMessage: 'Onboarding scheduled' });
  const saveChecklist = useUpdateLead({ successMessage: 'Checklist updated' });
  const send = useSendLeadOnboarding();

  const done = checklist.filter((c) => c.done).length;

  return (
    <section className={SECTION}>
      <h2 className={`${H2} mb-4`}>Onboarding</h2>

      <div className="flex flex-wrap items-end gap-3.5">
        <div className="min-w-[220px] flex-[1_1_260px]">
          <label htmlFor="ld-when" className={LABEL}>
            Onboarding date and time
          </label>
          <input
            id="ld-when"
            type="datetime-local"
            value={when}
            onChange={(e) => {
              setWhen(e.target.value);
            }}
            className={INPUT}
          />
        </div>
        <button
          type="button"
          disabled={schedule.isPending}
          className={`${SAVE} px-[26px]`}
          onClick={() => {
            schedule.mutate({ id: lead.id, onboardingAt: when ? when : null });
          }}
        >
          {schedule.isPending ? 'Saving…' : 'Schedule'}
        </button>
      </div>

      <p className="mt-4 text-[12.5px] text-fa-muted-2">
        {lead.onboarding_email_sent_at
          ? 'Onboarding checklist has been emailed.'
          : 'No onboarding email sent yet.'}
      </p>

      {checklist.length > 0 && (
        <div className="mt-5 overflow-hidden rounded-xl border border-[#E2E8E4]">
          <div className="flex items-center gap-3 border-b border-[#E2E8E4] bg-[#F6F3EC] px-[18px] py-3.5">
            <span className="text-[12.5px] font-bold text-hunter-deep">Onboarding checklist</span>
            <span className="ml-auto text-[12.5px] font-semibold text-fa-muted">
              {done}/{checklist.length} done
            </span>
          </div>
          {checklist.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setChecklist((prev) =>
                  prev.map((c) => (c.id === item.id ? { ...c, done: !c.done } : c))
                );
              }}
              className="flex w-full items-start gap-3 border-b border-[#EEF2EF] px-[18px] py-3.5 text-left last:border-b-0 hover:bg-[#FAFCFB]"
            >
              <span
                className="grid size-[19px] flex-none place-items-center rounded-md border"
                style={{
                  borderColor: item.done ? '#C9A227' : '#D7E0DA',
                  background: item.done ? '#FFF8DF' : '#FFFFFF',
                }}
              >
                {item.done && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#C9A227" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                )}
              </span>
              <span
                className="text-[13.5px] leading-[1.5]"
                style={{
                  color: item.done ? '#9AA6A0' : '#16261F',
                  textDecoration: item.done ? 'line-through' : 'none',
                }}
              >
                {item.label}
              </span>
            </button>
          ))}
          <div className="px-[18px] py-3">
            <button
              type="button"
              disabled={saveChecklist.isPending}
              className="text-[12.5px] font-bold text-hunter-deep underline underline-offset-2 hover:text-gold disabled:opacity-60"
              onClick={() => {
                saveChecklist.mutate({ id: lead.id, onboardingChecklist: checklist });
              }}
            >
              {saveChecklist.isPending ? 'Saving…' : 'Save checklist'}
            </button>
          </div>
        </div>
      )}

      <div className="mt-[18px]">
        <button
          type="button"
          disabled={send.isPending}
          className="inline-flex items-center gap-2 rounded-[9px] bg-gold px-5 py-3 text-[13.5px] font-bold text-hunter-deep transition hover:bg-gold-light hover:shadow-[0_8px_24px_rgba(201,162,39,.26)] disabled:opacity-60"
          onClick={() => {
            send.mutate(lead.id);
          }}
        >
          {send.isPending ? (
            <Loader2Icon className="size-[15px] animate-spin" aria-hidden />
          ) : (
            <MailIcon className="size-[15px]" aria-hidden />
          )}
          Send onboarding email
        </button>
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  const id = `ld-${label.toLowerCase().replace(/[^a-z]+/g, '-')}`;
  return (
    <div>
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        className={INPUT}
      />
    </div>
  );
}
