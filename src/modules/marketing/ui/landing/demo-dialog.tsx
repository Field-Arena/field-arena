'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRightIcon, CheckIcon, CircleAlertIcon, Loader2Icon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/shadcn/dialog';
import { Input } from '@/shared/ui/shadcn/input';
import { Label } from '@/shared/ui/shadcn/label';
import { Button } from '@/shared/ui/shadcn/button';
import { cn } from '@/shared/lib/utils';
import { DEMO_DISCIPLINES, DEMO_VOLUMES, CALENDLY_URL } from '@/modules/marketing/landing-content';
import { demoRequestSchema, type DemoRequestInput } from '@/modules/marketing/schemas';
import { useDemoRequest } from '@/modules/marketing/hooks/use-demo-request';

const DISPLAY = 'font-[family-name:var(--font-nr)]';
const FIELD =
  'h-auto w-full rounded-[10px] border-field bg-white px-4 py-3 text-[14.5px] text-ink-deep ' +
  'placeholder:text-[#9AA6A0] focus-visible:border-gold focus-visible:ring-[3px] focus-visible:ring-gold/[.16]';
const LABEL = 'mb-2 block text-xs font-bold uppercase tracking-[.1em] text-forest';

export function DemoDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
}) {
  const [sent, setSent] = useState(false);
  const request = useDemoRequest();

  const form = useForm<DemoRequestInput>({
    resolver: zodResolver(demoRequestSchema),
    defaultValues: {
      name: '',
      email: '',
      organization: '',
      discipline: 'Dressage',
      volume: '4–10',
      notes: '',
    },
  });

  const { errors } = form.formState;

  function close(next: boolean) {
    onOpenChange(next);
    if (!next) {
      setSent(false);
      form.reset();
      request.reset();
    }
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="border-line bg-paper max-h-[90vh] overflow-y-auto rounded-[18px] font-[family-name:var(--font-ar)] sm:max-w-[520px]">
        {sent ? (
          <div className="py-6 text-center">
            <span className="bg-mint text-forest mx-auto mb-5 grid size-12 place-items-center rounded-full">
              <CheckIcon className="size-6" aria-hidden />
            </span>
            <DialogTitle className={`${DISPLAY} text-forest mb-2.5 text-[30px] font-medium`}>
              Thank you — we have it.
            </DialogTitle>
            <DialogDescription className="text-fa-muted mx-auto max-w-[360px] text-[14.5px] leading-[1.6]">
              Pick a time that works and we&apos;ll bring a walkthrough built around your discipline
              and the way your shows actually run.
            </DialogDescription>
            <div className="mt-7 flex flex-col items-center gap-3">
              <a
                href={CALENDLY_URL}
                target="_blank"
                rel="noreferrer"
                className="bg-gold text-forest hover:bg-gold-light inline-flex h-auto items-center gap-2.5 rounded-[10px] px-6 py-3 text-sm font-bold transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_34px_rgba(201,162,39,.28)]"
              >
                Schedule your walkthrough
                <ArrowRightIcon className="size-[15px]" aria-hidden />
              </a>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  close(false);
                }}
                className="text-fa-muted hover:text-forest h-auto rounded-none px-0 py-0 text-[13.5px] font-semibold hover:bg-transparent"
              >
                Maybe later
              </Button>
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="mb-3 flex items-center gap-3">
                <span aria-hidden className="bg-gold h-[3px] w-[26px]" />
                <span className="text-forest text-[10.5px] font-bold tracking-[.18em] uppercase">
                  Book a demo
                </span>
              </div>
              <DialogTitle
                className={`${DISPLAY} text-forest text-[30px] leading-[1.04] font-medium tracking-[-.022em]`}
              >
                Tell us about your events.
              </DialogTitle>
              <DialogDescription className="text-fa-muted text-[14.5px] leading-[1.6]">
                We&apos;ll tailor the walkthrough to your discipline, competition format, and event
                size.
              </DialogDescription>
            </DialogHeader>

            <form
              noValidate
              className="mt-2 space-y-4"
              onSubmit={(event) => {
                void form.handleSubmit((values) => {
                  request.mutate(values, {
                    onSuccess: () => {
                      setSent(true);
                    },
                  });
                })(event);
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="demo-name" className={LABEL}>
                    Your name
                  </Label>
                  <Input
                    id="demo-name"
                    autoComplete="name"
                    placeholder="Jane Whitfield"
                    aria-invalid={!!errors.name}
                    className={FIELD}
                    {...form.register('name')}
                  />
                  <FieldError message={errors.name?.message} />
                </div>
                <div>
                  <Label htmlFor="demo-email" className={LABEL}>
                    Email
                  </Label>
                  <Input
                    id="demo-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@yourbarn.com"
                    aria-invalid={!!errors.email}
                    className={FIELD}
                    {...form.register('email')}
                  />
                  <FieldError message={errors.email?.message} />
                </div>
              </div>

              <div>
                <Label htmlFor="demo-org" className={LABEL}>
                  Organization
                </Label>
                <Input
                  id="demo-org"
                  autoComplete="organization"
                  placeholder="Meadowbrook Equestrian Center"
                  aria-invalid={!!errors.organization}
                  className={FIELD}
                  {...form.register('organization')}
                />
                <FieldError message={errors.organization?.message} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="demo-discipline" className={LABEL}>
                    Discipline
                  </Label>
                  <select
                    id="demo-discipline"
                    className={cn(FIELD, 'appearance-none')}
                    {...form.register('discipline')}
                  >
                    {DEMO_DISCIPLINES.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="demo-volume" className={LABEL}>
                    Shows per year
                  </Label>
                  <select
                    id="demo-volume"
                    className={cn(FIELD, 'appearance-none')}
                    {...form.register('volume')}
                  >
                    {DEMO_VOLUMES.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="demo-notes" className={LABEL}>
                  Anything else? <span className="font-medium normal-case">(optional)</span>
                </Label>
                <textarea
                  id="demo-notes"
                  rows={3}
                  placeholder="Entries, scoring, scheduling, volunteers, results, finances…"
                  className={cn(FIELD, 'resize-y')}
                  {...form.register('notes')}
                />
              </div>

              {request.error && (
                <p
                  role="alert"
                  className="border-alert-line bg-alert-bg text-alert-fg flex items-start gap-2 rounded-[10px] border px-3.5 py-3 text-[13.5px]"
                >
                  <CircleAlertIcon className="mt-0.5 size-[15px] flex-none" aria-hidden />
                  {request.error.message}
                </p>
              )}

              <Button
                type="submit"
                disabled={request.isPending}
                className="bg-gold text-forest hover:bg-gold-light h-auto w-full gap-2.5 rounded-[10px] px-6 py-[15px] text-[15px] font-bold transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_34px_rgba(201,162,39,.28)] disabled:translate-y-0 disabled:opacity-70"
              >
                {request.isPending ? 'Sending…' : 'Request a demo'}
                {request.isPending ? (
                  <Loader2Icon className="size-[15px] animate-spin" aria-hidden />
                ) : (
                  <ArrowRightIcon className="size-[15px]" aria-hidden />
                )}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-alert-fg mt-1.5 text-[12.5px]">
      {message}
    </p>
  );
}
