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

  const orgRows: FieldRow[][] = [
    [
      {
        id: 'name',
        label: 'Organization name',
        required: true,
        placeholder: 'Meadowbrook Equestrian Center',
        name: 'name',
      },
    ],
    [
      {
        id: 'email',
        label: 'Organization email',
        required: true,
        type: 'email',
        autoComplete: 'email',
        placeholder: 'office@yourorg.com',
        name: 'email',
      },
      { id: 'website', label: 'Website', placeholder: 'www.yourorg.com', name: 'website' },
    ],
    [
      {
        id: 'phone',
        label: 'Phone',
        type: 'tel',
        autoComplete: 'tel',
        placeholder: '(555) 555-0100',
        name: 'phone',
      },
    ],
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
          <OnboardingField
            key={f.id}
            id={f.id}
            label={f.label}
            required={f.required}
            error={errors[f.name]?.message}
          >
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
    <main className="bg-paper min-h-dvh px-5 py-10 font-[family-name:var(--font-ar)]">
      <div className="mx-auto max-w-[560px]">
        <div className="mb-7 flex items-center gap-[11px]">
          <span
            className={`bg-forest grid size-9 flex-none place-items-center rounded-lg ${DISPLAY} text-paper text-sm font-semibold tracking-[-.02em]`}
          >
            F&amp;A
          </span>
          <span className={`${DISPLAY} text-forest text-[19px] font-medium tracking-[-.01em]`}>
            Field &amp; Arena
          </span>
        </div>

        <div className="border-line rounded-[18px] border bg-white p-7 sm:p-9">
          <h1
            className={`${DISPLAY} text-forest mb-2.5 text-[30px] leading-[1.06] font-medium tracking-[-.022em]`}
          >
            Complete Your Organization Profile
          </h1>
          <p className="text-fa-muted mb-7 text-[14.5px] leading-[1.6]">
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
                className="border-alert-line bg-alert-bg text-alert-fg flex items-start gap-2 rounded-[10px] border px-3.5 py-3 text-[13.5px]"
              >
                <CircleAlertIcon className="mt-0.5 size-[15px] flex-none" aria-hidden />
                {submit.error.message}
              </p>
            )}

            <Button
              type="submit"
              variant="ghost"
              disabled={submit.isPending}
              className="bg-gold text-forest hover:bg-gold-light flex h-auto w-full items-center justify-center gap-2.5 rounded-[10px] px-6 py-[15px] text-[15px] font-bold transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_34px_rgba(201,162,39,.28)] disabled:translate-y-0 disabled:opacity-70"
            >
              {submit.isPending && <Loader2Icon className="size-[15px] animate-spin" aria-hidden />}
              {submit.isPending ? 'Saving…' : 'Finish setup'}
            </Button>

            <p className="text-fa-muted text-center text-[12.5px] leading-[1.6]">
              You can add shows, staff, and payment details once you&apos;re in.
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}
