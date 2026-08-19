import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowRightIcon } from 'lucide-react';
import { LandingNav } from '@/modules/marketing/ui/landing/landing-nav';
import { LandingFooter } from '@/modules/marketing/ui/landing/landing-footer';
import { DemoDialogMount } from '@/modules/marketing/ui/landing/demo-dialog-mount';
import { LoginDialog } from '@/modules/auth/ui/login-dialog';
import { GUIDES } from '@/modules/marketing/content/guides';
import { DemoTrigger } from '@/modules/marketing/ui/landing/demo-trigger';

export const metadata: Metadata = {
  title: 'Learning Center | Field & Arena',
  description:
    'Guides on running horse shows — management software, scoring, registration, and discipline-specific workflows for dressage, hunter/jumper, and eventing.',
};

/**
 * The Learning Center index.
 *
 * Server-rendered from the guide list, so adding a guide to content/guides.tsx
 * publishes it here and at its own route with no second edit.
 */
export default function LearningCenterPage() {
  return (
    <div className="fa-public bg-paper font-[family-name:var(--font-ar)] text-ink-deep">
      <LandingNav />

      <main>
        <section className="border-b border-line-mint bg-mint px-5 py-[72px] md:px-8 lg:px-10 lg:py-28">
          <div className="mx-auto max-w-[1240px]">
            <div className="mb-[18px] text-[10.5px] font-bold uppercase tracking-[.18em] text-gold">
              Learning Center
            </div>
            <h1 className="mb-5 max-w-[760px] text-pretty font-[family-name:var(--font-nr)] text-[32px] font-medium leading-[1.04] tracking-[-.022em] text-forest md:text-[42px] xl:text-[50px]">
              Guides for running a better horse show.
            </h1>
            <p className="m-0 max-w-[620px] text-[16.5px] leading-[1.65] text-ink-lead">
              How modern show management software actually helps — for organizers, secretaries,
              GMOs, and every discipline from dressage to eventing.
            </p>
          </div>
        </section>

        {/* Card geometry, type, and hover are the landing's discipline-card
            recipe: 14px radius, 20px gap, 28px sides with 30/34 top and bottom,
            a 25px Newsreader heading at `normal` leading, and a 3px lift onto a
            gold border. The category label uses the eyebrow token rather than
            the pill it started as — the design system has no pill, and the
            eyebrow already reads as the card's opening gold marker. */}
        <section className="px-5 py-[72px] md:px-8 lg:px-10 lg:py-28">
          <div className="mx-auto grid max-w-[1240px] grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {GUIDES.map((guide) => (
              <Link
                key={guide.slug}
                href={`/learning/${guide.slug}`}
                className="group flex flex-col rounded-[14px] border border-line bg-white px-7 pb-[34px] pt-[30px] transition-all duration-150 hover:-translate-y-[3px] hover:border-gold"
              >
                <span className="mb-[18px] text-[10.5px] font-bold uppercase tracking-[.18em] text-gold">
                  {guide.tag}
                </span>
                <h2 className="mb-3 font-[family-name:var(--font-nr)] text-[25px] font-medium leading-[normal] tracking-[-.012em] text-forest">
                  {guide.cardTitle}
                </h2>
                <p className="mb-7 text-sm leading-[1.62] text-fa-muted">
                  {guide.cardDescription}
                </p>
                <span className="mt-auto inline-flex items-center gap-[9px] text-[13px] font-bold text-gold transition-all duration-150 group-hover:gap-[14px]">
                  Read the guide
                  <ArrowRightIcon className="size-3.5" aria-hidden />
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="px-5 pb-20 md:px-8 lg:px-10">
          <div className="mx-auto flex max-w-[1240px] flex-col items-start gap-6 rounded-[20px] border border-line-mint bg-mint px-8 py-12 md:flex-row md:items-center md:justify-between md:px-14">
            <div className="max-w-[560px]">
              {/* Section-head scale and the landing's final-CTA button, so the
                  closing panel reads as the same component in a compact,
                  horizontal arrangement. 28px/1.1 was on no scale in the kit. */}
              <h2 className="mb-2.5 font-[family-name:var(--font-nr)] text-[32px] font-medium leading-[1.04] tracking-[-.022em] text-forest md:text-[42px]">
                Rather see it than read about it?
              </h2>
              <p className="m-0 text-base leading-[1.65] text-ink-lead">
                Bring a past show and we&apos;ll build it live, in your discipline.
              </p>
            </div>
            <DemoTrigger className="inline-flex flex-none items-center gap-2.5 rounded-[10px] bg-forest px-[26px] py-[17px] text-[15px] font-bold text-paper transition-colors duration-150 hover:bg-gold hover:text-forest">
              Book a demo
              <ArrowRightIcon className="size-[15px]" aria-hidden />
            </DemoTrigger>
          </div>
        </section>
      </main>

      <LandingFooter />
      <Suspense>
        <DemoDialogMount />
      </Suspense>
      <LoginDialog />
    </div>
  );
}
