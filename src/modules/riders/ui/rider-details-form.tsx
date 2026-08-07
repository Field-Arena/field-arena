'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RIDER_CATEGORIES } from '../constants';
import { riderDetailsFormSchema, type RiderDetailsFormInput } from '../schemas';
import { useUpdateRiderProfile } from '../hooks/use-rider-profile-mutations';
import type { RiderRow } from '../types';
import { AuthField } from '@/shared/ui/auth/auth-field';
import { AuthSubmit } from '@/shared/ui/auth/auth-primitives';

/** Matches AuthField's own label treatment — that constant is module-private there, so it's repeated here for the one field (category) that isn't a plain `<input>`. */
const SELECT_LABEL_CLASSES = 'mb-[9px] block text-xs font-bold uppercase tracking-[.1em] text-forest';
const SELECT_CLASSES =
  'h-auto w-full rounded-xl border border-field bg-white px-4 py-[15px] text-[15px] text-ink-deep ' +
  'focus-visible:border-gold focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-gold/[.16]';

/**
 * A stored `riders.category` is free text at the DB level (no CHECK
 * constraint), so a legacy or hand-edited row could hold a value outside
 * RIDER_CATEGORIES — narrowed with a real runtime check rather than a bare
 * `as` cast, so that case falls back to "unset" instead of silently
 * defaulting react-hook-form's <select> to an option that isn't in the list.
 */
function asRiderCategory(value: string | null): RiderDetailsFormInput['category'] | undefined {
  const categories: readonly string[] = RIDER_CATEGORIES;
  return value && categories.includes(value)
    ? (value as RiderDetailsFormInput['category'])
    : undefined;
}

/**
 * Competition credentials + emergency contact — rider.html Step 3's
 * "Competition credentials" and "Emergency contact" cards, combined into one
 * form here since there's no multi-step wizard to split them across yet.
 * Styled with the same shared auth field kit (`@/shared/ui/auth/*`) the
 * sign-up/sign-in flow uses, rather than the plain shadcn inputs this form
 * had before — same visual language across the whole rider entry path, not
 * a jump from a polished signup screen straight into a bare form.
 *
 * USEF/FEI/category/dob and name are collected here but, once set, are NOT
 * re-editable from this form on a later visit — same "fixed 'who you are'
 * facts" rule as legacy's renderProfileTabReal (only phone/street/city/
 * emergency-contact stay editable after the first save). This form covers
 * the "not set yet" case; the post-purchase Profile tab is the locked,
 * read-only-plus-a-few-editable-fields view.
 */
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
    const credentials = [rider.usef ? `USEF ${rider.usef}` : '', rider.fei ? `FEI ${rider.fei}` : '']
      .filter(Boolean)
      .join(' · ');
    return (
      <div className="rounded-2xl border border-line bg-white p-6 [animation:fa-in_.22s_ease-out_both]">
        <h2 className="mb-4 font-[family-name:var(--font-nr)] text-xl font-medium text-forest">
          Rider details
        </h2>
        <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <div>
            <div className="text-xs font-bold uppercase tracking-[.1em] text-fa-muted">Category</div>
            <div className="mt-1 text-forest">{rider.category}</div>
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-[.1em] text-fa-muted">
              Date of birth
            </div>
            <div className="mt-1 text-forest">{rider.dob}</div>
          </div>
          {credentials && (
            <div>
              <div className="text-xs font-bold uppercase tracking-[.1em] text-fa-muted">
                Credentials
              </div>
              <div className="mt-1 text-forest">{credentials}</div>
            </div>
          )}
          <div>
            <div className="text-xs font-bold uppercase tracking-[.1em] text-fa-muted">
              Emergency contact
            </div>
            <div className="mt-1 text-forest">
              {[rider.ec_first_name, rider.ec_last_name].filter(Boolean).join(' ') || 'Not set'}
              {rider.ec_phone ? ` · ${rider.ec_phone}` : ''}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-line bg-white p-6 [animation:fa-in_.22s_ease-out_both]">
      <h2 className="mb-1 font-[family-name:var(--font-nr)] text-xl font-medium text-forest">
        Rider details
      </h2>
      <p className="mb-6 text-[13.5px] text-fa-muted">
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
              <p className="mt-2 text-[13px] text-alert-fg">{errors.category.message}</p>
            )}
          </div>

          <AuthField
            label="Date of birth"
            type="date"
            error={errors.dob?.message}
            {...form.register('dob')}
          />
        </div>

        <div className="mt-6 border-t border-line pt-6">
          <div className="mb-4 text-xs font-bold uppercase tracking-[.1em] text-forest">
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
