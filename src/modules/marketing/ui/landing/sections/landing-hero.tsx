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
      className="bg-forest relative overflow-hidden px-5 pt-16 pb-20 md:px-8 md:pt-20 md:pb-24 lg:px-10 lg:pt-24 lg:pb-[200px]"
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
          <div className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-[rgba(201,162,39,.42)] py-[7px] pr-3.5 pl-[11px]">
            <span
              aria-hidden
              className="fa-motion bg-gold size-1.5 [animation:fa-pulse_2s_ease-in-out_infinite] rounded-full"
            />
            <span className="text-gold-light text-[10.5px] font-bold tracking-[.18em] uppercase">
              {HERO.badge}
            </span>
          </div>

          <h1
            className={`mb-[26px] text-pretty ${DISPLAY} text-paper text-[40px] leading-[.98] font-medium tracking-[-.025em] md:text-[60px] xl:text-[76px]`}
          >
            Run your entire equestrian event from <em className="text-gold-light italic">one</em>{' '}
            modern platform.
          </h1>

          <p className="mb-[18px] max-w-[520px] text-[17px] leading-[1.62] text-[rgba(251,250,247,.68)]">
            {HERO.lead}
          </p>
          <p className="mb-[38px] max-w-[500px] text-[15px] leading-[1.62] text-[rgba(251,250,247,.48)]">
            {HERO.sub}
          </p>

          <div className="mb-11 flex flex-wrap items-center gap-3.5">
            <DemoTrigger className="bg-gold text-forest hover:bg-gold-light inline-flex h-auto items-center gap-2.5 rounded-[10px] px-[26px] py-4 text-[14.5px] font-bold transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_12px_34px_rgba(201,162,39,.28)]">
              See it in action
              <ArrowRightIcon className="size-[15px]" aria-hidden />
            </DemoTrigger>
            <Button
              asChild
              variant="outline"
              className="text-paper hover:border-gold hover:text-gold-light h-auto gap-2.5 rounded-[10px] border-[rgba(251,250,247,.24)] bg-transparent px-6 py-[15px] text-[14.5px] font-semibold transition-colors duration-150 hover:bg-transparent"
            >
              <Link href="/#platform">Explore the platform</Link>
            </Button>
          </div>

          <ul className="grid max-w-[520px] list-none grid-cols-1 gap-x-[30px] gap-y-3.5 border-t border-[rgba(255,255,255,.10)] p-0 pt-[26px] sm:grid-cols-2">
            {HERO.notes.map((note) => (
              <li key={note} className="flex items-start gap-[9px]">
                <CheckIcon className="text-gold mt-0.5 size-[15px] flex-none" aria-hidden />
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

          <div className="bg-forest-raised relative overflow-hidden rounded-[16px] border border-[rgba(255,255,255,.14)] shadow-[0_40px_90px_rgba(0,0,0,.5)]">
            <div className="flex items-center justify-between gap-3 border-b border-[rgba(255,255,255,.10)] px-4 py-[13px]">
              <span className="text-[10px] font-bold tracking-[.16em] text-[rgba(251,250,247,.5)] uppercase">
                {HERO.frameLabel}
              </span>
              <span className="text-gold-light inline-flex flex-none items-center gap-1.5 rounded-full border border-[rgba(201,162,39,.35)] bg-[rgba(201,162,39,.14)] px-[9px] py-1 text-[9.5px] font-bold tracking-[.14em]">
                <span
                  aria-hidden
                  className="fa-motion bg-gold size-[5px] [animation:fa-pulse_1.6s_ease-in-out_infinite] rounded-full"
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

          <div className="bg-paper absolute bottom-[54px] -left-[34px] hidden max-w-[226px] rounded-[12px] px-[18px] py-3.5 shadow-[0_20px_44px_rgba(0,0,0,.32)] lg:block">
            <div className="text-gold mb-1.5 text-[9.5px] font-bold tracking-[.16em] uppercase">
              {HERO.calloutCream.eyebrow}
            </div>
            <div className="text-ink-deep text-[13px] leading-[1.45]">{HERO.calloutCream.body}</div>
          </div>
          <div className="bg-gold absolute top-[116px] -right-[26px] hidden max-w-[214px] rounded-[12px] px-[18px] py-3.5 shadow-[0_20px_44px_rgba(0,0,0,.34)] lg:block">
            <div className="mb-1.5 text-[9.5px] font-bold tracking-[.16em] text-[rgba(13,44,35,.6)] uppercase">
              {HERO.calloutGold.eyebrow}
            </div>
            <div className="text-forest text-[13px] leading-[1.45] font-semibold">
              {HERO.calloutGold.body}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
