import { Eyebrow } from '@/modules/marketing/ui/landing/sections/eyebrow';
import { PLATFORM } from '@/modules/marketing/landing-content';

const DISPLAY = 'font-[family-name:var(--font-nr)]';
const H2 = `${DISPLAY} text-[32px] font-medium leading-[1.04] tracking-[-.022em] md:text-[42px] xl:text-[50px]`;

export function PlatformSection() {
  return (
    <section
      id="platform"
      className="bg-forest relative overflow-hidden px-5 py-[72px] md:px-8 lg:px-10 lg:pt-[116px] lg:pb-[124px]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_70%_at_12%_0%,rgba(201,162,39,.13),transparent_60%)]"
      />
      <div className="relative mx-auto max-w-[1240px]">
        <div className="mb-14 max-w-[780px] lg:mb-[62px]">
          <Eyebrow>One operating system</Eyebrow>
          <h2 className={`mb-5 text-pretty ${H2} text-paper xl:text-[52px]`}>
            Everything needed to plan, run, score, and close out an equestrian event.
          </h2>
          <p className="m-0 text-[16.5px] leading-[1.65] text-[rgba(251,250,247,.6)]">
            {PLATFORM.lead}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PLATFORM.cards.map((card) => (
            <article
              key={card.numeral}
              className="bg-forest-raised rounded-[14px] border border-[rgba(255,255,255,.10)] px-7 pt-[30px] pb-[34px] transition-all duration-150 hover:-translate-y-[3px] hover:border-[rgba(201,162,39,.5)]"
            >
              <div className="mb-[22px] flex items-baseline justify-between">
                <span className={`${DISPLAY} text-gold text-[15px] tracking-[.1em]`}>
                  {card.numeral}
                </span>
                <span aria-hidden className="ml-3.5 h-px flex-1 bg-[rgba(255,255,255,.10)]" />
              </div>
              <h3
                className={`mb-3 ${DISPLAY} text-paper text-[25px] font-medium tracking-[-.01em]`}
              >
                {card.title}
              </h3>
              <p className="m-0 text-sm leading-[1.62] text-[rgba(251,250,247,.58)]">{card.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
