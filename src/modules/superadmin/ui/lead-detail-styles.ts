/**
 * Shared Tailwind class tokens for the lead detail page
 * (lead-detail.tsx and its split-out section components). Kept in one plain
 * module, not re-exported from one of the components, so sibling sections don't
 * end up importing each other just to share a class string.
 */
export const INPUT =
  'w-full rounded-[9px] border border-[#D7E0DA] bg-white px-3.5 py-3 text-[14px] text-[#16261F] focus-visible:border-gold focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-gold/[.15]';
export const LABEL = 'mb-[7px] block text-[10.5px] font-bold uppercase tracking-[0.12em] text-fa-muted-2';
export const SECTION = 'rounded-[14px] border border-[#E2E8E4] bg-white px-7 pb-7 pt-[26px]';
export const H2 = 'font-[family-name:var(--font-nr)] text-[21px] font-medium tracking-[-.012em] text-hunter-deep';
export const SAVE =
  'rounded-[9px] bg-hunter-deep px-5 py-[11px] text-[13.5px] font-bold text-paper transition hover:bg-gold hover:text-hunter-deep disabled:opacity-60';
export const GRID = 'grid gap-[18px] [grid-template-columns:repeat(auto-fit,minmax(258px,1fr))]';
