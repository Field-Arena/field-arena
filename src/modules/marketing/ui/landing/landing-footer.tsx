import Link from 'next/link';
import { FOOTER } from '@/modules/marketing/landing-content';

const DISPLAY = 'font-[family-name:var(--font-nr)]';

export function LandingFooter() {
  return (
    <footer className="bg-forest px-5 pt-[76px] pb-[34px] md:px-8 lg:px-10">
      <div className="mx-auto max-w-[1240px]">
        <div className="grid grid-cols-2 gap-10 border-b border-[rgba(255,255,255,.11)] pb-14 md:grid-cols-4 lg:grid-cols-[minmax(0,1.3fr)_repeat(4,minmax(0,1fr))] lg:gap-12">
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <Link href="/#top" className="text-paper mb-[18px] flex items-center gap-[11px]">
              <span
                className={`bg-gold grid size-8 place-items-center rounded-[8px] ${DISPLAY} text-forest text-sm font-semibold`}
              >
                F&amp;A
              </span>
              <span className={`${DISPLAY} text-lg font-medium`}>Field &amp; Arena</span>
            </Link>
            <p className="m-0 max-w-[290px] text-[13.5px] leading-[1.6] text-[rgba(251,250,247,.5)]">
              {FOOTER.blurb}
            </p>
          </div>

          {FOOTER.columns.map((column) => (
            <div key={column.heading} className="flex flex-col gap-[11px]">
              <div className="text-gold mb-1.5 text-[10px] font-bold tracking-[.16em] uppercase">
                {column.heading}
              </div>
              {column.links.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="hover:text-gold text-[13.5px] text-[rgba(251,250,247,.6)] transition-colors duration-150"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </div>

        <div className="pt-[26px]">
          <span className="text-[12.5px] text-[rgba(251,250,247,.4)]">{FOOTER.copyright}</span>
        </div>
      </div>
    </footer>
  );
}
