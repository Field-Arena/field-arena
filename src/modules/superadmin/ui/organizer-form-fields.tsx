'use client';

import type { FieldError } from 'react-hook-form';
import { Input } from '@/shared/ui/shadcn/input';
import { Label } from '@/shared/ui/shadcn/label';

/**
 * One labelled text field with its validation message.
 *
 * Extracted because the add and edit organizer dialogs share eight of these, and
 * the error wiring — aria-invalid plus aria-describedby pointing at the message —
 * is exactly the part that gets forgotten when it is retyped per field.
 */
export function FormField({
  id,
  label,
  error,
  type = 'text',
  placeholder,
  autoComplete,
  registration,
}: {
  id: string;
  label: string;
  error?: FieldError;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  registration: Record<string, unknown>;
}) {
  const errorId = `${id}-error`;

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        {...registration}
      />
      {error && (
        <p id={errorId} role="alert" className="text-status-danger text-[13px]">
          {error.message}
        </p>
      )}
    </div>
  );
}

/** The fee-model select, shared by both dialogs. */
export function FeeModelField({
  id,
  registration,
}: {
  id: string;
  registration: Record<string, unknown>;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>Fee model</Label>
      <select
        id={id}
        className="h-9 w-full rounded-lg border border-border bg-white px-2.5 text-[13.5px] text-ink outline-none focus-visible:border-gold focus-visible:ring-2 focus-visible:ring-gold/30"
        {...registration}
      >
        <option value="default">Default — $7.99 floor, then 8%</option>
        <option value="gmo">GMO — flat 18%, no floor</option>
      </select>
      <p className="text-fa-muted text-xs leading-relaxed">
        Applies to class entry fees only. Add-ons, qualifying fees and vendor booths always take a
        flat 8% regardless of this setting.
      </p>
    </div>
  );
}
