'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RIDER_CATEGORIES } from '@/modules/riders/constants';
import { riderDetailsFormSchema, type RiderDetailsFormInput } from '@/modules/riders/schemas';
import { useUpdateRiderProfile } from '@/modules/riders/hooks/use-rider-profile-mutations';
import type { RiderRow } from '@/modules/riders/types';
import { AuthField } from '@/shared/ui/auth/auth-field';
import { AuthSubmit } from '@/shared/ui/auth/auth-submit';

const SELECT_LABEL_CLASSES =
  'mb-[9px] block text-xs font-bold uppercase tracking-[.1em] text-forest';
const SELECT_CLASSES =
  'h-auto w-full rounded-xl border border-field bg-white px-4 py-[15px] text-[15px] text-ink-deep ' +
  'focus-visible:border-gold focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-gold/[.16]';

function asRiderCategory(value: string | null): RiderDetailsFormInput['category'] | undefined {
  const categories: readonly string[] = RIDER_CATEGORIES;
  return value && categories.includes(value)
    ? (value as RiderDetailsFormInput['category'])
    : undefined;
}

export function RiderDetailsForm({ rider }: { rider: RiderRow }) {
  const alreadySet = Boolean(rider.category && rider.dob);
  const form = useForm<RiderDetailsFormInput>({
    resolver: zodResolver(riderDetailsFormSchema),
    defaultValues: {
      usef: rider.usef ?? '',
      fei: rider.fei ?? '',
      category: asRiderCategory(rider.category),
      dob: rider.dob ?? '',
      ecFirstName: rider.ec_first_name ?? '',
      ecLastName: rider.ec_last_name ?? '',
      ecRel: rider.ec_rel ?? '',
      ecPhone: rider.ec_phone ?? '',
    },
  });
  const updateProfile = useUpdateRiderProfile();
  const { errors } = form.formState;

  if (alreadySet) {
    const credentials = [
      rider.usef ? `USEF ${rider.usef}` : '',
      rider.fei ? `FEI ${rider.fei}` : '',
    ]
      .filter(Boolean)
      .join(' · ');
    return (
      <div className="border-line [animation:fa-in_.22s_ease-out_both] rounded-2xl border bg-white p-6">
        <h2 className="text-forest mb-4 font-[family-name:var(--font-nr)] text-xl font-medium">
          Rider details
        </h2>
        <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <div>
            <div className="text-fa-muted text-xs font-bold tracking-[.1em] uppercase">
              Category
            </div>
            <div className="text-forest mt-1">{rider.category}</div>
          </div>
          <div>
            <div className="text-fa-muted text-xs font-bold tracking-[.1em] uppercase">
              Date of birth
            </div>
            <div className="text-forest mt-1">{rider.dob}</div>
          </div>
          {credentials && (
            <div>
              <div className="text-fa-muted text-xs font-bold tracking-[.1em] uppercase">
                Credentials
              </div>
              <div className="text-forest mt-1">{credentials}</div>
            </div>
          )}
          <div>
            <div className="text-fa-muted text-xs font-bold tracking-[.1em] uppercase">
              Emergency contact
            </div>
            <div className="text-forest mt-1">
              {[rider.ec_first_name, rider.ec_last_name].filter(Boolean).join(' ') || 'Not set'}
              {rider.ec_phone ? ` · ${rider.ec_phone}` : ''}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-line [animation:fa-in_.22s_ease-out_both] rounded-2xl border bg-white p-6">
      <h2 className="text-forest mb-1 font-[family-name:var(--font-nr)] text-xl font-medium">
        Rider details
      </h2>
      <p className="text-fa-muted mb-6 text-[13.5px]">
        Your USEF/FEI numbers, category, date of birth, and an emergency contact.
      </p>

      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit((values) => {
            updateProfile.mutate(values);
          })(event);
        }}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AuthField label="USEF number" placeholder="e.g. 5551234" {...form.register('usef')} />
          <AuthField label="FEI number" placeholder="e.g. 10012345" {...form.register('fei')} />

          <div>
            <label htmlFor="rd-category" className={SELECT_LABEL_CLASSES}>
              Rider class category
            </label>
            <select id="rd-category" {...form.register('category')} className={SELECT_CLASSES}>
              <option value="">Select category…</option>
              {RIDER_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="text-alert-fg mt-2 text-[13px]">{errors.category.message}</p>
            )}
          </div>

          <AuthField
            label="Date of birth"
            type="date"
            error={errors.dob?.message}
            {...form.register('dob')}
          />
        </div>

        <div className="border-line mt-6 border-t pt-6">
          <div className="text-forest mb-4 text-xs font-bold tracking-[.1em] uppercase">
            Emergency contact
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <AuthField
              label="Contact first name"
              error={errors.ecFirstName?.message}
              {...form.register('ecFirstName')}
            />
            <AuthField
              label="Contact last name"
              error={errors.ecLastName?.message}
              {...form.register('ecLastName')}
            />
            <AuthField label="Relationship" placeholder="e.g. Spouse" {...form.register('ecRel')} />
            <AuthField
              label="Contact phone"
              type="tel"
              error={errors.ecPhone?.message}
              {...form.register('ecPhone')}
            />
          </div>
        </div>

        <div className="mt-7">
          <AuthSubmit
            type="submit"
            variant="forest"
            showIcon={false}
            pending={updateProfile.isPending}
            pendingLabel="Saving…"
          >
            Save rider details
          </AuthSubmit>
        </div>
      </form>
    </div>
  );
}
