'use client';

import { useId, useState, type ComponentProps } from 'react';
import { useForm, type FieldError } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRightIcon, Loader2Icon, PlusIcon, XIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/shadcn/dialog';
import { cn } from '@/shared/lib/utils';
import { createOrganizationSchema, type CreateOrganizationInput } from '../schemas';
import { useCreateOrganization } from '../hooks/use-organization-mutations';
import { INVITE_TTL_DAYS } from '../constants';

/** The three governing bodies offered on the Admin Console's Add Organizer modal. */
const GOVERNING_BODIES = ['FEI', 'USDF', 'USEF'] as const;
type GoverningBody = (typeof GOVERNING_BODIES)[number];

/**
 * Field chrome transcribed from the Admin Console design's own Add Organizer
 * modal, not the generic shadcn Input/Label — matching the hand-styled
 * convention the rest of the console already uses (lead-detail.tsx's INPUT/
 * LABEL consts, funnel-board.tsx's field styling). The shared FormField in
 * organizer-form-fields.tsx renders shadcn's default sentence-case label and
 * generic border, which is what made this modal visibly diverge from the
 * design; it stays as-is for the dialogs that already use it rather than
 * changing their look too.
 */
const FIELD_LABEL =
  'mb-2 block text-[11px] font-bold uppercase tracking-[.12em] text-hunter-deep whitespace-nowrap';
const FIELD_INPUT =
  'w-full rounded-[9px] border border-[#D7E0DA] bg-white px-[14px] py-[13px] text-[14.5px] text-[#16261F] ' +
  'placeholder:text-[#98A29D] focus-visible:border-gold focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-gold/[.15]';

