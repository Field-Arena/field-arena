'use client';

import type { ComponentProps } from 'react';
import type { UseFormRegister, FieldErrors } from 'react-hook-form';
import { Input } from '@/shared/ui/shadcn/input';
import { Label } from '@/shared/ui/shadcn/label';
import { cn } from '@/shared/lib/utils';
import type { VenueDetailsInput } from '@/modules/organizations/schemas';
import { withSanitizer } from '@/shared/lib/format/input-sanitize';
import { PHONE_INPUT_PROPS, sanitizePhoneInput } from '@/shared/lib/format/phone-input';
import { URL_INPUT_PROPS } from '@/shared/lib/format/url-input';

interface DetailField {
  id: string;
  label: string;
  required?: boolean;
  /** Native input attributes (type, inputMode, autoComplete, maxLength). */
  inputProps?: ComponentProps<'input'>;
  placeholder?: string;
  colSpan2?: boolean;
  name: keyof VenueDetailsInput;
  sanitize?: (value: string) => string;
}

const FIELDS: DetailField[] = [
  {
    id: 'vf-name',
    label: 'Location name',
    required: true,
    placeholder: 'e.g. Wills Park Equestrian',
    colSpan2: true,
    inputProps: { maxLength: 160 },
    name: 'name',
  },
  {
    id: 'vf-address',
    label: 'Address',
    colSpan2: true,
    inputProps: { autoComplete: 'street-address', maxLength: 240 },
    name: 'address',
  },
  { id: 'vf-website', label: 'Website', inputProps: URL_INPUT_PROPS, name: 'website' },
  {
    id: 'vf-phone',
    label: 'Phone',
    inputProps: PHONE_INPUT_PROPS,
    name: 'phone',
    sanitize: sanitizePhoneInput,
  },
  {
    id: 'vf-contact',
    label: 'Contact',
    colSpan2: true,
    inputProps: { maxLength: 120 },
    name: 'contact',
  },
];

export function VenueDetailsFields({
  register,
  errors,
}: {
  register: UseFormRegister<VenueDetailsInput>;
  errors: FieldErrors<VenueDetailsInput>;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {FIELDS.map((f) => (
        <div key={f.id} className={cn(f.colSpan2 && 'col-span-2', 'space-y-1.5')}>
          <Label htmlFor={f.id}>
            {f.label} {f.required && <span className="text-status-danger">*</span>}
          </Label>
          <Input
            id={f.id}
            {...f.inputProps}
            placeholder={f.placeholder}
            {...(f.sanitize ? withSanitizer(register(f.name), f.sanitize) : register(f.name))}
          />
          {errors[f.name] && (
            <p role="alert" className="text-status-danger text-[13px]">
              {errors[f.name]?.message}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
