'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CircleAlertIcon, Loader2Icon } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { completeOrgProfileSchema, type CompleteOrgProfileInput } from '../schemas';
import { useCompleteOrgProfile } from '../hooks/use-organization-profile';

const DISPLAY = 'font-[family-name:var(--font-nr)]';
const FIELD =
  'h-auto w-full rounded-[10px] border border-field bg-white px-4 py-3 text-[14.5px] text-ink-deep ' +
  'placeholder:text-[#9AA6A0] focus-visible:border-gold focus-visible:outline-none ' +
  'focus-visible:ring-[3px] focus-visible:ring-gold/[.15]';
const LABEL = 'mb-2 block text-xs font-bold uppercase tracking-[.1em] text-forest';
const GROUP = 'mb-3 text-[10.5px] font-bold uppercase tracking-[.18em] text-gold';

/**
 * "Complete Your Organization Profile" — the first screen an invited organizer
 * sees.
 *
 * Standalone rather than inside the dashboard shell, matching the design: at
 * this point the organizer has an account and an empty organization, so a
 * workspace with a show picker and eleven navigation items would be a shell
 * around nothing.
 *
 * Only name and email are required. The rest is genuinely optional — an
 * organizer who does not yet know which region they will run in should not be
 * blocked at the door, and every field here is editable later from the
 * workspace.
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

              <Field id="name" label="Organization name" required error={errors.name?.message}>
                <input
                  id="name"
                  className={FIELD}
                  placeholder="Meadowbrook Equestrian Center"
                  {...form.register('name')}
                />
              </Field>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field
                  id="email"
                  label="Organization email"
                  required
                  error={errors.email?.message}
                >
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    className={FIELD}
                    placeholder="office@yourorg.com"
                    {...form.register('email')}
                  />
                </Field>
                <Field id="website" label="Website" error={errors.website?.message}>
                  <input
                    id="website"
                    className={FIELD}
                    placeholder="www.yourorg.com"
                    {...form.register('website')}
                  />
                </Field>
              </div>

              <div className="mt-4">
                <Field id="phone" label="Phone" error={errors.phone?.message}>
                  <input
                    id="phone"
                    type="tel"
                    autoComplete="tel"
                    className={FIELD}
                    placeholder="(555) 555-0100"
                    {...form.register('phone')}
                  />
                </Field>
              </div>
            </div>

            <div>
              <div className={cn(GROUP, 'pt-2')}>Location</div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="city" label="City" error={errors.city?.message}>
                  <input
                    id="city"
                    className={FIELD}
                    placeholder="e.g. Asheville"
                    {...form.register('city')}
                  />
                </Field>
                <Field id="region" label="State / Region" error={errors.region?.message}>
                  <input
                    id="region"
                    className={FIELD}
                    placeholder="e.g. NC"
                    {...form.register('region')}
                  />
                </Field>
              </div>

              <div className="mt-4">
                <Field id="country" label="Country" error={errors.country?.message}>
                  <input id="country" className={FIELD} {...form.register('country')} />
                </Field>
              </div>
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

            <button
              type="submit"
              disabled={submit.isPending}
              className="flex h-auto w-full items-center justify-center gap-2.5 rounded-[10px] bg-gold px-6 py-[15px] text-[15px] font-bold text-forest transition-all hover:-translate-y-0.5 hover:bg-gold-light hover:shadow-[0_12px_34px_rgba(201,162,39,.28)] disabled:translate-y-0 disabled:opacity-70"
            >
              {submit.isPending && <Loader2Icon className="size-[15px] animate-spin" aria-hidden />}
              {submit.isPending ? 'Saving…' : 'Finish setup'}
            </button>

            <p className="text-center text-[12.5px] leading-[1.6] text-fa-muted">
              You can add shows, staff, and payment details once you&apos;re in.
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}

function Field({
  id,
  label,
  required,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className={LABEL}>
        {label}
        {required && (
          <span aria-hidden className="ml-1 text-gold">
            *
          </span>
        )}
      </label>
      {children}
      {error && (
        <p role="alert" className="mt-1.5 text-[12.5px] text-alert-fg">
          {error}
        </p>
      )}
    </div>
  );
}