function Field({
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
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        className={FIELD_INPUT}
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

/**
 * "+ Add Organizer", matching the Admin Console design's own modal — its own
 * custom chrome (off-white body, mint footer bar, boxed close button) rather
 * than the generic Dialog header/footer.
 *
 * The dialog's width is set BOTH unprefixed and under `sm:` on purpose:
 * shadcn's DialogContent ships a hard-coded `sm:max-w-sm` (384px) in its own
 * default className, and Tailwind treats an unprefixed override and a `sm:`
 * default as two different rules rather than a conflict — so overriding only
 * the unprefixed one still lost to `sm:max-w-sm` on any normal desktop
 * viewport, squeezing every field's label onto two lines. Matching the same
 * `sm:` prefix is what actually cancels it.
 *
 * Creates the organization and its owner invite together, because an
 * organization whose owner has never accepted cannot be administered by anyone
 * but a SuperAdmin.
 *
 * City/region/country and the fee model are collected later — the design's Add
 * Organizer modal only asks for the organization name and the owner's contact
 * details; the rest is filled in during onboarding (or from Edit Organizer).
 * They still go out on the create call so the schema's requirements are met,
 * just at their defaults from `form`'s defaultValues rather than from a field
 * the visitor sees.
 */
export function AddOrganizerDialog() {
  const [open, setOpen] = useState(false);
  const [certs, setCerts] = useState<GoverningBody[]>([]);
  const titleId = useId();
  const descriptionId = useId();

  const form = useForm<CreateOrganizationInput>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: {
      name: '',
      contactFirstName: '',
      contactLastName: '',
      contactTitle: '',
      contactEmail: '',
      city: '',
      region: '',
      country: 'US',
      feeModel: 'default',
    },
  });

  const { mutate, isPending } = useCreateOrganization({
    onSuccess: () => {
      setOpen(false);
      form.reset();
      setCerts([]);
    },
  });

  const { errors } = form.formState;

  function toggleCert(body: GoverningBody) {
    setCerts((current) =>
      current.includes(body) ? current.filter((c) => c !== body) : [...current, body]
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-[9px] bg-gold px-4 py-[11px] text-[13.5px] font-bold text-hunter-deep transition hover:bg-gold-light hover:shadow-[0_8px_24px_rgba(201,162,39,.26)]"
        >
          <PlusIcon className="size-[15px]" aria-hidden />
          Add organizer
        </button>
      </DialogTrigger>

      <DialogContent
        showCloseButton={false}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="max-h-[90vh] w-full max-w-[92vw] sm:max-w-[620px] gap-0 overflow-y-auto rounded-2xl border-[#E9EDEB] bg-[#F5F7F6] p-0 shadow-[0_40px_90px_rgba(9,26,21,.42)]"
      >
        <button
          type="button"
          onClick={() => {
            setOpen(false);
          }}
          aria-label="Close"
          className="absolute right-6 top-6 grid size-8 place-items-center rounded-[10px] border border-[#E9EDEB] bg-[#EAF4EE] text-[#5A6B63] transition-colors hover:border-hunter-deep hover:bg-hunter-deep hover:text-paper"
        >
          <XIcon className="size-[14px]" aria-hidden />
        </button>

        <div className="border-b border-[#E9EDEB] px-8 pb-[22px] pt-7">
          <div className="mb-3.5 flex items-center gap-3">
            <span aria-hidden className="h-[3px] w-6 bg-gold" />
            <span className="text-[10px] font-bold uppercase tracking-[.18em] text-hunter-deep">
              New client
            </span>
          </div>
          <DialogTitle
            id={titleId}
            className="mb-2 font-[family-name:var(--font-nr)] text-[30px] font-medium leading-[1.06] tracking-[-.022em] text-hunter-deep"
          >
            Add organizer
          </DialogTitle>
          <DialogDescription
            id={descriptionId}
            className="max-w-[460px] text-[13.5px] leading-[1.58] text-fa-muted"
          >
            They&apos;ll get an email to set a password, then fill in disciplines, venues, and team
            themselves.
          </DialogDescription>
        </div>

        <form
          onSubmit={(event) => {
            void form.handleSubmit((values) => {
              mutate(values);
            })(event);
          }}
          noValidate
        >
          <div className="space-y-5 px-8 pb-7 pt-[26px]">
            <Field
              id="ao-name"
              label="Organization name"
              placeholder="Peachtree Dressage Association"
              error={errors.name}
              {...form.register('name')}
            />

            <div className="grid grid-cols-2 gap-4">
              <Field
                id="ao-first"
                label="Contact first name"
                placeholder="Jane"
                error={errors.contactFirstName}
                {...form.register('contactFirstName')}
              />
              <Field
                id="ao-last"
                label="Contact last name"
                placeholder="Whitfield"
                error={errors.contactLastName}
                {...form.register('contactLastName')}
              />
              <Field
                id="ao-title"
                label="Title"
                placeholder="Show secretary"
                error={errors.contactTitle}
                {...form.register('contactTitle')}
              />
              <Field
                id="ao-email"
                label="Email — invite goes here"
                type="email"
                placeholder="jane@example.com"
                error={errors.contactEmail}
                {...form.register('contactEmail')}
              />
            </div>

            <div className="border-t border-[#EEF2EF] pt-[22px]">
              <p className="mb-1 text-[11px] font-bold uppercase tracking-[.12em] text-hunter-deep">
                Governing body certification
              </p>
              <p className="mb-3 text-[12.5px] text-fa-muted-2">
                Optional — sets which rule sets and membership checks their shows can use.
              </p>
              <div className="flex flex-wrap gap-[9px]">
                {GOVERNING_BODIES.map((body) => {
                  const on = certs.includes(body);
                  return (
                    <button
                      key={body}
                      type="button"
                      onClick={() => {
                        toggleCert(body);
                      }}
                      className={cn(
                        'inline-flex items-center gap-2 rounded-full border px-[15px] py-[9px] text-[13px] font-bold transition-colors',
                        on
                          ? 'border-hunter-deep bg-hunter-deep text-white'
                          : 'border-[#D7E0DA] bg-white text-[#5A6B63]'
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn('size-1.5 rounded-full', on ? 'bg-gold' : 'bg-[#C4CDC8]')}
                      />
                      {body}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 border-t border-[#E9EDEB] bg-[#EAF4EE] px-8 py-[18px]">
            {/* Matches the design's own footer copy exactly. The "no email
                provider configured" caveat is real and important, but it
                belongs on the Resend Invites tooltip beside it (which already
                states it) rather than wedged into this line, which the design
                draws as one short sentence. */}
            <span className="mr-auto whitespace-nowrap text-[12.5px] text-[#5A6B63]">
              Invite expires in {INVITE_TTL_DAYS} days.
            </span>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
              }}
              className="rounded-[9px] border border-[#D9E1DD] bg-white px-[18px] py-[11px] text-[13.5px] font-semibold text-hunter-deep transition-colors hover:border-gold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-[9px] whitespace-nowrap rounded-[9px] bg-gold px-5 py-3 text-[13.5px] font-bold text-hunter-deep transition hover:bg-gold-light hover:shadow-[0_8px_24px_rgba(201,162,39,.26)] disabled:opacity-60"
            >
              {isPending ? (
                <Loader2Icon className="size-[14px] animate-spin" aria-hidden />
              ) : (
                <ArrowRightIcon className="size-[14px]" aria-hidden />
              )}
              {isPending ? 'Sending invite…' : 'Send invite'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
