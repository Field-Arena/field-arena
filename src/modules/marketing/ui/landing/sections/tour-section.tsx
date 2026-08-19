import Image from 'next/image';
import { Eyebrow } from '@/modules/marketing/ui/landing/sections/eyebrow';
import { TOUR } from '@/modules/marketing/landing-content';

const DISPLAY = 'font-[family-name:var(--font-nr)]';
const H2 = `${DISPLAY} text-[32px] font-medium leading-[1.04] tracking-[-.022em] md:text-[42px] xl:text-[50px]`;
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
          <p className="text-fa-muted m-0 max-w-[300px] text-[15px] leading-[1.6]">{TOUR.aside}</p>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
          <div className="border-line hover:border-gold flex flex-col overflow-hidden rounded-[16px] border bg-white transition-colors duration-150">
            <div
              aria-hidden
              className="border-line flex items-center gap-[7px] border-b bg-[#F4F8F6] px-4 py-3"
            >
              <span className="bg-dot size-[9px] rounded-full" />
              <span className="bg-dot size-[9px] rounded-full" />
              <span className="bg-dot size-[9px] rounded-full" />
              <span className="ml-3 font-mono text-[11px] text-[#8A968F]">{TOUR.chromeUrl}</span>
            </div>

            <Image
              src={TOUR.feature.src}
              alt={TOUR.feature.alt}
              width={1600}
              height={1000}
              loading="eager"
              sizes="(max-width: 1024px) 100vw, 700px"
              className="block h-auto w-full"
            />
            <div className="border-line mt-auto border-t px-7 pt-[26px] pb-[30px]">
              <h3
                className={`mb-2 ${DISPLAY} text-forest text-[27px] font-medium tracking-[-.012em]`}
              >
                {TOUR.feature.title}
              </h3>
              <p className="text-fa-muted m-0 text-[14.5px] leading-[1.6]">{TOUR.feature.body}</p>
            </div>
          </div>

          <div className="grid gap-6">
            {TOUR.secondary.map((item) => (
              <div
                key={item.title}
                className="border-line hover:border-gold overflow-hidden rounded-[16px] border bg-white transition-colors duration-150"
              >
                <Image
                  src={item.src}
                  alt={item.alt}
                  width={1600}
                  height={1000}
                  sizes="(max-width: 1024px) 100vw, 500px"
                  className="block h-auto w-full"
                />
                <div className="border-line border-t px-6 pt-[22px] pb-[26px]">
                  <h3 className="text-forest mb-[7px] text-base leading-[normal] font-bold">
                    {item.title}
                  </h3>
                  <p className="text-fa-muted m-0 text-[13.5px] leading-[1.58]">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
