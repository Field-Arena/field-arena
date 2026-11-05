'use client';

import { useState } from 'react';
import { CheckCircle2Icon } from 'lucide-react';
import { Button } from '@/shared/ui/shadcn/button';
import { DISPLAY, GROUP } from '@/modules/superadmin/ui/signup-preview-styles';
import { DemoField } from '@/modules/superadmin/ui/demo-field';

export function OrganizerOnboardingPreview() {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="mx-auto max-w-[560px] rounded-[18px] border border-[#E7EAEE] bg-white p-9 text-center">
        <CheckCircle2Icon className="mx-auto mb-3 size-8 text-[#101828]" aria-hidden />
        <h1 className={`${DISPLAY} mb-2 text-2xl font-medium text-[#101828]`}>
          You&apos;re all set
        </h1>
        <p className="text-[14.5px] text-[#475467]">
          Demo only — nothing here was saved. A real organizer lands in their workspace next.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[560px]">
      <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-900">
        Demo data — a real invited organizer sees their own contact info pre-filled here instead.
      </div>
      <div className="rounded-[18px] border border-[#E7EAEE] bg-white p-7 sm:p-9">
        <h1
          className={`${DISPLAY} mb-2.5 text-[26px] leading-[1.06] font-medium tracking-[-.022em] text-[#101828]`}
        >
          Complete Your Organization Profile
        </h1>
        <p className="mb-7 text-[14.5px] leading-[1.6] text-[#475467]">
          Welcome to Field &amp; Arena. A few details about your organization and you&apos;re ready
          to build your first show.
        </p>

        <div className="space-y-5">
          <div>
            <div className={GROUP}>Organization</div>
            <DemoField label="Organization name" value="Meadowbrook Equestrian Center" />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <DemoField label="Organization email" value="office@meadowbrook.example" />
              <DemoField label="Website" value="www.meadowbrook.example" />
            </div>
            <div className="mt-4">
              <DemoField label="Phone" value="(555) 555-0100" />
            </div>
          </div>
          <div>
            <div className={GROUP}>Location</div>
            <div className="grid gap-4 sm:grid-cols-2">
              <DemoField label="City" value="Asheville" />
              <DemoField label="State / Region" value="NC" />
            </div>
            <div className="mt-4">
              <DemoField label="Country" value="United States" />
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setSubmitted(true);
            }}
            className="h-auto w-full rounded-[10px] bg-[#146A47] px-6 py-[15px] text-[15px] font-bold text-white transition-colors hover:bg-[#0E5537]"
          >
            Finish setup
          </Button>
        </div>
      </div>
    </div>
  );
}
