'use client';

import type { UseFormRegister, FieldErrors } from 'react-hook-form';
import { Input } from '@/shared/ui/shadcn/input';
import { Label } from '@/shared/ui/shadcn/label';
import { cn } from '@/shared/lib/utils';
import type { VenueDetailsInput } from '@/modules/organizations/schemas';

interface DetailField {
  id: string;
  label: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
  colSpan2?: boolean;
  name: keyof VenueDetailsInput;
  /** Only `name` shows a validation error inline — the rest are optional with nothing worth surfacing. */
  showsError?: boolean;
}

const FIELDS: DetailField[] = [
  {
    id: 'vf-name',
    label: 'Location name',
    required: true,
    placeholder: 'e.g. Wills Park Equestrian',
    colSpan2: true,
    name: 'name',
    showsError: true,
  },
  { id: 'vf-address', label: 'Address', colSpan2: true, name: 'address' },
  { id: 'vf-website', label: 'Website', type: 'url', name: 'website' },
  { id: 'vf-phone', label: 'Phone', type: 'tel', name: 'phone' },
  { id: 'vf-contact', label: 'Contact', colSpan2: true, name: 'contact' },
];

/** The name/address/website/phone/contact fields at the top of VenueFormDialog. */
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
          <Input id={f.id} type={f.type} placeholder={f.placeholder} {...register(f.name)} />
          {f.showsError && errors[f.name] && (
            <p role="alert" className="text-status-danger text-[13px]">
              {errors[f.name]?.message}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
