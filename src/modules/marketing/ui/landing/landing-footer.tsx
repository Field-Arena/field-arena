import Link from 'next/link';
import { FOOTER } from '@/modules/marketing/landing-content';

const DISPLAY = 'font-[family-name:var(--font-nr)]';

export function LandingFooter() {
  return (
    <footer className="bg-forest px-5 pb-[34px] pt-[76px] md:px-8 lg:px-10">
      <div className="mx-auto max-w-[1240px]">
        <div className="grid grid-cols-2 gap-10 border-b border-[rgba(255,255,255,.11)] pb-14 md:grid-cols-4 lg:grid-cols-[minmax(0,1.3fr)_repeat(4,minmax(0,1fr))] lg:gap-12">
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <Link href="/#top" className="mb-[18px] flex items-center gap-[11px] text-paper">
              <span
                className={`grid size-8 place-items-center rounded-[8px] bg-gold ${DISPLAY} text-sm font-semibold text-forest`}
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
              <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[.16em] text-gold">
                {column.heading}
              </div>
              {column.links.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-[13.5px] text-[rgba(251,250,247,.6)] transition-colors duration-150 hover:text-gold"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </div>

        {/* The reference's closing row is the copyright alone, spanning the
            full 1240px. A "Secured by Supabase Auth" badge used to sit opposite
            it, which squeezed the copyright into a 226px box; that trust signal
            belongs on the auth screens, where it already appears. */}
        <div className="pt-[26px]">
          <span className="text-[12.5px] text-[rgba(251,250,247,.4)]">{FOOTER.copyright}</span>
        </div>
      </div>
    </footer>
  );
}
