import { SiteHeader } from '@/modules/marketing/ui/site-header';
import { HeroSection } from '@/modules/marketing/ui/hero-section';
import { VideoSection } from '@/modules/marketing/ui/video-section';
import { FeaturesSection } from '@/modules/marketing/ui/features-section';
import { DemoSection } from '@/modules/marketing/ui/demo-section';
import { SiteFooter } from '@/modules/marketing/ui/site-footer';

export default function MarketingHomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <HeroSection />
        <VideoSection />
        <FeaturesSection />
        <DemoSection />
      </main>
      <SiteFooter />
    </>
  );
}
// This is a placeholder page for the marketing home page. You can customize it as needed.
