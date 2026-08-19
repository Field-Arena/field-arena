'use client';

import { useState, type ReactNode } from 'react';
import { ExternalLinkIcon } from 'lucide-react';
import { StepPillNav, type StepPillNavStep } from '@/shared/ui/step-pill-nav';
import { OrganizerOnboardingPreview } from '@/modules/superadmin/ui/organizer-onboarding-preview';
import { ShowStaffWorkspacePreview } from '@/modules/superadmin/ui/show-staff-workspace-preview';
import { JudgeScribePreview } from '@/modules/superadmin/ui/judge-scribe-preview';
import { AnnouncerPreview } from '@/modules/superadmin/ui/announcer-preview';
import { VendorBookingsPreview } from '@/modules/superadmin/ui/vendor-bookings-preview';

interface PreviewStep extends StepPillNavStep {
  href: string | null;

  embeddable: boolean;

  demo?: ReactNode;
}

export function SignupFlowPreview({ vendorShowId }: { vendorShowId: string | null }) {
  const [activeIndex, setActiveIndex] = useState(0);

  const steps: PreviewStep[] = [
    {
      key: 'organizer',
      label: 'Organizer',
      title: 'Organizer — new organization onboarding',
      sub: 'Reached only via SuperAdmin creating a brand-new org — an existing organizer never sees this again after their first setup.',
      href: '/onboarding',
      embeddable: false,
      demo: <OrganizerOnboardingPreview />,
    },
    {
      key: 'showadmin',
      label: 'ShowAdmin / ShowStaff',
      title: 'ShowAdmin & ShowStaff — the ShowManager workspace',
      sub: 'Neither role has a dedicated invite-acceptance page — an invited ShowAdmin/ShowStaff gets a plain email, then signs in through the general login and lands directly in their workspace.',
      href: '/dashboard',
      embeddable: false,
      demo: <ShowStaffWorkspacePreview />,
    },
    {
      key: 'rider',
      label: 'Rider',
      title: 'Rider — signup, ticket purchase & account',
      sub: 'The real entry wizard: account/sign-in first, then choose classes, then rider details, then payment. Click the step pills at the top of the frame to move through it.',
      href: '/rider/demo',
      embeddable: true,
    },
    {
      key: 'judge',
      label: 'Judge / Scribe',
      title: 'Judge & Scribe — invite acceptance and workspace',
      sub: 'The real invite email links here — accepting lands a Judge or Scribe straight in their scoring workspace.',
      href: '/dashboard/judging',
      embeddable: false,
      demo: <JudgeScribePreview />,
    },
    {
      key: 'announcer',
      label: 'Announcer',
      title: 'Announcer — invite acceptance and workspace',
      sub: 'Same invite pattern as Judge/Scribe — accepting lands the Announcer in the running-order and ring board.',
      href: '/dashboard/announcing',
      embeddable: false,
      demo: <AnnouncerPreview />,
    },
    {
      key: 'vendor',
      label: 'Vendor',
      title: 'Vendor — booth application & bookings',
      sub: 'Vendor invites aren’t wired to a real emailed link yet (a known gap) — this is the vendor’s own dashboard, with built-in demo bookings.',
      href: vendorShowId ? `/vendor-apply/${vendorShowId}` : null,
      embeddable: false,
      demo: <VendorBookingsPreview />,
    },
  ];

  const step = steps[activeIndex];

  return (
    <StepPillNav
      steps={steps}
      activeIndex={activeIndex}
      onJump={setActiveIndex}
      onPrev={() => {
        setActiveIndex((i) => Math.max(0, i - 1));
      }}
      onNext={() => {
        setActiveIndex((i) => Math.min(steps.length - 1, i + 1));
      }}
    >
      {step?.embeddable && step.href ? (
        <div className="mx-auto flex h-full max-w-4xl flex-col">
          <div className="border-line mb-3 flex flex-none items-center justify-between gap-3 rounded-xl border bg-white px-4 py-3">
            <p className="text-fa-muted text-xs">
              Live, public route — no login needed, same as the real entry point.
            </p>
            <a
              href={step.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-forest hover:text-gold inline-flex flex-none items-center gap-1.5 text-xs font-bold"
            >
              Open in new tab <ExternalLinkIcon className="size-3.5" aria-hidden />
            </a>
          </div>
          <div className="border-line h-[70vh] flex-none overflow-hidden rounded-xl border bg-white">
            <iframe src={step.href} title={step.title} className="h-full w-full border-0" />
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-4xl">
          <div className="border-line mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white px-4 py-3">
            <p className="text-fa-muted text-xs">
              Demo content — sample data, no login, nothing here is saved or real.
            </p>
            {step?.href && (
              <a
                href={step.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-forest hover:text-gold inline-flex flex-none items-center gap-1.5 text-xs font-bold"
              >
                Open live route <ExternalLinkIcon className="size-3.5" aria-hidden />
              </a>
            )}
          </div>
          {step?.demo}
        </div>
      )}
    </StepPillNav>
  );
}
