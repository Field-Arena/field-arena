import Link from 'next/link';

export function MobileBrand() {
  return (
    <Link href="/" className="text-forest flex items-center gap-2.5 lg:invisible">
      <span className="bg-gold text-forest grid size-7 place-items-center rounded-lg font-[family-name:var(--font-nr)] text-xs font-semibold">
        F&amp;A
      </span>
      <span className="font-[family-name:var(--font-nr)] text-base font-medium">
        Field &amp; Arena
      </span>
    </Link>
  );
}
