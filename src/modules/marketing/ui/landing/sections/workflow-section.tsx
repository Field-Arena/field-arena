import { Eyebrow } from '@/modules/marketing/ui/landing/sections/eyebrow';
import { WORKFLOW } from '@/modules/marketing/landing-content';

const DISPLAY = 'font-[family-name:var(--font-nr)]';
const H2 =
  `${DISPLAY} text-[32px] font-medium leading-[1.04] tracking-[-.022em] md:text-[42px] xl:text-[50px]`;
const SECTION = 'px-5 py-[72px] md:px-8 lg:px-10 lg:py-28';

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
