'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { riderDetailsFormSchema, type RiderDetailsFormInput } from '@/modules/riders/schemas';
import { useUpdateRiderProfile } from '@/modules/riders/hooks/use-rider-profile-mutations';
import type { RiderRow } from '@/modules/riders/types';
import { AuthField } from '@/shared/ui/auth/auth-field';
import { AuthSubmit } from '@/shared/ui/auth/auth-primitives';

const TYPE_HERE = 'Click here to type…';

export function RiderDetailsForm({ rider }: { rider: RiderRow }) {
  // Division is chosen per class at entry, so it no longer gates this step.
  const alreadySet = Boolean(rider.dob);
  const form = useForm<RiderDetailsFormInput>({
    resolver: zodResolver(riderDetailsFormSchema),
    defaultValues: {
      usef: rider.usef ?? '',
      fei: rider.fei ?? '',
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
        Your USEF/FEI numbers, date of birth, and an emergency contact. You choose your division
        (Open, Adult Amateur, Young Rider, Junior) for each class below.
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
          <AuthField
            label="USEF number"
            placeholder={`${TYPE_HERE} e.g. 5551234`}
            {...form.register('usef')}
          />
          <AuthField
            label="FEI number"
            placeholder={`${TYPE_HERE} e.g. 10012345`}
            {...form.register('fei')}
          />

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
              placeholder={TYPE_HERE}
              error={errors.ecFirstName?.message}
              {...form.register('ecFirstName')}
            />
            <AuthField
              label="Contact last name"
              placeholder={TYPE_HERE}
              error={errors.ecLastName?.message}
              {...form.register('ecLastName')}
            />
            <AuthField
              label="Relationship"
              placeholder={`${TYPE_HERE} e.g. Spouse`}
              {...form.register('ecRel')}
            />
            <AuthField
              label="Contact phone"
              type="tel"
              placeholder={TYPE_HERE}
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
