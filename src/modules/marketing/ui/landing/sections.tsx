import Image from 'next/image';
import Link from 'next/link';
import { ArrowRightIcon, CheckIcon } from 'lucide-react';
import { Button } from '@/shared/ui/shadcn/button';
import { gridDividerClasses } from '../../utils';
import { DemoTrigger } from './demo-trigger';
import {
  BENEFITS,
  DISCIPLINES,
  DISCIPLINE_MARQUEE,
  FINAL_CTA,
  HERO,
  PLATFORM,
  PROBLEM,
  ROLES,
  TOUR,
  WORKFLOW,
} from '../../landing-content';

/**
 * The landing-page sections, all server components.
 *
 * The design reference has no JavaScript — every animation is CSS and every
 * interaction is a hover state — so nothing here ships to the client. See
 * LandingMobileNav for the single exception.
 */

const DISPLAY = 'font-[family-name:var(--font-nr)]';
const H2 =
  `${DISPLAY} text-[32px] font-medium leading-[1.04] tracking-[-.022em] md:text-[42px] lg:text-[50px]`;
const SECTION = 'px-5 py-[72px] md:px-8 lg:px-10 lg:py-28';

function Eyebrow({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <div
      className={`mb-[18px] text-[10.5px] font-bold uppercase tracking-[.18em] ${dark ? 'text-gold-light' : 'text-gold'}`}
    >
      {children}
    </div>
  );
}

