'use client';

import { useState } from 'react';
import { Card } from '@/shared/ui/organizer/card';
import { GhostButton } from '@/shared/ui/organizer/buttons';
import { Input } from '@/shared/ui/shadcn/input';
import { cn } from '@/shared/lib/utils';
import { useUpdateContact } from '@/modules/shows/hooks/use-show-mutations';
import { CONTACT_FIELDS } from '@/modules/shows/constants';
import { updateContactSchema } from '@/modules/shows/schemas';
import { schemaFieldError } from '@/modules/shows/utils/schema-field-error';
import { FieldError } from '@/modules/shows/ui/field-error';
import { PHONE_INPUT_PROPS, sanitizePhoneInput } from '@/shared/lib/format/phone-input';
import { EMAIL_INPUT_PROPS } from '@/shared/lib/format/email-input';
import { URL_INPUT_PROPS } from '@/shared/lib/format/url-input';
import { SM_CARD_PAD, SM_LABEL, SM_INPUT } from '@/modules/shows/ui/show-manager/tokens';
import { SmHead } from './sm-head';

const FIELD_INPUT_PROPS = {
  website: URL_INPUT_PROPS,
  phone: PHONE_INPUT_PROPS,
  contactEmail: EMAIL_INPUT_PROPS,
} as const;

export function ContactCard({
  showId,
  website,
  phone,
  contactEmail,
}: {
  showId: string;
  website: string | null;
  phone: string | null;
  contactEmail: string | null;
}) {
  const [values, setValues] = useState({
    website: website ?? '',
    phone: phone ?? '',
    contactEmail: contactEmail ?? '',
  });
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState<string | undefined>(undefined);
  const { mutate } = useUpdateContact();

  function commit(next: typeof values) {
    setValues(next);
    mutate({ showId, ...next });
  }

  return (
    <Card className={SM_CARD_PAD}>
      <SmHead
        icon="contact"
        title="Contact"
        sub="How riders reach you — shown on the ticket page"
      />
      <div className="flex flex-col">
        {CONTACT_FIELDS.map((field, i) => {
          const isEditing = editing === field.key;
          return (
            <div
              key={field.key}
              className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-3.5 ${
                i < CONTACT_FIELDS.length - 1 ? 'border-b border-[#EEF1F4]' : ''
              }`}
            >
              <div className="min-w-0">
                <span className={`${SM_LABEL} mb-1.5`}>{field.label}</span>
                {isEditing ? (
                  <>
                    <Input
                      autoFocus
                      {...FIELD_INPUT_PROPS[field.key]}
                      value={values[field.key]}
                      placeholder={field.placeholder}
                      aria-invalid={error ? true : undefined}
                      className={cn('h-auto', SM_INPUT)}
                      onChange={(e) => {
                        const next =
                          field.key === 'phone'
                            ? sanitizePhoneInput(e.target.value)
                            : e.target.value;
                        setValues((v) => ({ ...v, [field.key]: next }));
                        setError(undefined);
                      }}
                    />
                    <FieldError message={error} />
                  </>
                ) : (
                  <div className="truncate text-[14.5px] text-[#101828]">
                    {values[field.key] || <span className="text-[#8A94A3] italic">Not set</span>}
                  </div>
                )}
              </div>
              <GhostButton
                className="px-3.5 py-2.5 text-[12.5px]"
                onClick={() => {
                  if (isEditing) {
                    const message = schemaFieldError(
                      updateContactSchema,
                      { showId, ...values },
                      field.key,
                    );
                    if (message) {
                      setError(message);
                      return;
                    }
                    commit(values);
                    setEditing(null);
                  } else {
                    setError(undefined);
                    setEditing(field.key);
                  }
                }}
              >
                {isEditing ? 'Done' : 'Edit'}
              </GhostButton>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
