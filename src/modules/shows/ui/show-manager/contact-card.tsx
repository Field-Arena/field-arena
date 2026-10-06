'use client';

import { useState } from 'react';
import { Card } from '@/shared/ui/organizer/card';
import { GhostButton } from '@/shared/ui/organizer/buttons';
import { Input } from '@/shared/ui/shadcn/input';
import { cn } from '@/shared/lib/utils';
import { useUpdateContact } from '@/modules/shows/hooks/use-show-mutations';
import { CONTACT_FIELDS } from '@/modules/shows/constants';
import { SM_CARD_PAD, SM_LABEL, SM_INPUT } from '@/modules/shows/ui/show-manager/tokens';
import { SmHead } from './sm-head';

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
                  <Input
                    autoFocus
                    type={field.type}
                    value={values[field.key]}
                    placeholder={field.placeholder}
                    className={cn('h-auto', SM_INPUT)}
                    onChange={(e) => {
                      setValues((v) => ({ ...v, [field.key]: e.target.value }));
                    }}
                  />
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
                    commit(values);
                    setEditing(null);
                  } else {
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
