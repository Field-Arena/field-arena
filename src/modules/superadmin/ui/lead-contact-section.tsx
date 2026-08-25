'use client';

import { Button } from '@/shared/ui/shadcn/button';
import { Label } from '@/shared/ui/shadcn/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/shadcn/select';
import { LEAD_STATUSES } from '@/modules/superadmin/constants';
import type { LeadRow } from '@/modules/superadmin/types';
import { useLeadContactForm } from '@/modules/superadmin/hooks/use-lead-contact-form';
import { SECTION, H2, GRID, LABEL, SAVE } from '@/modules/superadmin/ui/lead-detail-styles';
import { Field } from '@/modules/superadmin/ui/lead-detail-field';

export function ContactSection({ lead }: { lead: LeadRow }) {
  const {
    orgName,
    setOrgName,
    contactName,
    setContactName,
    email,
    setEmail,
    phone,
    setPhone,
    website,
    setWebsite,
    shows,
    setShows,
    status,
    setStatus,
    update,
    save,
  } = useLeadContactForm(lead);

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
          <Label htmlFor="ld-status" className={LABEL}>
            Status
          </Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger id="ld-status" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LEAD_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="mt-[22px] flex flex-wrap items-center gap-3.5 border-t border-[#EEF2EF] pt-5">
        <Button
          type="button"
          variant="ghost"
          disabled={update.isPending}
          className={`h-auto hover:bg-transparent ${SAVE}`}
          onClick={save}
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
