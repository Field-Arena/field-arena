import Image from 'next/image';
import { Eyebrow } from '@/modules/marketing/ui/landing/sections/eyebrow';
import { TOUR } from '@/modules/marketing/landing-content';

const DISPLAY = 'font-[family-name:var(--font-nr)]';
const H2 =
  `${DISPLAY} text-[32px] font-medium leading-[1.04] tracking-[-.022em] md:text-[42px] xl:text-[50px]`;
const SECTION = 'px-5 py-[72px] md:px-8 lg:px-10 lg:py-28';

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
          <div className="flex flex-col overflow-hidden rounded-[16px] border border-line bg-white transition-colors duration-150 hover:border-gold">
            <div
              aria-hidden
              className="flex items-center gap-[7px] border-b border-line bg-[#F4F8F6] px-4 py-3"
            >
              <span className="size-[9px] rounded-full bg-dot" />
              <span className="size-[9px] rounded-full bg-dot" />
              <span className="size-[9px] rounded-full bg-dot" />
              <span className="ml-3 font-mono text-[11px] text-[#8A968F]">{TOUR.chromeUrl}</span>
            </div>
            {/* Same asset as the hero, which already fetches it with priority,
                so eager here is a free hint rather than an extra request — and it
                stops this element being reported as an LCP image with no loading
                hint when the tour card is what the browser measures. */}
            <Image
              src={TOUR.feature.src}
              alt={TOUR.feature.alt}
              width={1600}
              height={1000}
              loading="eager"
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
                className="overflow-hidden rounded-[16px] border border-line bg-white transition-colors duration-150 hover:border-gold"
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
                  <h3 className="mb-[7px] text-base font-bold leading-[normal] text-forest">{item.title}</h3>
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
