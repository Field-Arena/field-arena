// Redesign palette (field-arena-prototype/assets/style.css :root). Key names
// are kept from the previous design so existing callers restyle in place;
// the old gold accent maps onto the redesign's amber.
export const fa = {
  ink: '#101828',
  inkDeep: '#101828',
  body: '#475467',
  muted: '#8A94A3',
  faint: '#8A94A3',
  line: '#E7EAEE',
  lineSoft: '#EEF1F4',
  lineFaint: '#EEF1F4',
  field: '#E7EAEE',
  canvas: '#F5F7F8',
  surface: '#FFFFFF',
  hover: '#FBFCFD',
  green: '#146A47',
  greenDeep: '#0E5537',
  greenTint: '#EAF5EF',
  greenLine: '#CFE9DB',
  gold: '#B45309',
  goldFg: '#B45309',
  goldTint: '#FDF2E3',
  goldLine: '#F6DCB8',
  red: '#B42318',
  redDeep: '#912018',
  redTint: '#FEF3F2',
  redLine: '#FBCFC9',
  blue: '#0B6BB8',
  cream: '#FBFCFD',
  creamLine: '#E7EAEE',
} as const;

export const cardShadow = 'shadow-[0_1px_2px_rgba(16,24,40,.05)]';
export const cardShadowHover = 'hover:shadow-[0_4px_16px_rgba(16,24,40,.08)]';
export const cardBase = `bg-white border border-[#E7EAEE] rounded-[14px] ${cardShadow}`;
export const eyebrow = 'text-[11px] font-semibold uppercase tracking-[.08em] text-[#8A94A3]';
export const serif = 'font-[family-name:var(--fa-serif)]';
