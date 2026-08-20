import { Eyebrow } from '@/modules/marketing/ui/landing/sections/eyebrow';
import { gridDividerClasses } from '@/modules/marketing/utils';
import { PROBLEM } from '@/modules/marketing/landing-content';

const DISPLAY = 'font-[family-name:var(--font-nr)]';
const H2 = `${DISPLAY} text-[32px] font-medium leading-[1.04] tracking-[-.022em] md:text-[42px] xl:text-[50px]`;
const SECTION = 'px-5 py-[72px] md:px-8 lg:px-10 lg:py-28';

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
            <p className="text-ink-lead mb-4 text-[16.5px] leading-[1.66]">{PROBLEM.lead}</p>
            <p className="text-forest m-0 text-[16.5px] leading-[1.66] font-medium">
              {PROBLEM.leadStrong}
            </p>
          </div>
        </div>

        <div className="border-line grid grid-cols-1 overflow-hidden rounded-[14px] border bg-white sm:grid-cols-2 lg:grid-cols-4">
          {PROBLEM.cells.map((cell, index) => (
            <article
              key={cell.numeral}
              className={`border-line px-7 pt-[34px] pb-9 transition-colors duration-150 hover:bg-[#F4F8F6] ${gridDividerClasses(index, PROBLEM.cells.length, { base: 1, sm: 2, lg: 4 })}`}
            >
              <div className={`mb-5 ${DISPLAY} text-gold text-[34px] leading-none`}>
                {cell.numeral}
              </div>
              <h3 className="text-forest mb-2.5 text-base leading-[1.3] font-bold">{cell.title}</h3>
              <p className="text-fa-muted m-0 text-[13.5px] leading-[1.6]">{cell.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
