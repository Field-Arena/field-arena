'use client';

import type { ComponentProps } from 'react';
import type { FieldError } from 'react-hook-form';
import { Input } from '@/shared/ui/shadcn/input';

/**
 * Field chrome transcribed from the Admin Console design's own Add Organizer
 * modal, not the generic shadcn Input/Label — matching the hand-styled
 * convention the rest of the console already uses (lead-detail.tsx's INPUT/
 * LABEL consts, funnel-board.tsx's field styling). The shared FormField in
 * organizer-form-field.tsx renders shadcn's default sentence-case label and
 * generic border, which is what made this modal visibly diverge from the
 * design; it stays as-is for the dialogs that already use it rather than
 * changing their look too.
 */
const FIELD_LABEL =
  'mb-2 block text-[11px] font-bold uppercase tracking-[.12em] text-hunter-deep whitespace-nowrap';
const FIELD_INPUT =
  'w-full rounded-[9px] border border-[#D7E0DA] bg-white px-[14px] py-[13px] text-[14.5px] text-[#16261F] ' +
  'placeholder:text-[#98A29D] focus-visible:border-gold focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-gold/[.15]';

export function Field({
  id,
  label,
  error,
  type = 'text',
  placeholder,
  ...props
}: {
  id: string;
  label: string;
  error?: FieldError;
  type?: string;
  placeholder?: string;
} & ComponentProps<'input'>) {
  const errorId = `${id}-error`;

  return (
    <div>
      <label htmlFor={id} className={FIELD_LABEL}>
        {label}
      </label>
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        className={`h-auto ${FIELD_INPUT}`}
        {...props}
      />
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-[13px] text-status-danger">
          {error.message}
        </p>
      )}
    </div>
  );
}
