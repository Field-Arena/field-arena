import { SiteHeader } from '@/modules/marketing/ui/site-header';
import { HeroSection } from '@/modules/marketing/ui/hero-section';
import { DisciplineStrip } from '@/modules/marketing/ui/discipline-strip';
import { ProblemSection } from '@/modules/marketing/ui/problem-section';
import { PlatformSection } from '@/modules/marketing/ui/platform-section';
import { ShowcaseSection } from '@/modules/marketing/ui/showcase-section';
import { DisciplinesSection } from '@/modules/marketing/ui/disciplines-section';
import { WorkspaceSection } from '@/modules/marketing/ui/workspace-section';
import { RolesSection } from '@/modules/marketing/ui/roles-section';
import { WorkflowSection } from '@/modules/marketing/ui/workflow-section';
import { BenefitsSection } from '@/modules/marketing/ui/benefits-section';
import { CtaSection } from '@/modules/marketing/ui/cta-section';
import { SiteFooter } from '@/modules/marketing/ui/site-footer';

export default function MarketingHomePage() {
  return (
    <div className="mk">
      <SiteHeader />
      <main id="top">
        <HeroSection />
        <DisciplineStrip />
        <ProblemSection />
        <PlatformSection />
        <ShowcaseSection />
        <DisciplinesSection />
        <WorkspaceSection />
        <RolesSection />
        <WorkflowSection />
        <BenefitsSection />
        <CtaSection />
      </main>
      <SiteFooter />
    </div>
  );
}
