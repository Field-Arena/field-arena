/**
 * Shared Tailwind class tokens for the SuperAdmin signup-flow-preview demo
 * components (workspace-frame.tsx, demo-field.tsx, and the per-role preview
 * files). Kept in one plain module so the sibling preview components don't
 * end up importing each other just to share a class string.
 */
export const DISPLAY = 'font-[family-name:var(--font-nr)]';
export const FIELD =
  'h-auto w-full rounded-[10px] border border-field bg-white px-4 py-3 text-[14.5px] text-ink-deep';
export const LABEL = 'mb-2 block text-xs font-bold uppercase tracking-[.1em] text-forest';
export const GROUP = 'mb-3 text-[10.5px] font-bold uppercase tracking-[.18em] text-gold';
