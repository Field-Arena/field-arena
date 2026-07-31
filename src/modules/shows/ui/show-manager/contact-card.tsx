'use client';

import { useState } from 'react';
import { Card } from '@/shared/ui/organizer/card';
import { GhostButton } from '@/shared/ui/organizer/buttons';
import { useUpdateContact } from '../../hooks/use-show-mutations';
import { SM_CARD_PAD, SM_SECTION_HEAD, SM_LABEL, SM_INPUT } from './tokens';

interface ContactField {
  key: 'website' | 'phone' | 'contactEmail';
  label: string;
  type: string;
  placeholder: string;
}

const FIELDS: ContactField[] = [
  { key: 'website', label: 'Website', type: 'url', placeholder: 'https://…' },
  { key: 'phone', label: 'Phone', type: 'tel', placeholder: '(555) 555-0100' },
  { key: 'contactEmail', label: 'Contact email', type: 'email', placeholder: 'info@yourshow.com' },
];

/**
 * "Contact" — three toggle-edit rows (design's smInfoRowHtml pattern, same
 * one Show Details uses for Organization / club name). showstaff.html
 * saves each field independently on its own onchange; this bundles all
 * three into one autosave call instead, same simplification Show Details
 * already makes — harmless since the other two are re-saved with their own
 * unchanged values each time.
 */
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
      <h2 className={SM_SECTION_HEAD}>Contact</h2>
      <div className="flex flex-col">
        {FIELDS.map((field, i) => {
          const isEditing = editing === field.key;
          return (
            <div
              key={field.key}
              className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-3.5 ${
                i < FIELDS.length - 1 ? 'border-b border-[#EDF0EE]' : ''
              }`}
            >
              <div className="min-w-0">
                <span className={`${SM_LABEL} mb-1.5`}>{field.label}</span>
                {isEditing ? (
                  <input
                    autoFocus
                    type={field.type}
                    value={values[field.key]}
                    placeholder={field.placeholder}
                    className={SM_INPUT}
                    onChange={(e) => {
                      setValues((v) => ({ ...v, [field.key]: e.target.value }));
                    }}
                  />
                ) : (
                  <div className="truncate text-[14.5px] text-ink-deep">
                    {values[field.key] || <span className="italic text-[#98A29D]">Not set</span>}
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
