'use client';

import { useState } from 'react';
import { Button } from '@/shared/ui/shadcn/button';
import { LEAD_STATUSES } from '@/modules/superadmin/constants';
import type { LeadRow } from '@/modules/superadmin/types';
import { useUpdateLead } from '@/modules/superadmin/hooks/use-lead-mutations';
import { SECTION, H2, GRID, LABEL, INPUT, SAVE } from '@/modules/superadmin/ui/lead-detail-styles';
import { Field } from '@/modules/superadmin/ui/lead-detail-field';

export function ContactSection({ lead }: { lead: LeadRow }) {
  const [orgName, setOrgName] = useState(lead.org_name);
  const [contactName, setContactName] = useState(lead.contact_name ?? '');
  const [email, setEmail] = useState(lead.email ?? '');
  const [phone, setPhone] = useState(lead.phone ?? '');
  const [website, setWebsite] = useState(lead.website ?? '');
  const [shows, setShows] = useState(
    lead.shows_per_year != null ? String(lead.shows_per_year) : '',
  );
  const [status, setStatus] = useState(lead.status ?? 'new');
  const update = useUpdateLead({ successMessage: 'Contact saved' });

  const fields: {
    key: string;
    label: string;
    value: string;
    onChange: (v: string) => void;
    type?: string;
    placeholder?: string;
  }[] = [
    { key: 'org', label: 'Organization name', value: orgName, onChange: setOrgName },
    {
      key: 'contact',
      label: 'Contact name',
      value: contactName,
      onChange: setContactName,
      placeholder: 'Not captured yet',
    },
    { key: 'email', label: 'Email', value: email, onChange: setEmail, type: 'email' },
    {
      key: 'phone',
      label: 'Phone',
      value: phone,
      onChange: setPhone,
      placeholder: 'Not captured yet',
    },
    {
      key: 'website',
      label: 'Website',
      value: website,
      onChange: setWebsite,
      placeholder: 'example.com',
    },
    {
      key: 'shows',
      label: 'Shows per year',
      value: shows,
      onChange: setShows,
      placeholder: 'Unknown until the demo',
    },
  ];

  return (
    <section className={SECTION}>
      <h2 className={`${H2} mb-5`}>Contact and account</h2>
      <div className={GRID}>
        {fields.map((f) => (
          <Field
            key={f.key}
            label={f.label}
            value={f.value}
            onChange={f.onChange}
            type={f.type}
            placeholder={f.placeholder}
          />
        ))}
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
        <Button
          type="button"
          variant="ghost"
          disabled={update.isPending}
          className={`h-auto hover:bg-transparent ${SAVE}`}
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
        </Button>
        <span className="text-[12.5px] text-[#9AA6A0]">
          Changing the status moves this target in the funnel counts.
        </span>
      </div>
    </section>
  );
}