// ── Hero ───────────────────────────────────────────────────────────────────
export function LandingHero() {
  return (
    <section
      id="top"
      className="relative overflow-hidden bg-forest px-5 pb-20 pt-16 md:px-8 md:pb-24 md:pt-20 lg:px-10 lg:pb-28 lg:pt-24"
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
            className={`mb-[26px] text-pretty ${DISPLAY} text-[40px] font-medium leading-[.98] tracking-[-.025em] text-paper md:text-[60px] lg:text-[76px]`}
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
              className="h-auto rounded-[10px] border-[rgba(251,250,247,.24)] bg-transparent px-[26px] py-4 text-[14.5px] font-semibold text-paper transition-colors duration-150 hover:border-gold hover:bg-transparent hover:text-gold-light"
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

          <div className="relative overflow-hidden rounded-2xl border border-[rgba(255,255,255,.14)] bg-forest-raised shadow-[0_40px_90px_rgba(0,0,0,.5)]">
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
          <div className="absolute -left-[34px] bottom-[54px] hidden max-w-[226px] rounded-xl bg-paper px-[18px] py-3.5 shadow-[0_20px_44px_rgba(0,0,0,.32)] lg:block">
            <div className="mb-1.5 text-[9.5px] font-bold uppercase tracking-[.16em] text-gold">
              {HERO.calloutCream.eyebrow}
            </div>
            <div className="text-[13px] leading-[1.45] text-ink-deep">{HERO.calloutCream.body}</div>
          </div>
          <div className="absolute -right-[26px] top-[116px] hidden max-w-[214px] rounded-xl bg-gold px-[18px] py-3.5 shadow-[0_20px_44px_rgba(0,0,0,.34)] lg:block">
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

// ── Discipline marquee ─────────────────────────────────────────────────────
function MarqueeRow({ ariaHidden = false }: { ariaHidden?: boolean }) {
  return (
    <div className="flex items-center gap-11 pr-11" aria-hidden={ariaHidden || undefined}>
      {DISCIPLINE_MARQUEE.map((item) => (
        <span key={item} className="flex items-center gap-11">
          <span className={`whitespace-nowrap ${DISPLAY} text-[21px] text-ink-deep`}>{item}</span>
          <span aria-hidden className="size-[5px] rounded-full bg-gold" />
        </span>
      ))}
    </div>
  );
}

export function DisciplineMarquee() {
  return (
    <div className="overflow-hidden border-y border-line-mint bg-mint py-[22px]">
      {/* Two identical copies sliding 0 → -50%: the second sits exactly where
          the first started when the loop restarts, which is what hides the seam. */}
      <div className="fa-motion flex w-max [animation:fa-marquee_44s_linear_infinite]">
        <MarqueeRow />
        <MarqueeRow ariaHidden />
      </div>
    </div>
  );
}

// ── The problem ────────────────────────────────────────────────────────────
export function ProblemSection() {
  return (
    <section className={`bg-paper ${SECTION}`}>
      <div className="mx-auto max-w-[1240px]">
        <div className="mb-16 grid gap-10 lg:grid-cols-[minmax(0,.92fr)_minmax(0,1fr)] lg:gap-20">
          <div>
            <Eyebrow>The problem</Eyebrow>
            <h2 className={`m-0 text-pretty ${H2} text-forest`}>
              Replace disconnected show management with one live platform.
            </h2>
          </div>
          <div className="lg:pt-11">
            <p className="mb-4 text-[16.5px] leading-[1.66] text-ink-lead">{PROBLEM.lead}</p>
            <p className="m-0 text-[16.5px] font-medium leading-[1.66] text-forest">
              {PROBLEM.leadStrong}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 overflow-hidden rounded-[14px] border border-line bg-white sm:grid-cols-2 lg:grid-cols-4">
          {PROBLEM.cells.map((cell, index) => (
            <article
              key={cell.numeral}
              className={`border-line px-7 pb-9 pt-[34px] transition-colors duration-150 hover:bg-[#F4F8F6] ${gridDividerClasses(index, PROBLEM.cells.length, { base: 1, sm: 2, lg: 4 })}`}
            >
              <div className={`mb-5 ${DISPLAY} text-[34px] leading-none text-gold`}>
                {cell.numeral}
              </div>
              <h3 className="mb-2.5 text-base font-bold leading-[1.3] text-forest">{cell.title}</h3>
              <p className="m-0 text-[13.5px] leading-[1.6] text-fa-muted">{cell.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Platform ───────────────────────────────────────────────────────────────
export function PlatformSection() {
  return (
    <section
      id="platform"
      className="relative overflow-hidden bg-forest px-5 py-[72px] md:px-8 lg:px-10 lg:pb-[124px] lg:pt-[116px]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_70%_at_12%_0%,rgba(201,162,39,.13),transparent_60%)]"
      />
      <div className="relative mx-auto max-w-[1240px]">
        <div className="mb-14 max-w-[780px] lg:mb-[62px]">
          <Eyebrow dark>One operating system</Eyebrow>
          <h2 className={`mb-5 text-pretty ${H2} text-paper lg:text-[52px]`}>
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
              className="rounded-[14px] border border-[rgba(255,255,255,.10)] bg-forest-raised px-7 pb-[34px] pt-[30px] transition-all duration-150 hover:-translate-y-[3px] hover:border-[rgba(201,162,39,.5)]"
            >
              <div className="mb-[22px] flex items-baseline justify-between">
                <span className={`${DISPLAY} text-[15px] tracking-[.1em] text-gold`}>
                  {card.numeral}
                </span>
                <span aria-hidden className="ml-3.5 h-px flex-1 bg-[rgba(255,255,255,.10)]" />
              </div>
              <h3 className={`mb-3 ${DISPLAY} text-[25px] font-medium tracking-[-.01em] text-paper`}>
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

// ── Product tour ───────────────────────────────────────────────────────────
export function TourSection() {
  return (
    <section id="tour" className={`bg-paper ${SECTION}`}>
      <div className="mx-auto max-w-[1240px]">
        <div className="mb-14 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between lg:gap-[60px]">
          <div className="max-w-[660px]">
            <Eyebrow>Inside the organizer workspace</Eyebrow>
            <h2 className={`m-0 ${H2} text-forest`}>What running a show actually looks like.</h2>
          </div>
          <p className="m-0 max-w-[300px] text-[15px] leading-[1.6] text-fa-muted">{TOUR.aside}</p>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
          <div className="flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition-colors duration-150 hover:border-gold">
            <div
              aria-hidden
              className="flex items-center gap-[7px] border-b border-line bg-[#F4F8F6] px-4 py-3"
            >
              <span className="size-[9px] rounded-full bg-dot" />
              <span className="size-[9px] rounded-full bg-dot" />
              <span className="size-[9px] rounded-full bg-dot" />
              <span className="ml-3 font-mono text-[11px] text-[#8A968F]">{TOUR.chromeUrl}</span>
            </div>
            <Image
              src={TOUR.feature.src}
              alt={TOUR.feature.alt}
              width={1600}
              height={1000}
              sizes="(max-width: 1024px) 100vw, 700px"
              className="block h-auto w-full"
            />
            <div className="mt-auto border-t border-line px-7 pb-[30px] pt-[26px]">
              <h3
                className={`mb-2 ${DISPLAY} text-[27px] font-medium tracking-[-.012em] text-forest`}
              >
                {TOUR.feature.title}
              </h3>
              <p className="m-0 text-[14.5px] leading-[1.6] text-fa-muted">{TOUR.feature.body}</p>
            </div>
          </div>

          <div className="grid gap-6">
            {TOUR.secondary.map((item) => (
              <div
                key={item.title}
                className="overflow-hidden rounded-2xl border border-line bg-white transition-colors duration-150 hover:border-gold"
              >
                <Image
                  src={item.src}
                  alt={item.alt}
                  width={1600}
                  height={1000}
                  sizes="(max-width: 1024px) 100vw, 500px"
                  className="block h-auto w-full"
                />
                <div className="border-t border-line px-6 pb-[26px] pt-[22px]">
                  <h3 className="mb-[7px] text-base font-bold text-forest">{item.title}</h3>
                  <p className="m-0 text-[13.5px] leading-[1.58] text-fa-muted">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Disciplines ────────────────────────────────────────────────────────────
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

// ── Roles ──────────────────────────────────────────────────────────────────
export function RolesSection() {
  return (
    <section id="roles" className={`bg-paper ${SECTION}`}>
      <div className="mx-auto max-w-[1240px]">
        <div className="mb-14 max-w-[700px]">
          <Eyebrow>Designed around real roles</Eyebrow>
          <h2 className={`m-0 ${H2} text-forest`}>
            One platform, with the right workspace for each person.
          </h2>
        </div>

        <div className="grid grid-cols-1 overflow-hidden rounded-[14px] border border-line bg-white sm:grid-cols-2 lg:grid-cols-3">
          {ROLES.map((role, index) => (
            <article
              key={role.title}
              className={`border-line px-7 py-8 transition-colors duration-150 hover:bg-[#F4F8F6] ${gridDividerClasses(index, ROLES.length, { base: 1, sm: 2, lg: 3 })}`}
            >
              <h3 className="mb-2.5 text-base font-bold text-forest">{role.title}</h3>
              <p className="m-0 text-[13.5px] leading-[1.6] text-fa-muted">{role.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Workflow ───────────────────────────────────────────────────────────────
export function WorkflowSection() {
  return (
    <section id="workflow" className={`border-y border-line-mint bg-mint ${SECTION}`}>
      <div className="mx-auto max-w-[1240px]">
        <div className="mb-14 max-w-[660px] lg:mb-[60px]">
          <Eyebrow>Workflow</Eyebrow>
          <h2 className={`m-0 ${H2} text-forest`}>
            A cleaner workflow at every stage of the event.
          </h2>
        </div>

        <div className="relative">
          {/* Runs through the vertical centre of the 23px markers. Dropped below
              lg, where the steps stack and a horizontal rule means nothing. */}
          <div
            aria-hidden
            className="absolute inset-x-0 top-[11px] hidden h-px bg-line-mint-2 lg:block"
          />
          <ol className="relative grid list-none grid-cols-1 gap-10 p-0 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
            {WORKFLOW.map((step, index) => {
              const isLast = index === WORKFLOW.length - 1;
              return (
                <li key={step.step}>
                  {/* Step 4 inverts to signal the end of the sequence. */}
                  <div
                    className={`mb-[26px] grid size-[23px] place-items-center rounded-full text-[10.5px] font-bold ${isLast ? 'bg-gold text-forest' : 'bg-forest text-gold'}`}
                  >
                    {step.step}
                  </div>
                  <h3
                    className={`mb-[11px] ${DISPLAY} text-[26px] font-medium tracking-[-.012em] text-forest`}
                  >
                    {step.title}
                  </h3>
                  <p className="m-0 text-sm leading-[1.62] text-fa-muted">{step.body}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}

// ── Benefits ───────────────────────────────────────────────────────────────
export function BenefitsSection() {
  return (
    <section className="relative overflow-hidden bg-forest px-5 py-[72px] md:px-8 lg:px-10 lg:pb-[118px] lg:pt-28">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_80%_at_88%_100%,rgba(201,162,39,.14),transparent_62%)]"
      />
      <div className="relative mx-auto grid max-w-[1240px] items-start gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,.86fr)] lg:gap-[76px]">
        <div>
          <Eyebrow dark>Benefits</Eyebrow>
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

// ── Final CTA ──────────────────────────────────────────────────────────────
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
            className={`mb-[18px] ${DISPLAY} text-[32px] font-medium leading-[1.02] tracking-[-.024em] text-forest md:text-[42px] lg:text-[52px]`}
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
