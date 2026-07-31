/**
 * Shared Tailwind class strings for the Show Manager Setup cards, lifted
 * verbatim from the Admin Console design's inline styles (Field & Arena
 * Admin Console.dc.html — the Show Manager / Setup section). Kept in one
 * place because every Setup card repeats the same card shell, section
 * heading, field label, and input recipe; the arbitrary values below are
 * the design's own hex/px values, not approximations from the existing
 * marketing or workspace token sets (most are close but not identical).
 */

export const DISPLAY = 'font-[family-name:var(--font-nr)]';

/** Setup cards use the shared `Card` (src/shared/ui/organizer/card.tsx) with this padding — the design's own 22/24/26px, not Card's bare shell. */
export const SM_CARD_PAD = 'p-[22px_24px_26px]';

export const SM_SECTION_HEAD = `${DISPLAY} mb-4 text-[21px] font-semibold leading-[1.2] tracking-[-.012em] text-forest`;

export const SM_NOTE = 'mb-4 max-w-[960px] text-[12.5px] leading-[1.55] text-[#6E7C76] text-pretty';

export const SM_LABEL = 'mb-2 block text-[10px] font-bold uppercase tracking-[.14em] text-[#6E7C76]';

export const SM_INPUT =
  'w-full rounded-[10px] border border-[#D9E1DD] bg-white px-3.5 py-3 text-sm text-ink-deep outline-none focus-visible:border-gold focus-visible:ring-[3px] focus-visible:ring-gold/[.16]';

export const SM_SELECT = SM_INPUT + ' appearance-none';

/** The compact per-row inputs inside a list (ring rows, division rows, …). */
export const SM_ROW_INPUT =
  'w-full rounded-[6px] border border-[#AEB8B3] bg-white px-3 py-2.5 text-[13.5px] font-semibold text-ink-deep outline-none focus-visible:border-gold';

export const SM_GREEN_BTN =
  'inline-flex items-center gap-2 rounded-[9px] bg-[#1A5B3C] px-[18px] py-3 text-[13.5px] font-bold text-[#F5F7F6] transition-colors hover:bg-forest disabled:opacity-60';

export const SM_GHOST_BTN =
  'inline-flex items-center gap-2 rounded-[9px] border border-[#D9E1DD] bg-white px-3.5 py-2.5 text-[12.5px] font-semibold text-forest transition-colors hover:border-gold';
