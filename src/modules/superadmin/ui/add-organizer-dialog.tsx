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
import {
  createOrganizationSchema,
  type CreateOrganizationInput,
} from '@/modules/superadmin/schemas';
import { useCreateOrganization } from '@/modules/superadmin/hooks/use-organization-mutations';
import { INVITE_TTL_DAYS, GOVERNING_BODIES } from '@/modules/superadmin/constants';
import { Field } from '@/modules/superadmin/ui/add-organizer-field';

type GoverningBody = (typeof GOVERNING_BODIES)[number];

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
      current.includes(body) ? current.filter((c) => c !== body) : [...current, body],
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" className="fa-btn fa-btn-primary h-auto">
          <PlusIcon className="size-[15px]" aria-hidden />
          Add organizer
        </Button>
      </DialogTrigger>

      <DialogContent
        showCloseButton={false}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="max-h-[90vh] w-full max-w-[92vw] gap-0 overflow-y-auto rounded-2xl border-[#E7EAEE] bg-[#F5F7F8] p-0 shadow-[0_40px_90px_rgba(9,26,21,.42)] sm:max-w-[620px]"
      >
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setOpen(false);
          }}
          aria-label="Close"
          className="hover:border-hunter-deep absolute top-6 right-6 grid size-8 place-items-center rounded-[10px] border border-[#E7EAEE] bg-[#EAF5EF] p-0 text-[#475467] transition-colors hover:bg-[#146A47] hover:text-white"
        >
          <XIcon className="size-[14px]" aria-hidden />
        </Button>

        <div className="border-b border-[#E7EAEE] px-8 pt-7 pb-[22px]">
          <div className="mb-3.5 flex items-center gap-3">
            <span aria-hidden className="h-[3px] w-6 bg-[#146A47]" />
            <span className="text-[10px] font-bold tracking-[.08em] text-[#101828] uppercase">
              New client
            </span>
          </div>
          <DialogTitle
            id={titleId}
            className="mb-2 font-[family-name:var(--font-nr)] text-[30px] leading-[1.06] font-medium tracking-[-.022em] text-[#101828]"
          >
            Add organizer
          </DialogTitle>
          <DialogDescription
            id={descriptionId}
            className="max-w-[460px] text-[13.5px] leading-[1.58] text-[#475467]"
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
          <div className="space-y-5 px-8 pt-[26px] pb-7">
            <Field
              id="ao-name"
              label="Organization name"
              placeholder="Peachtree Dressage Association"
              error={errors.name}
              {...form.register('name')}
            />

            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  id: 'ao-first',
                  label: 'Contact first name',
                  type: undefined,
                  placeholder: 'Jane',
                  name: 'contactFirstName' as const,
                },
                {
                  id: 'ao-last',
                  label: 'Contact last name',
                  type: undefined,
                  placeholder: 'Whitfield',
                  name: 'contactLastName' as const,
                },
                {
                  id: 'ao-title',
                  label: 'Title',
                  type: undefined,
                  placeholder: 'Show secretary',
                  name: 'contactTitle' as const,
                },
                {
                  id: 'ao-email',
                  label: 'Email — invite goes here',
                  type: 'email',
                  placeholder: 'jane@example.com',
                  name: 'contactEmail' as const,
                },
              ].map((f) => (
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

            <div className="border-t border-[#EEF1F4] pt-[22px]">
              <p className="mb-1 text-[11px] font-bold tracking-[.08em] text-[#101828] uppercase">
                Governing body certification
              </p>
              <p className="mb-3 text-[12.5px] text-[#8A94A3]">
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
                        'inline-flex h-auto items-center gap-2 rounded-full border px-[15px] py-[9px] text-[13px] font-bold transition-colors hover:bg-transparent',
                        on
                          ? 'border-hunter-deep bg-[#146A47] text-white'
                          : 'border-[#E7EAEE] bg-white text-[#475467]',
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          'size-1.5 rounded-full',
                          on ? 'bg-[#146A47]' : 'bg-[#C3CAD3]',
                        )}
                      />
                      {body}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 border-t border-[#E7EAEE] bg-[#EAF5EF] px-8 py-[18px]">
            <span className="mr-auto text-[12.5px] whitespace-nowrap text-[#475467]">
              Invite expires in {INVITE_TTL_DAYS} days.
            </span>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setOpen(false);
              }}
              className="h-auto rounded-[9px] border border-[#E7EAEE] bg-white px-[18px] py-[11px] text-[13.5px] font-semibold text-[#101828] transition-colors hover:border-[#D6DBE1] hover:bg-transparent"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="ghost"
              disabled={isPending}
              className="inline-flex h-auto items-center gap-[9px] rounded-[9px] bg-[#146A47] px-5 py-3 text-[13.5px] font-bold whitespace-nowrap text-white transition hover:bg-[#0E5537] hover:shadow-[0_8px_24px_rgba(201,162,39,.26)] disabled:opacity-60"
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
