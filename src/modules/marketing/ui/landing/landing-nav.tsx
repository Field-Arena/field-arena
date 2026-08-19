import Link from 'next/link';
import { NAV_LINKS } from '@/modules/marketing/landing-content';
import { LoginTrigger } from '@/modules/auth/ui/login-trigger';
import { DemoTrigger } from '@/modules/marketing/ui/landing/demo-trigger';
import { LandingMobileNav } from '@/modules/marketing/ui/landing/mobile-nav';

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
