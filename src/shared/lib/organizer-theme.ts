/**
 * Colour and shell tokens for the organizer workspace's Admin Console design
 * (Dashboard, Show Manager, and siblings) — ported verbatim from the design
 * export's src/lib/organizer-theme.ts. Distinct from the public-site tokens
 * in globals.css: those are Tailwind theme vars for the marketing pages,
 * this is a plain object because the design export's own components (Card,
 * StatCard, StatusPill, …) consume it as inline style values (tintBg/tintFg,
 * pill bg/border/fg) rather than utility classes.
 */
export const fa = {
  ink: '#16261F',
  inkDeep: '#0D2C23',
  body: '#5A6B63',
  muted: '#7A8781',
  faint: '#98A29D',
  line: '#E9EDEB',
  lineSoft: '#EDF0EE',
  lineFaint: '#F1F4F3',
  field: '#D9E1DD',
  canvas: '#F5F7F6',
  surface: '#FFFFFF',
  hover: '#F8FAF9',
  green: '#1A5B3C',
  greenDeep: '#144A30',
  greenTint: '#E9F4EE',
  greenLine: '#BEDDCB',
  gold: '#C9A227',
  goldFg: '#8A6D14',
  goldTint: '#FCF3E4',
  goldLine: '#E8D79A',
  red: '#B4432F',
  redDeep: '#98341F',
  redTint: '#FDEEEB',
  redLine: '#E4B5AC',
  blue: '#2F6FB0',
  cream: '#F8F5EC',
  creamLine: '#E7E0D0',
} as const;

export const cardShadow =
  'shadow-[0_1px_2px_rgba(16,40,32,.04),0_10px_26px_-16px_rgba(16,40,32,.14)]';
export const cardShadowHover =
  'hover:shadow-[0_2px_4px_rgba(16,40,32,.05),0_16px_34px_-18px_rgba(16,40,32,.2)]';
export const cardBase = `bg-white border border-[#EDF0EE] rounded-[14px] ${cardShadow}`;
export const eyebrow = 'text-[9.5px] font-bold uppercase tracking-[.14em] text-[#6E7C76]';
export const serif = 'font-[Newsreader,serif]';
