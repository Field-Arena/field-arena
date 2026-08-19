import { ArrowRightIcon } from 'lucide-react';
import { Eyebrow } from '@/modules/marketing/ui/landing/sections/eyebrow';
import { DemoTrigger } from '@/modules/marketing/ui/landing/demo-trigger';
import { DISCIPLINES } from '@/modules/marketing/landing-content';

const DISPLAY = 'font-[family-name:var(--font-nr)]';
const H2 =
  `${DISPLAY} text-[32px] font-medium leading-[1.04] tracking-[-.022em] md:text-[42px] xl:text-[50px]`;
const SECTION = 'px-5 py-[72px] md:px-8 lg:px-10 lg:py-28';

export function DisciplinesSection() {
  return (
    <section id="disciplines" className={`border-y border-line-mint bg-mint ${SECTION}`}>
      <div className="mx-auto max-w-[1240px]">
        <div className="mb-14 max-w-[720px]">
          <Eyebrow>Built for different disciplines</Eyebrow>
          <h2 className={`mb-[18px] ${H2} text-forest`}>
            One platform. Different ways to compete.
          </h2>
          <p className="m-0 text-[16.5px] leading-[1.65] text-ink-lead">{DISCIPLINES.lead}</p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {DISCIPLINES.cards.map((card) => (
            <article
              key={card.title}
              className="rounded-[14px] border border-line-mint bg-paper px-7 pb-[34px] pt-[30px] transition-all duration-150 hover:-translate-y-[3px] hover:border-gold"
            >
              <div aria-hidden className="mb-[22px] h-[3px] w-[38px] bg-gold" />
              <h3
                className={`mb-[11px] ${DISPLAY} text-[25px] font-medium tracking-[-.012em] text-forest`}
              >
                {card.title}
              </h3>
              <p className="m-0 text-sm leading-[1.62] text-fa-muted">{card.body}</p>
            </article>
          ))}

          <article className="flex flex-col justify-between rounded-[14px] border border-forest bg-forest px-7 pb-[34px] pt-[30px]">
            <div>
              <div aria-hidden className="mb-[22px] h-[3px] w-[38px] bg-gold" />
              <h3
                className={`mb-[11px] ${DISPLAY} text-[25px] font-medium tracking-[-.012em] text-paper`}
              >
                {DISCIPLINES.ctaCard.title}
              </h3>
              <p className="m-0 text-sm leading-[1.62] text-[rgba(251,250,247,.6)]">
                {DISCIPLINES.ctaCard.body}
              </p>
            </div>
            <DemoTrigger className="mt-6 inline-flex items-center gap-[9px] text-[13.5px] font-bold text-gold-light transition-all duration-150 hover:gap-[14px]">
              {DISCIPLINES.ctaCard.link}
              <ArrowRightIcon className="size-3.5" aria-hidden />
            </DemoTrigger>
          </article>
        </div>
      </div>
    </section>
  );
}
