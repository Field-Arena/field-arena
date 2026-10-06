'use client';

import { useState, type ComponentProps } from 'react';
import { z } from 'zod';
import { Button } from '@/shared/ui/shadcn/button';
import { LEAD_STATUSES } from '@/modules/superadmin/constants';
import type { LeadRow } from '@/modules/superadmin/types';
import { useUpdateLead } from '@/modules/superadmin/hooks/use-lead-mutations';
import { SECTION, H2, GRID, LABEL, INPUT, SAVE } from '@/modules/superadmin/ui/lead-detail-styles';
import { Field } from '@/modules/superadmin/ui/lead-detail-field';
import { updateLeadSchema, type UpdateLeadInput } from '@/modules/superadmin/schemas';
import { PHONE_INPUT_PROPS, sanitizePhoneInput } from '@/shared/lib/format/phone-input';
import { EMAIL_INPUT_PROPS } from '@/shared/lib/format/email-input';
import { URL_INPUT_PROPS } from '@/shared/lib/format/url-input';
import { sanitizeIntegerInput } from '@/shared/lib/format/number-input';

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
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const update = useUpdateLead({ successMessage: 'Contact saved' });

  const fields: {
    key: keyof UpdateLeadInput;
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    inputProps?: ComponentProps<'input'>;
  }[] = [
    {
      key: 'orgName',
      label: 'Organization name',
      value: orgName,
      onChange: setOrgName,
      inputProps: { maxLength: 200 },
    },
    {
      key: 'contactName',
      label: 'Contact name',
      value: contactName,
      onChange: setContactName,
      placeholder: 'Not captured yet',
      inputProps: { maxLength: 200 },
    },
    {
      key: 'email',
      label: 'Email',
      value: email,
      onChange: setEmail,
      inputProps: { ...EMAIL_INPUT_PROPS, maxLength: 200 },
    },
    {
      key: 'phone',
      label: 'Phone',
      value: phone,
      onChange: (v) => {
        setPhone(sanitizePhoneInput(v));
      },
      placeholder: 'Not captured yet',
      inputProps: PHONE_INPUT_PROPS,
    },
    {
      key: 'website',
      label: 'Website',
      value: website,
      onChange: setWebsite,
      placeholder: 'example.com',
      inputProps: URL_INPUT_PROPS,
    },
    {
      key: 'showsPerYear',
      label: 'Shows per year',
      value: shows,
      onChange: (v) => {
        setShows(sanitizeIntegerInput(v, { maxDigits: 6 }));
      },
      placeholder: 'Unknown until the demo',
      inputProps: { inputMode: 'numeric' },
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
            placeholder={f.placeholder}
            inputProps={f.inputProps}
            error={errors[f.key]}
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
      <div className="mt-[22px] flex flex-wrap items-center gap-3.5 border-t border-[#EEF1F4] pt-5">
        <Button
          type="button"
          variant="ghost"
          disabled={update.isPending}
          className={`h-auto hover:bg-transparent ${SAVE}`}
          onClick={() => {
            const input: UpdateLeadInput = {
              id: lead.id,
              orgName,
              contactName,
              email,
              phone,
              website,
              status: status as (typeof LEAD_STATUSES)[number]['value'],
              showsPerYear: shows.trim() ? Math.max(0, Math.floor(Number(shows) || 0)) : null,
            };
            const result = updateLeadSchema.safeParse(input);
            if (!result.success) {
              const fieldErrors = z.flattenError(result.error).fieldErrors;
              setErrors(
                Object.fromEntries(
                  Object.entries(fieldErrors).map(([key, messages]) => [key, messages[0]]),
                ),
              );
              return;
            }
            setErrors({});
            update.mutate(input);
          }}
        >
          {update.isPending ? 'Saving…' : 'Save'}
        </Button>
        <span className="text-[12.5px] text-[#8A94A3]">
          Changing the status moves this target in the funnel counts.
        </span>
      </div>
    </section>
  );
}
