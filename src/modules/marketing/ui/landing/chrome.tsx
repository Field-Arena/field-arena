import Link from 'next/link';
import { FOOTER, NAV_LINKS } from '../../landing-content';
import { LoginTrigger } from '@/modules/auth/ui/login-trigger';
import { DemoTrigger } from './demo-trigger';
import { LandingMobileNav } from './mobile-nav';

const DISPLAY = 'font-[family-name:var(--font-nr)]';

/**
 * Sticky nav: 74px tall, solid forest, hairline bottom rule. Deliberately no
 * transparency, blur, or scroll-state change — it sits over both the light and
 * the dark sections unchanged.
 */
export function LandingNav() {
  return (
    <header className="sticky top-0 z-[60] border-b border-[rgba(255,255,255,.09)] bg-forest">
      <div className="relative mx-auto flex h-[74px] max-w-[1240px] items-center gap-6 px-5 md:px-8 lg:gap-10 lg:px-10">
        <Link
          href="/#top"
          aria-label="Field and Arena home"
          className="flex flex-none items-center gap-[11px] text-paper"
        >
          <span
            className={`grid size-[34px] place-items-center rounded-[8px] bg-gold ${DISPLAY} text-[15px] font-semibold tracking-[-.02em] text-forest`}
          >
            F&amp;A
          </span>
          <span className={`${DISPLAY} text-[19px] font-medium tracking-[-.01em]`}>
            Field &amp; Arena
          </span>
        </Link>

        <nav className="ml-3 hidden items-center gap-[30px] lg:flex" aria-label="Main">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-[13.5px] font-medium text-[rgba(251,250,247,.72)] transition-colors duration-150 hover:text-gold"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-5">
          <LoginTrigger className="hidden text-[13.5px] font-medium text-[rgba(251,250,247,.72)] transition-colors duration-150 hover:text-gold lg:block">
            Log in
          </LoginTrigger>
          <DemoTrigger className="hidden h-auto rounded-[8px] bg-gold px-5 py-[11px] text-[13.5px] font-bold tracking-[.01em] text-forest transition-all duration-150 hover:-translate-y-0.5 hover:bg-gold-light hover:shadow-[0_12px_34px_rgba(201,162,39,.28)] lg:inline-flex">
            Book a demo
          </DemoTrigger>
          <LandingMobileNav />
        </div>
      </div>
    </header>
  );
}

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
