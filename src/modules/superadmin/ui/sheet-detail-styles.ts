/**
 * Shared Tailwind class tokens for the catalog sheet editor
 * (sheet-detail.tsx, sheet-details-form.tsx, sheet-movements-editor.tsx,
 * sheet-collectives-editor.tsx). Kept in one plain module, not re-exported from
 * one of the components, so none of the four end up importing each other just
 * to share a class string — that would create a circular import between
 * sibling components for no reason.
 */
export const SECTION = 'rounded-[14px] border border-[#E7E0D0] bg-[#F6F0E2] px-[26px] pb-[26px] pt-6';
export const LABEL = 'mb-2 block text-[10.5px] font-bold uppercase tracking-[0.13em] text-[#7A6A5C]';
export const INPUT =
  'w-full rounded-lg border border-[#D7CFBB] bg-white px-3.5 py-3 text-[14px] text-[#16261F] focus-visible:border-gold focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-gold/[.15]';
export const SMALL_INPUT =
  'rounded-[7px] border border-[#E7E0D0] bg-[#FBFAF7] px-2.5 py-2 text-[13.5px] text-[#16261F] focus-visible:border-gold focus-visible:outline-none';
export const H2 = 'font-[family-name:var(--font-nr)] text-[20px] font-semibold text-[#16261F]';
