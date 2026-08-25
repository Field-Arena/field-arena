import Link from 'next/link';
import { ArrowRightIcon } from 'lucide-react';
import { Button } from '@/shared/ui/shadcn/button';
import { Eyebrow } from '@/modules/marketing/ui/landing/sections/eyebrow';
import { DemoTrigger } from '@/modules/marketing/ui/landing/demo-trigger';
import { FINAL_CTA } from '@/modules/marketing/landing-content';

const DISPLAY = 'font-[family-name:var(--font-nr)]';
const SECTION = 'px-5 py-[72px] md:px-8 lg:px-10 lg:py-28';

export function FinalCtaSection() {
  return (
    <section id="demo" className={`bg-paper ${SECTION}`}>
      <div className="border-line-mint bg-mint mx-auto grid max-w-[1240px] items-center gap-10 rounded-[20px] border px-6 py-12 md:px-12 md:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,.72fr)] lg:gap-16 lg:px-16 lg:py-[72px]">
        <div>
          <Eyebrow>Bring your next event online</Eyebrow>
          <h2
            className={`mb-[18px] ${DISPLAY} text-forest text-[32px] leading-[1.02] font-medium tracking-[-.024em] md:text-[42px] xl:text-[52px]`}
          >
            See how Field &amp; Arena fits your event.
          </h2>
          <p className="text-ink-lead m-0 text-[16.5px] leading-[1.62]">{FINAL_CTA.lead}</p>
        </div>

        <div className="flex flex-col items-stretch gap-3">
          <DemoTrigger className="bg-forest text-paper hover:bg-gold hover:text-forest inline-flex h-auto items-center justify-center gap-2.5 rounded-[10px] px-[26px] py-[17px] text-[15px] font-bold transition-colors duration-150">
            Book a demo
            <ArrowRightIcon className="size-[15px]" aria-hidden />
          </DemoTrigger>
          <Button
            asChild
            variant="outline"
            className="border-line-strong bg-paper text-forest hover:border-gold hover:bg-paper h-auto justify-center rounded-[10px] px-[26px] py-[17px] text-[15px] font-semibold transition-colors duration-150"
          >
            <Link href="/#platform">Explore the platform</Link>
          </Button>
          <p className="text-fa-muted-2 mt-1.5 mb-0 text-center text-[12.5px] leading-[1.5]">
            {FINAL_CTA.finePrint}
          </p>
        </div>
      </div>
    </section>
  );
}
