/* The owner's colour scale for every completion percentage on the dashboards
 * (setup, waivers, Coggins, horses cleared…): 50% or less red, 51–75% yellow,
 * 76–89% light green, 90–99% dark green, 100% light blue (done). Text uses a
 * darker shade of each so it stays readable on white.
 *
 * Not for competition scores — a 68% dressage ride isn't "red".
 *
 * `text` / `bar` are Tailwind classes; `textHex` / `barHex` are the same
 * colours for places a stylesheet rule would out-rank a utility class. */
export interface ApprovalTone {
  text: string;
  bar: string;
  textHex: string;
  barHex: string;
}

const NONE: ApprovalTone = {
  text: 'text-[#5A6B63]',
  bar: 'bg-[#EDF0EE]',
  textHex: '#5A6B63',
  barHex: '#EDF0EE',
};
const RED: ApprovalTone = {
  text: 'text-[#B4432F]',
  bar: 'bg-[#B4432F]',
  textHex: '#B4432F',
  barHex: '#B4432F',
};
const YELLOW: ApprovalTone = {
  text: 'text-[#9A6B00]',
  bar: 'bg-[#E0A800]',
  textHex: '#9A6B00',
  barHex: '#E0A800',
};
const LIGHT_GREEN: ApprovalTone = {
  text: 'text-[#3E8E5A]',
  bar: 'bg-[#6CC08B]',
  textHex: '#3E8E5A',
  barHex: '#6CC08B',
};
const DARK_GREEN: ApprovalTone = {
  text: 'text-[#1A5B3C]',
  bar: 'bg-[#1A5B3C]',
  textHex: '#1A5B3C',
  barHex: '#1A5B3C',
};
const LIGHT_BLUE: ApprovalTone = {
  text: 'text-[#3E6FA8]',
  bar: 'bg-[#8EC1F0]',
  textHex: '#3E6FA8',
  barHex: '#8EC1F0',
};

export function approvalTone(pct: number | null): ApprovalTone {
  if (pct === null) return NONE;
  if (pct <= 50) return RED;
  if (pct <= 75) return YELLOW;
  if (pct < 90) return LIGHT_GREEN;
  if (pct < 100) return DARK_GREEN;
  return LIGHT_BLUE;
}
