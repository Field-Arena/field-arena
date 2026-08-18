'use client';

import { useId, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRightIcon, Loader2Icon, PlusIcon, XIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/shadcn/dialog';
import { Button } from '@/shared/ui/shadcn/button';
import { cn } from '@/shared/lib/utils';
import { createOrganizationSchema, type CreateOrganizationInput } from '@/modules/superadmin/schemas';
import { useCreateOrganization } from '@/modules/superadmin/hooks/use-organization-mutations';
import { INVITE_TTL_DAYS, GOVERNING_BODIES } from '@/modules/superadmin/constants';
import { Field } from '@/modules/superadmin/ui/add-organizer-field';

type GoverningBody = (typeof GOVERNING_BODIES)[number];

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
        <Button
          type="button"
          variant="ghost"
          className="h-auto inline-flex items-center gap-2 rounded-[9px] bg-gold px-4 py-[11px] text-[13.5px] font-bold text-hunter-deep hover:bg-gold-light transition hover:shadow-[0_8px_24px_rgba(201,162,39,.26)]"
        >
          <PlusIcon className="size-[15px]" aria-hidden />
          Add organizer
        </Button>
      </DialogTrigger>

      <DialogContent
        showCloseButton={false}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="max-h-[90vh] w-full max-w-[92vw] sm:max-w-[620px] gap-0 overflow-y-auto rounded-2xl border-[#E9EDEB] bg-[#F5F7F6] p-0 shadow-[0_40px_90px_rgba(9,26,21,.42)]"
      >
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setOpen(false);
          }}
          aria-label="Close"
          className="absolute right-6 top-6 grid size-8 place-items-center rounded-[10px] border border-[#E9EDEB] bg-[#EAF4EE] p-0 text-[#5A6B63] transition-colors hover:border-hunter-deep hover:bg-hunter-deep hover:text-paper"
        >
          <XIcon className="size-[14px]" aria-hidden />
        </Button>

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
              {(
                [
                  { id: 'ao-first', label: 'Contact first name', type: undefined, placeholder: 'Jane', name: 'contactFirstName' as const },
                  { id: 'ao-last', label: 'Contact last name', type: undefined, placeholder: 'Whitfield', name: 'contactLastName' as const },
                  { id: 'ao-title', label: 'Title', type: undefined, placeholder: 'Show secretary', name: 'contactTitle' as const },
                  {
                    id: 'ao-email',
                    label: 'Email — invite goes here',
                    type: 'email',
                    placeholder: 'jane@example.com',
                    name: 'contactEmail' as const,
                  },
                ]
              ).map((f) => (
                <Field
                  key={f.id}
                  id={f.id}
                  label={f.label}
                  type={f.type}
                  placeholder={f.placeholder}
                  error={errors[f.name]}
                  {...form.register(f.name)}
                />
              ))}
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
                    <Button
                      key={body}
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        toggleCert(body);
                      }}
                      className={cn(
                        'h-auto inline-flex items-center gap-2 rounded-full border px-[15px] py-[9px] text-[13px] font-bold hover:bg-transparent transition-colors',
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
                    </Button>
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
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setOpen(false);
              }}
              className="h-auto rounded-[9px] border border-[#D9E1DD] bg-white px-[18px] py-[11px] text-[13.5px] font-semibold text-hunter-deep hover:bg-transparent transition-colors hover:border-gold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="ghost"
              disabled={isPending}
              className="h-auto inline-flex items-center gap-[9px] whitespace-nowrap rounded-[9px] bg-gold px-5 py-3 text-[13.5px] font-bold text-hunter-deep hover:bg-gold-light transition hover:shadow-[0_8px_24px_rgba(201,162,39,.26)] disabled:opacity-60"
            >
              {isPending ? (
                <Loader2Icon className="size-[14px] animate-spin" aria-hidden />
              ) : (
                <ArrowRightIcon className="size-[14px]" aria-hidden />
              )}
              {isPending ? 'Sending invite…' : 'Send invite'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
