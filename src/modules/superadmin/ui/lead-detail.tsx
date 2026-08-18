import Link from 'next/link';
import { ArrowLeftIcon } from 'lucide-react';
import type { LeadRow } from '@/modules/superadmin/types';
import { toChecklist } from '@/modules/superadmin/utils/to-checklist';
import { LeadStatusPill } from '@/modules/superadmin/ui/lead-status-pill';
import { ContactSection } from '@/modules/superadmin/ui/lead-contact-section';
import { EconomicsSection } from '@/modules/superadmin/ui/lead-economics-section';
import { NotesSection } from '@/modules/superadmin/ui/lead-notes-section';
import { OnboardingSection } from '@/modules/superadmin/ui/lead-onboarding-section';

/**
 * The full target detail page — Contact & account, Deal economics, Notes, and
 * Onboarding — matching the Admin Console design. Each section saves
 * independently through updateLead, so one Save never touches another's fields.
 */
export function LeadDetail({ lead }: { lead: LeadRow }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-8">
        <div className="max-w-[700px]">
          <h1 className="mb-3 font-[family-name:var(--font-nr)] text-[32px] font-medium leading-[1.06] tracking-[-.022em] text-hunter-deep">
            {lead.org_name}
          </h1>
          <LeadStatusPill status={lead.status} size="md" />
        </div>
        <Link
          href="/dashboard/superadmin/sales"
          className="inline-flex items-center gap-2 rounded-[9px] border border-[#D7E0DA] bg-white px-[15px] py-2.5 text-[13px] font-semibold text-hunter-deep transition-colors hover:border-gold"
        >
          <ArrowLeftIcon className="size-[14px]" aria-hidden />
          Back to funnel
        </Link>
      </div>

      <ContactSection lead={lead} />
      <EconomicsSection lead={lead} />
      <NotesSection lead={lead} />
      {/*
        Keyed so the section remounts — and re-reads the checklist from props —
        when the checklist is first seeded (its length jumps 0→N) or re-sent
        (sent-at changes). Toggling an item's `done` flag does not change the
        length, so those edits are NOT lost to a remount before they are saved.
      */}
      <OnboardingSection
        key={`${lead.onboarding_email_sent_at ?? 'unsent'}:${String(
          toChecklist(lead.onboarding_checklist).length
        )}`}
        lead={lead}
      />
    </div>
  );
}
