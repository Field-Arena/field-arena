/**
 * Shared Tailwind class strings for the venue form/stable-config dialogs.
 *
 * Deliberately a local copy of shows/ui/show-manager/tokens.ts's class
 * strings, not an import — a module must not reach into another module's
 * `ui/` internals (.claude/rules/folder-structure.md). The venue library's
 * ring editor is meant to look and behave like Show Manager's VenueCard
 * (see venue-form-dialog.tsx's doc comment), which is why these values match
 * that file's SM_* tokens verbatim rather than approximating them.
 */

export const VT_LABEL = 'mb-2 block text-[10px] font-bold uppercase tracking-[.14em] text-[#6E7C76]';

export const VT_INPUT =
  'w-full rounded-[10px] border border-[#D9E1DD] bg-white px-3.5 py-3 text-sm text-ink-deep outline-none focus-visible:border-gold focus-visible:ring-[3px] focus-visible:ring-gold/[.16]';

export const VT_SELECT = VT_INPUT + ' appearance-none';

/** The compact per-row inputs inside a list (ring rows, stable rows, …). */
export const VT_ROW_INPUT =
  'w-full rounded-[6px] border border-[#AEB8B3] bg-white px-3 py-2.5 text-[13.5px] font-semibold text-ink-deep outline-none focus-visible:border-gold';

export const VT_NOTE = 'mb-4 max-w-[560px] text-[12.5px] leading-[1.55] text-[#6E7C76] text-pretty';

export const VT_SECTION_LABEL = 'mb-2 block text-[12.5px] font-semibold text-ink-deep';
