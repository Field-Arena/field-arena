import Link from 'next/link';
import { ArrowRightIcon } from 'lucide-react';
import { Button } from '@/shared/ui/shadcn/button';
import { Eyebrow } from '@/modules/marketing/ui/landing/sections/eyebrow';
import { DemoTrigger } from '@/modules/marketing/ui/landing/demo-trigger';
import { FINAL_CTA } from '@/modules/marketing/landing-content';

const DISPLAY = 'font-[family-name:var(--font-nr)]';
const SECTION = 'px-5 py-[72px] md:px-8 lg:px-10 lg:py-28';

/**
 * The closing panel, and the destination every "Book a demo" on the page scrolls
 * to.
 *
 * Its own primary button has nowhere real to go yet. Booking a demo should
 * create a `leads` row — the table exists and the SuperAdmin Sales Funnel
 * already reads it — but there is no public request form, and the design's
 * prototype simply pointed this button back at itself. It is wired to sign-up as
 * the one real destination that exists, with the label saying so plainly rather
 * than promising a demo booking that nothing records.
 */
export function FinalCtaSection() {
  return (
    <section id="demo" className={`bg-paper ${SECTION}`}>
      <div className="mx-auto grid max-w-[1240px] items-center gap-10 rounded-[20px] border border-line-mint bg-mint px-6 py-12 md:px-12 md:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,.72fr)] lg:gap-16 lg:px-16 lg:py-[72px]">
        <div>
          <Eyebrow>Bring your next event online</Eyebrow>
          <h2
            className={`mb-[18px] ${DISPLAY} text-[32px] font-medium leading-[1.02] tracking-[-.024em] text-forest md:text-[42px] xl:text-[52px]`}
          >
            See how Field &amp; Arena fits your event.
          </h2>
          <p className="m-0 text-[16.5px] leading-[1.62] text-ink-lead">{FINAL_CTA.lead}</p>
        </div>

        <div className="flex flex-col items-stretch gap-3">
          <DemoTrigger className="inline-flex h-auto items-center justify-center gap-2.5 rounded-[10px] bg-forest px-[26px] py-[17px] text-[15px] font-bold text-paper transition-colors duration-150 hover:bg-gold hover:text-forest">
            Book a demo
            <ArrowRightIcon className="size-[15px]" aria-hidden />
          </DemoTrigger>
          <Button
            asChild
            variant="outline"
            className="h-auto justify-center rounded-[10px] border-line-strong bg-paper px-[26px] py-[17px] text-[15px] font-semibold text-forest transition-colors duration-150 hover:border-gold hover:bg-paper"
          >
            <Link href="/#platform">Explore the platform</Link>
          </Button>
          <p className="mb-0 mt-1.5 text-center text-[12.5px] leading-[1.5] text-fa-muted-2">
            {FINAL_CTA.finePrint}
          </p>
        </div>
      </div>
    </section>
  );
}
