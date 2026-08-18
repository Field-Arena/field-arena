import Link from 'next/link';

/**
 * Sign-in has no step marker, but the panel is hidden on mobile — so the brand
 * still has to appear somewhere on a small screen.
 */
export function MobileBrand() {
  return (
    <Link href="/" className="flex items-center gap-2.5 text-forest lg:invisible">
      <span className="grid size-7 place-items-center rounded-lg bg-gold font-[family-name:var(--font-nr)] text-xs font-semibold text-forest">
        F&amp;A
      </span>
      <span className="font-[family-name:var(--font-nr)] text-base font-medium">
        Field &amp; Arena
      </span>
    </Link>
  );
}
