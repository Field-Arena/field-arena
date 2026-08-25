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

export default function LearningCenterPage() {
  return (
    <div className="fa-public bg-paper text-ink-deep font-[family-name:var(--font-ar)]">
      <LandingNav />

      <main>
        <section className="border-line-mint bg-mint border-b px-5 py-[72px] md:px-8 lg:px-10 lg:py-28">
          <div className="mx-auto max-w-[1240px]">
            <div className="text-gold mb-[18px] text-[10.5px] font-bold tracking-[.18em] uppercase">
              Learning Center
            </div>
            <h1 className="text-forest mb-5 max-w-[760px] font-[family-name:var(--font-nr)] text-[32px] leading-[1.04] font-medium tracking-[-.022em] text-pretty md:text-[42px] xl:text-[50px]">
              Guides for running a better horse show.
            </h1>
            <p className="text-ink-lead m-0 max-w-[620px] text-[16.5px] leading-[1.65]">
              How modern show management software actually helps — for organizers, secretaries,
              GMOs, and every discipline from dressage to eventing.
            </p>
          </div>
        </section>

        <section className="px-5 py-[72px] md:px-8 lg:px-10 lg:py-28">
          <div className="mx-auto grid max-w-[1240px] grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {GUIDES.map((guide) => (
              <Link
                key={guide.slug}
                href={`/learning/${guide.slug}`}
                className="group border-line hover:border-gold flex flex-col rounded-[14px] border bg-white px-7 pt-[30px] pb-[34px] transition-all duration-150 hover:-translate-y-[3px]"
              >
                <span className="text-gold mb-[18px] text-[10.5px] font-bold tracking-[.18em] uppercase">
                  {guide.tag}
                </span>
                <h2 className="text-forest mb-3 font-[family-name:var(--font-nr)] text-[25px] leading-[normal] font-medium tracking-[-.012em]">
                  {guide.cardTitle}
                </h2>
                <p className="text-fa-muted mb-7 text-sm leading-[1.62]">{guide.cardDescription}</p>
                <span className="text-gold mt-auto inline-flex items-center gap-[9px] text-[13px] font-bold transition-all duration-150 group-hover:gap-[14px]">
                  Read the guide
                  <ArrowRightIcon className="size-3.5" aria-hidden />
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="px-5 pb-20 md:px-8 lg:px-10">
          <div className="border-line-mint bg-mint mx-auto flex max-w-[1240px] flex-col items-start gap-6 rounded-[20px] border px-8 py-12 md:flex-row md:items-center md:justify-between md:px-14">
            <div className="max-w-[560px]">
              <h2 className="text-forest mb-2.5 font-[family-name:var(--font-nr)] text-[32px] leading-[1.04] font-medium tracking-[-.022em] md:text-[42px]">
                Rather see it than read about it?
              </h2>
              <p className="text-ink-lead m-0 text-base leading-[1.65]">
                Bring a past show and we&apos;ll build it live, in your discipline.
              </p>
            </div>
            <DemoTrigger className="bg-forest text-paper hover:bg-gold hover:text-forest inline-flex flex-none items-center gap-2.5 rounded-[10px] px-[26px] py-[17px] text-[15px] font-bold transition-colors duration-150">
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
