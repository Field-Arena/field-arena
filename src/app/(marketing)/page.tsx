import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LandingNav, LandingFooter } from '@/modules/marketing/ui/landing/chrome';
import {
  LandingHero,
  DisciplineMarquee,
  ProblemSection,
  PlatformSection,
  TourSection,
  DisciplinesSection,
  RolesSection,
  WorkflowSection,
  BenefitsSection,
  FinalCtaSection,
} from '@/modules/marketing/ui/landing/sections';
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
export default function LandingPage() {
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
