/* Show Manager section styling — the redesign's grouped form section
 * (.fs-head / .fs-body in field-arena-prototype/assets/style.css). A section
 * is a Card with SM_CARD_PAD whose first child is an SM_SECTION_HEAD heading;
 * the heading pulls itself out to the card edges (-m) so its divider runs
 * full width, the way the prototype's .fs-head does. */
export const DISPLAY = 'font-[family-name:var(--fa-serif)]';

export const SM_CARD_PAD = 'p-5';

export const SM_SECTION_HEAD =
  '-mx-5 -mt-5 mb-5 flex items-center gap-[11px] border-b border-[#EEF1F4] px-5 py-[15px] text-[14.5px] font-semibold leading-snug text-[#101828]';

export const SM_NOTE = 'mb-4 max-w-[860px] text-[12.5px] leading-[1.55] text-[#8A94A3] text-pretty';

export const SM_LABEL = 'mb-1.5 block text-[12.5px] font-semibold text-[#475467]';

export const SM_INPUT =
  'h-10 w-full rounded-[10px] border border-[#E7EAEE] bg-white px-3 text-[13.5px] text-[#101828] outline-none transition focus-visible:border-[#9FD3BA] focus-visible:shadow-[0_0_0_3px_#EAF5EF]';

export const SM_SELECT = SM_INPUT + ' appearance-auto';

export const SM_ROW_INPUT =
  'h-[38px] w-full rounded-[9px] border border-[#E7EAEE] bg-white px-3 text-[13.5px] font-medium text-[#101828] outline-none focus-visible:border-[#9FD3BA] focus-visible:shadow-[0_0_0_3px_#EAF5EF]';

export const SM_GREEN_BTN =
  'inline-flex items-center gap-[7px] whitespace-nowrap rounded-[10px] bg-[#146A47] px-[15px] py-[9px] text-[13px] font-semibold text-white shadow-[0_1px_2px_rgba(16,80,55,.3)] transition hover:bg-[#0E5537] disabled:opacity-60';

export const SM_GHOST_BTN =
  'inline-flex items-center gap-[7px] whitespace-nowrap rounded-[10px] border border-[#E7EAEE] bg-white px-[15px] py-[9px] text-[13px] font-semibold text-[#475467] shadow-[0_1px_2px_rgba(16,24,40,.05)] transition hover:border-[#D6DBE1] hover:bg-[#FBFCFD] hover:text-[#101828]';
