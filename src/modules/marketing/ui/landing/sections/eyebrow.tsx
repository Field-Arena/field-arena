import type { ReactNode } from 'react';

/**
 * Every eyebrow in the reference is #C9A227, on light and forest sections
 * alike — there is no light/dark split. An earlier `dark` prop swapped the two
 * forest eyebrows to #E3C566 on the strength of the README's accessibility
 * note, but that note describes what the reference already does elsewhere, not
 * an instruction to change these. Gold on forest measures ~6.1:1, so AA for
 * normal text holds without the swap.
 */
export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="mb-[18px] text-[10.5px] font-bold uppercase tracking-[.18em] text-gold">
      {children}
    </div>
  );
}
