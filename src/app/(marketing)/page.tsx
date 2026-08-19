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

/**
 * The marketing landing page, entirely server-rendered.
 *
 * The design reference ships no JavaScript at all — the discipline marquee and
 * the pulsing status dots are CSS animations, and everything else is a hover
 * state. The one client component is the mobile nav drawer inside LandingNav,
 * which needs open/closed state that the desktop-only reference never had.
 */
export default async function LandingPage() {
  // A signed-in user who lands on the marketing home is sent straight to their
  // own workspace — clicking the domain again after logging in should reopen the
  // app, not the public brochure. Resolved per role so a Super Admin lands on the
  // console and a rider on their portal, not a one-size dashboard. Anonymous
  // visitors (both lookups null) fall through to the landing below.
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
    <div className="fa-public bg-paper font-[family-name:var(--font-ar)] text-ink-deep">
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
