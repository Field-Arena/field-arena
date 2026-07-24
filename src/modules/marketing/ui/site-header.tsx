import Link from 'next/link';
import { NAV_LINKS } from '../constants';

export function SiteHeader() {
  return (
    <header className="border-line bg-cream/90 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex max-w-[1080px] items-center gap-3 px-6 py-3.5">
        <span className="bg-hunter font-[family-name:var(--font-fraunces)] flex h-[30px] w-[30px] items-center justify-center rounded-[7px] text-sm font-bold text-white">
          F<span className="text-gold">&amp;</span>A
        </span>
        <span className="font-[family-name:var(--font-fraunces)] text-hunter text-base font-semibold">Field &amp; Arena</span>

        <nav className="ml-auto flex items-center gap-5 text-[13.5px] font-medium">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="text-ink-soft hover:text-hunter">
              {link.label}
            </a>
          ))}
          <Link
            href="/login"
            className="bg-hunter hover:bg-hunter-mid rounded-lg px-4 py-2.5 font-semibold text-white"
          >
            Log in
          </Link>
        </nav>
      </div>
    </header>
  );
}
