'use client';

import { Loader2Icon, MailIcon } from 'lucide-react';
import { Button } from '@/shared/ui/shadcn/button';
import { Input } from '@/shared/ui/shadcn/input';
import { Label } from '@/shared/ui/shadcn/label';
import type { LeadRow } from '@/modules/superadmin/types';
import { useLeadOnboardingForm } from '@/modules/superadmin/hooks/use-lead-onboarding-form';
import { SECTION, H2, LABEL, INPUT, SAVE } from '@/modules/superadmin/ui/lead-detail-styles';

export function OnboardingSection({ lead }: { lead: LeadRow }) {
  const {
    when,
    setWhen,
    checklist,
    done,
    toggleItem,
    schedule,
    saveSchedule,
    saveChecklist,
    persistChecklist,
    send,
    sendOnboardingEmail,
  } = useLeadOnboardingForm(lead);

  return (
    <section className={SECTION}>
      <h2 className={`${H2} mb-4`}>Onboarding</h2>

      <div className="flex flex-wrap items-end gap-3.5">
        <div className="min-w-[220px] flex-[1_1_260px]">
          <Label htmlFor="ld-when" className={LABEL}>
            Onboarding date and time
          </Label>
          <Input
            id="ld-when"
            type="datetime-local"
            value={when}
            onChange={(e) => {
              setWhen(e.target.value);
            }}
            className={`h-auto ${INPUT}`}
          />
        </div>
        <Button
          type="button"
          variant="ghost"
          disabled={schedule.isPending}
          className={`h-auto hover:bg-transparent ${SAVE} px-[26px]`}
          onClick={saveSchedule}
        >
          {schedule.isPending ? 'Saving…' : 'Schedule'}
        </Button>
      </div>

      <p className="text-fa-muted-2 mt-4 text-[12.5px]">
        {lead.onboarding_email_sent_at
          ? 'Onboarding checklist has been emailed.'
          : 'No onboarding email sent yet.'}
      </p>

      {checklist.length > 0 && (
        <div className="mt-5 overflow-hidden rounded-xl border border-[#E2E8E4]">
          <div className="flex items-center gap-3 border-b border-[#E2E8E4] bg-[#F6F3EC] px-[18px] py-3.5">
            <span className="text-hunter-deep text-[12.5px] font-bold">Onboarding checklist</span>
            <span className="text-fa-muted ml-auto text-[12.5px] font-semibold">
              {done}/{checklist.length} done
            </span>
          </div>
          {checklist.map((item) => (
            <Button
              key={item.id}
              type="button"
              variant="ghost"
              onClick={() => {
                toggleItem(item.id);
              }}
              className="flex h-auto w-full items-start justify-start gap-3 border-b border-[#EEF2EF] px-[18px] py-3.5 text-left last:border-b-0 hover:bg-[#FAFCFB]"
            >
              <span
                className="grid size-[19px] flex-none place-items-center rounded-md border"
                style={{
                  borderColor: item.done ? '#C9A227' : '#D7E0DA',
                  background: item.done ? '#FFF8DF' : '#FFFFFF',
                }}
              >
                {item.done && (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#C9A227"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                )}
              </span>
              <span
                className="text-[13.5px] leading-[1.5]"
                style={{
                  color: item.done ? '#9AA6A0' : '#16261F',
                  textDecoration: item.done ? 'line-through' : 'none',
                }}
              >
                {item.label}
              </span>
            </Button>
          ))}
          <div className="px-[18px] py-3">
            <Button
              type="button"
              variant="ghost"
              disabled={saveChecklist.isPending}
              className="text-hunter-deep hover:text-gold h-auto px-0 py-0 text-[12.5px] font-bold underline underline-offset-2 hover:bg-transparent disabled:opacity-60"
              onClick={persistChecklist}
            >
              {saveChecklist.isPending ? 'Saving…' : 'Save checklist'}
            </Button>
          </div>
        </div>
      )}

      <div className="mt-[18px]">
        <Button
          type="button"
          variant="ghost"
          disabled={send.isPending}
          className="bg-gold text-hunter-deep hover:bg-gold-light inline-flex h-auto items-center gap-2 rounded-[9px] px-5 py-3 text-[13.5px] font-bold transition hover:shadow-[0_8px_24px_rgba(201,162,39,.26)] disabled:opacity-60"
          onClick={sendOnboardingEmail}
        >
          {send.isPending ? (
            <Loader2Icon className="size-[15px] animate-spin" aria-hidden />
          ) : (
            <MailIcon className="size-[15px]" aria-hidden />
          )}
          Send onboarding email
        </Button>
      </div>
    </section>
  );
}
