import { Eyebrow } from '@/modules/marketing/ui/landing/sections/eyebrow';
import { BENEFITS } from '@/modules/marketing/landing-content';

const DISPLAY = 'font-[family-name:var(--font-nr)]';
const H2 =
  `${DISPLAY} text-[32px] font-medium leading-[1.04] tracking-[-.022em] md:text-[42px] xl:text-[50px]`;

export function BenefitsSection() {
  return (
    <section className="relative overflow-hidden bg-forest px-5 py-[72px] md:px-8 lg:px-10 lg:pb-[118px] lg:pt-28">
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
                <dd
                  className={`m-0 whitespace-nowrap ${DISPLAY} text-[26px] text-gold-light`}
                >
                  {metric.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <figure className="m-0 rounded-[14px] border border-[rgba(255,255,255,.11)] border-l-[3px] border-l-gold bg-forest-raised px-10 pb-[38px] pt-11">
          <blockquote
            className={`m-0 mb-[26px] ${DISPLAY} text-[28px] font-light italic leading-[1.34] tracking-[-.01em] text-paper`}
          >
            {BENEFITS.quote}
          </blockquote>
          <figcaption className="text-[10.5px] font-bold uppercase tracking-[.18em] text-gold">
            {BENEFITS.quoteCaption}
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
