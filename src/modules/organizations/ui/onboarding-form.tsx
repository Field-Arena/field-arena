'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CircleAlertIcon, Loader2Icon } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { Input } from '@/shared/ui/shadcn/input';
import { Button } from '@/shared/ui/shadcn/button';
import {
  completeOrgProfileSchema,
  type CompleteOrgProfileInput,
} from '@/modules/organizations/schemas';
import { useCompleteOrgProfile } from '@/modules/organizations/hooks/use-organization-profile';
import { OnboardingField } from '@/modules/organizations/ui/onboarding-field';

const DISPLAY = 'font-[family-name:var(--font-nr)]';
const FIELD =
  'h-auto w-full rounded-[10px] border border-field bg-white px-4 py-3 text-[14.5px] text-ink-deep ' +
  'placeholder:text-[#9AA6A0] focus-visible:border-gold focus-visible:outline-none ' +
  'focus-visible:ring-[3px] focus-visible:ring-gold/[.15]';
const GROUP = 'mb-3 text-[10.5px] font-bold uppercase tracking-[.18em] text-gold';

interface FieldRow {
  id: string;
  label: string;
  required?: boolean;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  name: keyof CompleteOrgProfileInput;
}

/**
 * "Complete Your Organization Profile" — the first screen an invited organizer
 * sees.
 *
 * Standalone rather than inside the dashboard shell: at this point the
 * organizer has an account and an empty organization, so a workspace shell
 * would be wrapped around nothing.
 *
 * Only name and email are required — every other field is editable later
 * from the workspace.
 */
export function OnboardingForm({ defaults }: { defaults: Partial<CompleteOrgProfileInput> }) {
  const form = useForm<CompleteOrgProfileInput>({
    resolver: zodResolver(completeOrgProfileSchema),
    defaultValues: {
      name: defaults.name ?? '',
      email: defaults.email ?? '',
      website: defaults.website ?? '',
      phone: defaults.phone ?? '',
      city: defaults.city ?? '',
      region: defaults.region ?? '',
      country: defaults.country ?? 'United States',
    },
  });

  const submit = useCompleteOrgProfile();
  const { errors } = form.formState;

  // Grouped by the design's layout — each row is one or two fields sharing a
  // grid line, so a single .map() per row preserves the exact markup shape.
  const orgRows: FieldRow[][] = [
    [{ id: 'name', label: 'Organization name', required: true, placeholder: 'Meadowbrook Equestrian Center', name: 'name' }],
    [
      { id: 'email', label: 'Organization email', required: true, type: 'email', autoComplete: 'email', placeholder: 'office@yourorg.com', name: 'email' },
      { id: 'website', label: 'Website', placeholder: 'www.yourorg.com', name: 'website' },
    ],
    [{ id: 'phone', label: 'Phone', type: 'tel', autoComplete: 'tel', placeholder: '(555) 555-0100', name: 'phone' }],
  ];
  const locationRows: FieldRow[][] = [
    [
      { id: 'city', label: 'City', placeholder: 'e.g. Asheville', name: 'city' },
      { id: 'region', label: 'State / Region', placeholder: 'e.g. NC', name: 'region' },
    ],
    [{ id: 'country', label: 'Country', name: 'country' }],
  ];

  function renderRow(row: FieldRow[], withTopMargin: boolean) {
    return (
      <div
        key={row.map((f) => f.id).join('-')}
        className={cn(row.length > 1 && 'grid gap-4 sm:grid-cols-2', withTopMargin && 'mt-4')}
      >
        {row.map((f) => (
          <OnboardingField key={f.id} id={f.id} label={f.label} required={f.required} error={errors[f.name]?.message}>
            <Input
              id={f.id}
              type={f.type}
              autoComplete={f.autoComplete}
              className={FIELD}
              placeholder={f.placeholder}
              {...form.register(f.name)}
            />
          </OnboardingField>
        ))}
      </div>
    );
  }

  return (
    <main className="min-h-dvh bg-paper px-5 py-10 font-[family-name:var(--font-ar)]">
      <div className="mx-auto max-w-[560px]">
        <div className="mb-7 flex items-center gap-[11px]">
          <span
            className={`grid size-9 flex-none place-items-center rounded-lg bg-forest ${DISPLAY} text-sm font-semibold tracking-[-.02em] text-paper`}
          >
            F&amp;A
          </span>
          <span className={`${DISPLAY} text-[19px] font-medium tracking-[-.01em] text-forest`}>
            Field &amp; Arena
          </span>
        </div>

        <div className="rounded-[18px] border border-line bg-white p-7 sm:p-9">
          <h1
            className={`${DISPLAY} mb-2.5 text-[30px] font-medium leading-[1.06] tracking-[-.022em] text-forest`}
          >
            Complete Your Organization Profile
          </h1>
          <p className="mb-7 text-[14.5px] leading-[1.6] text-fa-muted">
            Welcome to Field &amp; Arena. A few details about your organization and you&apos;re
            ready to build your first show.
          </p>

          <form
            noValidate
            className="space-y-5"
            onSubmit={(event) => {
              void form.handleSubmit((values) => {
                submit.mutate(values);
              })(event);
            }}
          >
            <div>
              <div className={GROUP}>Organization</div>
              {orgRows.map((row, i) => renderRow(row, i > 0))}
            </div>

            <div>
              <div className={cn(GROUP, 'pt-2')}>Location</div>
              {locationRows.map((row, i) => renderRow(row, i > 0))}
            </div>

            {submit.error && (
              <p
                role="alert"
                className="flex items-start gap-2 rounded-[10px] border border-alert-line bg-alert-bg px-3.5 py-3 text-[13.5px] text-alert-fg"
              >
                <CircleAlertIcon className="mt-0.5 size-[15px] flex-none" aria-hidden />
                {submit.error.message}
              </p>
            )}

            <Button
              type="submit"
              variant="ghost"
              disabled={submit.isPending}
              className="h-auto flex w-full items-center justify-center gap-2.5 rounded-[10px] bg-gold px-6 py-[15px] text-[15px] font-bold text-forest hover:bg-gold-light transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_34px_rgba(201,162,39,.28)] disabled:translate-y-0 disabled:opacity-70"
            >
              {submit.isPending && <Loader2Icon className="size-[15px] animate-spin" aria-hidden />}
              {submit.isPending ? 'Saving…' : 'Finish setup'}
            </Button>

            <p className="text-center text-[12.5px] leading-[1.6] text-fa-muted">
              You can add shows, staff, and payment details once you&apos;re in.
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}
