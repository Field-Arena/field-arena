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
