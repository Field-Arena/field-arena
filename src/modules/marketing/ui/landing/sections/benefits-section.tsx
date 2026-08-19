import { Eyebrow } from '@/modules/marketing/ui/landing/sections/eyebrow';
import { BENEFITS } from '@/modules/marketing/landing-content';

const DISPLAY = 'font-[family-name:var(--font-nr)]';
const H2 = `${DISPLAY} text-[32px] font-medium leading-[1.04] tracking-[-.022em] md:text-[42px] xl:text-[50px]`;

export function BenefitsSection() {
  return (
    <section className="bg-forest relative overflow-hidden px-5 py-[72px] md:px-8 lg:px-10 lg:pt-28 lg:pb-[118px]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_80%_at_88%_100%,rgba(201,162,39,.14),transparent_62%)]"
      />
      <div className="relative mx-auto grid max-w-[1240px] items-start gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,.86fr)] lg:gap-[76px]">
        <div>
          <Eyebrow>Benefits</Eyebrow>
          <h2 className={`mb-5 ${H2} text-paper`}>
            Less administrative work. Faster information. More confidence.
          </h2>
          <p className="mb-10 max-w-[500px] text-base leading-[1.65] text-[rgba(251,250,247,.6)]">
            {BENEFITS.lead}
          </p>

          <dl className="m-0 border-t border-[rgba(255,255,255,.12)]">
            {BENEFITS.metrics.map((metric) => (
              <div
                key={metric.label}
                className="flex items-baseline justify-between gap-6 border-b border-[rgba(255,255,255,.12)] py-5"
              >
                <dt className="text-[14.5px] text-[rgba(251,250,247,.66)]">{metric.label}</dt>
                <dd className={`m-0 whitespace-nowrap ${DISPLAY} text-gold-light text-[26px]`}>
                  {metric.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <figure className="border-l-gold bg-forest-raised m-0 rounded-[14px] border border-l-[3px] border-[rgba(255,255,255,.11)] px-10 pt-11 pb-[38px]">
          <blockquote
            className={`m-0 mb-[26px] ${DISPLAY} text-paper text-[28px] leading-[1.34] font-light tracking-[-.01em] italic`}
          >
            {BENEFITS.quote}
          </blockquote>
          <figcaption className="text-gold text-[10.5px] font-bold tracking-[.18em] uppercase">
            {BENEFITS.quoteCaption}
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
