import 'server-only';
import { PDFDocument, StandardFonts, rgb, type PDFFont } from 'pdf-lib';

const PAGE_WIDTH_PT = 612;
const PAGE_HEIGHT_PT = 792;
const MARGIN_PT = 56;
const BODY_SIZE = 10.5;
const LINE_GAP = 4;

/* pdf-lib's standard fonts only encode WinAnsi. Anything outside it (emoji,
 * CJK, unusual punctuation) would throw at draw time, so it is folded to the
 * closest plain character or dropped. */
function toWinAnsi(value: string): string {
  return value
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    .replace(/\t/g, '  ')
    .replace(/[^\n\x20-\x7E\xA0-\xFF]/g, '');
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split('\n')) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push('');
      continue;
    }
    let current = '';
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        current = candidate;
      } else {
        if (current) lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);
  }
  return lines;
}

/** The record of a document a rider signed on the site: the exact wording they
 * agreed to, their typed name, and the server time it was signed. Stored in
 * horse-documents like an upload, so the organizer's document review opens it
 * the same way. */
export async function generateSignedDocumentPdf(input: {
  title: string;
  showName: string;
  agreementText: string;
  signedName: string;
  signedAtIso: string;
  signedDate: string;
  riderEmail: string | null;
  horseName: string;
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const maxWidth = PAGE_WIDTH_PT - 2 * MARGIN_PT;

  let page = doc.addPage([PAGE_WIDTH_PT, PAGE_HEIGHT_PT]);
  let y = PAGE_HEIGHT_PT - MARGIN_PT;

  const draw = (text: string, font: PDFFont, size: number, color = rgb(0.13, 0.15, 0.12)) => {
    for (const line of wrap(toWinAnsi(text), font, size, maxWidth)) {
      if (y < MARGIN_PT + size) {
        page = doc.addPage([PAGE_WIDTH_PT, PAGE_HEIGHT_PT]);
        y = PAGE_HEIGHT_PT - MARGIN_PT;
      }
      page.drawText(line, { x: MARGIN_PT, y: y - size, size, font, color });
      y -= size + LINE_GAP;
    }
  };

  draw(input.title, bold, 16);
  y -= 4;
  draw(`${input.showName} - Horse: ${input.horseName}`, regular, 11, rgb(0.35, 0.4, 0.37));
  y -= 14;
  draw(input.agreementText, regular, BODY_SIZE);
  y -= 22;
  draw('Signed electronically', bold, 12);
  y -= 2;
  draw(`Typed signature (full legal name): ${input.signedName}`, regular, BODY_SIZE);
  draw('"I agree" confirmed: Yes', regular, BODY_SIZE);
  draw(`Date signed: ${input.signedDate}`, regular, BODY_SIZE);
  draw(`Recorded (server time, UTC): ${input.signedAtIso}`, regular, BODY_SIZE);
  if (input.riderEmail) draw(`Rider account: ${input.riderEmail}`, regular, BODY_SIZE);

  return doc.save();
}
