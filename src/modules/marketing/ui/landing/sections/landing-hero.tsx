import Image from 'next/image';
import Link from 'next/link';
import { ArrowRightIcon, CheckIcon } from 'lucide-react';
import { Button } from '@/shared/ui/shadcn/button';
import { DemoTrigger } from '@/modules/marketing/ui/landing/demo-trigger';
import { HERO, TOUR } from '@/modules/marketing/landing-content';

const DISPLAY = 'font-[family-name:var(--font-nr)]';

export function LandingHero() {
  return (
    <section
      id="top"
      className="relative overflow-hidden bg-forest px-5 pb-20 pt-16 md:px-8 md:pb-24 md:pt-20 lg:px-10 lg:pb-[200px] lg:pt-24"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_78%_8%,rgba(201,162,39,.20)_0%,rgba(13,44,35,0)_58%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[340px] bg-[repeating-linear-gradient(90deg,rgba(255,255,255,.045)_0_1px,transparent_1px_96px)]"
      />

      <div className="relative mx-auto grid max-w-[1240px] items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.06fr)] lg:gap-[72px]">
        <div>
          <div className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-[rgba(201,162,39,.42)] py-[7px] pl-[11px] pr-3.5">
            <span
              aria-hidden
              className="fa-motion size-1.5 rounded-full bg-gold [animation:fa-pulse_2s_ease-in-out_infinite]"
            />
            <span className="text-[10.5px] font-bold uppercase tracking-[.18em] text-gold-light">
              {HERO.badge}
            </span>
          </div>

          <h1
            className={`mb-[26px] text-pretty ${DISPLAY} text-[40px] font-medium leading-[.98] tracking-[-.025em] text-paper md:text-[60px] xl:text-[76px]`}
          >
            Run your entire equestrian event from{' '}
            <em className="italic text-gold-light">one</em> modern platform.
          </h1>

          <p className="mb-[18px] max-w-[520px] text-[17px] leading-[1.62] text-[rgba(251,250,247,.68)]">
            {HERO.lead}
          </p>
          <p className="mb-[38px] max-w-[500px] text-[15px] leading-[1.62] text-[rgba(251,250,247,.48)]">
            {HERO.sub}
          </p>

          <div className="mb-11 flex flex-wrap items-center gap-3.5">
            <DemoTrigger className="inline-flex h-auto items-center gap-2.5 rounded-[10px] bg-gold px-[26px] py-4 text-[14.5px] font-bold text-forest transition-all duration-150 hover:-translate-y-0.5 hover:bg-gold-light hover:shadow-[0_12px_34px_rgba(201,162,39,.28)]">
              See it in action
              <ArrowRightIcon className="size-[15px]" aria-hidden />
            </DemoTrigger>
            <Button
              asChild
              variant="outline"
              className="h-auto gap-2.5 rounded-[10px] border-[rgba(251,250,247,.24)] bg-transparent px-6 py-[15px] text-[14.5px] font-semibold text-paper transition-colors duration-150 hover:border-gold hover:bg-transparent hover:text-gold-light"
            >
              <Link href="/#platform">Explore the platform</Link>
            </Button>
          </div>

          <ul className="grid max-w-[520px] list-none grid-cols-1 gap-x-[30px] gap-y-3.5 border-t border-[rgba(255,255,255,.10)] p-0 pt-[26px] sm:grid-cols-2">
            {HERO.notes.map((note) => (
              <li key={note} className="flex items-start gap-[9px]">
                <CheckIcon className="mt-0.5 size-[15px] flex-none text-gold" aria-hidden />
                <span className="text-[13px] text-[rgba(251,250,247,.66)]">{note}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-x-[18px] -inset-y-7 bg-[radial-gradient(60%_60%_at_50%_40%,rgba(201,162,39,.22),transparent_70%)] blur-[12px]"
          />

          <div className="relative overflow-hidden rounded-[16px] border border-[rgba(255,255,255,.14)] bg-forest-raised shadow-[0_40px_90px_rgba(0,0,0,.5)]">
            <div className="flex items-center justify-between gap-3 border-b border-[rgba(255,255,255,.10)] px-4 py-[13px]">
              <span className="text-[10px] font-bold uppercase tracking-[.16em] text-[rgba(251,250,247,.5)]">
                {HERO.frameLabel}
              </span>
              <span className="inline-flex flex-none items-center gap-1.5 rounded-full border border-[rgba(201,162,39,.35)] bg-[rgba(201,162,39,.14)] px-[9px] py-1 text-[9.5px] font-bold tracking-[.14em] text-gold-light">
                <span
                  aria-hidden
                  className="fa-motion size-[5px] rounded-full bg-gold [animation:fa-pulse_1.6s_ease-in-out_infinite]"
                />
                LIVE
              </span>
            </div>
            <Image
              src={TOUR.feature.src}
              alt={TOUR.feature.alt}
              width={1600}
              height={1000}
              priority
              sizes="(max-width: 1024px) 100vw, 640px"
              className="block h-auto w-full"
            />
          </div>

          {/* Both callouts hang off the frame's edges and collide once it
              narrows, so they are hidden below lg. The gold one must stay at
              top-116px — any higher and it covers the LIVE pill. */}
          <div className="absolute -left-[34px] bottom-[54px] hidden max-w-[226px] rounded-[12px] bg-paper px-[18px] py-3.5 shadow-[0_20px_44px_rgba(0,0,0,.32)] lg:block">
            <div className="mb-1.5 text-[9.5px] font-bold uppercase tracking-[.16em] text-gold">
              {HERO.calloutCream.eyebrow}
            </div>
            <div className="text-[13px] leading-[1.45] text-ink-deep">{HERO.calloutCream.body}</div>
          </div>
          <div className="absolute -right-[26px] top-[116px] hidden max-w-[214px] rounded-[12px] bg-gold px-[18px] py-3.5 shadow-[0_20px_44px_rgba(0,0,0,.34)] lg:block">
            <div className="mb-1.5 text-[9.5px] font-bold uppercase tracking-[.16em] text-[rgba(13,44,35,.6)]">
              {HERO.calloutGold.eyebrow}
            </div>
            <div className="text-[13px] font-semibold leading-[1.45] text-forest">
              {HERO.calloutGold.body}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
