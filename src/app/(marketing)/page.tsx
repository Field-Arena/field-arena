import type { Metadata } from 'next';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getStaffProfile, getRiderProfile } from '@/modules/auth/data/queries';
import { ROLE_WORKSPACES, RIDER_WORKSPACE } from '@/shared/constants/role-workspaces';
import { ROUTES } from '@/shared/constants/routes';
import { LandingNav } from '@/modules/marketing/ui/landing/landing-nav';
import { LandingFooter } from '@/modules/marketing/ui/landing/landing-footer';
import { LandingHero } from '@/modules/marketing/ui/landing/sections/landing-hero';
import { DisciplineMarquee } from '@/modules/marketing/ui/landing/sections/discipline-marquee';
import { ProblemSection } from '@/modules/marketing/ui/landing/sections/problem-section';
import { PlatformSection } from '@/modules/marketing/ui/landing/sections/platform-section';
import { TourSection } from '@/modules/marketing/ui/landing/sections/tour-section';
import { DisciplinesSection } from '@/modules/marketing/ui/landing/sections/disciplines-section';
import { RolesSection } from '@/modules/marketing/ui/landing/sections/roles-section';
import { WorkflowSection } from '@/modules/marketing/ui/landing/sections/workflow-section';
import { BenefitsSection } from '@/modules/marketing/ui/landing/sections/benefits-section';
import { FinalCtaSection } from '@/modules/marketing/ui/landing/sections/final-cta-section';
import { DemoDialogMount } from '@/modules/marketing/ui/landing/demo-dialog-mount';
import { LoginDialog } from '@/modules/auth/ui/login-dialog';
import { LoginDialogMount } from '@/modules/auth/ui/login-dialog-mount';

export const metadata: Metadata = {
  title: 'Field & Arena — Run your entire equestrian event from one platform',
  description:
    'Entries, payments, scheduling, officials, show-day operations, scoring, results, vendors, and volunteers — connected in one system built for equestrian competition.',
};

export default async function LandingPage() {
  const staff = await getStaffProfile();
  if (staff) {
    const workspace = staff.platform_role ? ROLE_WORKSPACES[staff.platform_role] : undefined;
    redirect(workspace?.href ?? ROUTES.dashboard);
  }
  const rider = await getRiderProfile();
  if (rider) {
    redirect(RIDER_WORKSPACE.href);
  }

  return (
    <div className="fa-public bg-paper text-ink-deep font-[family-name:var(--font-ar)]">
      <LandingNav />
      <main>
        <LandingHero />
        <DisciplineMarquee />
        <ProblemSection />
        <PlatformSection />
        <TourSection />
        <DisciplinesSection />
        <RolesSection />
        <WorkflowSection />
        <BenefitsSection />
        <FinalCtaSection />
      </main>
      <LandingFooter />
      <Suspense>
        <DemoDialogMount />
      </Suspense>
      <Suspense>
        <LoginDialogMount />
      </Suspense>
      <LoginDialog />
    </div>
  );
}
