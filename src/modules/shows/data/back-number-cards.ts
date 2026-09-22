import 'server-only';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export interface BackNumberCard {
  backNumber: string;
}

const PT_PER_IN = 72;
const PAGE_WIDTH_PT = 8.5 * PT_PER_IN;
const PAGE_HEIGHT_PT = 11 * PT_PER_IN;
const DEFAULT_CARD_WIDTH_IN = 8.5;
const DEFAULT_CARD_HEIGHT_IN = 5.5;
const SAFE_MARGIN_PT = 0.5 * PT_PER_IN;
const CAPTION_RESERVE_PT = 26;
const MAX_FONT_SIZE = 250;
const MIN_FONT_SIZE = 60;
const FONT_STEP = 5;

/* Digits have no descenders in Helvetica-Bold, so the glyph's visual
 * height tracks close to cap-height rather than the full em box — 0.72 is
 * a standard Helvetica cap-height/em ratio, used only to vertically
 * center the number, not for the auto-fit measurement itself (that uses
 * pdf-lib's own width/height metrics). */
const CAP_HEIGHT_RATIO = 0.72;

/* Generates one Letter-page PDF, two cards per sheet (top/bottom half,
 * split by a dashed cutting guide at the page's vertical midpoint),
 * with the number auto-fit as large as possible inside a safe margin —
 * starting at 250pt and stepping down until it fits, landing around
 * 200-220pt for four digits on the default 8.5x5.5in card. Card size is a
 * per-request parameter, not persisted — nothing in the spec requires it
 * to be remembered per show. */
export async function generateBackNumberCardsPdf(
  cards: BackNumberCard[],
  options?: { cardWidthIn?: number; cardHeightIn?: number },
): Promise<Uint8Array> {
  const cardWidthPt = (options?.cardWidthIn ?? DEFAULT_CARD_WIDTH_IN) * PT_PER_IN;
  const cardHeightPt = (options?.cardHeightIn ?? DEFAULT_CARD_HEIGHT_IN) * PT_PER_IN;

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.HelveticaBold);

  const maxTextWidth = cardWidthPt - 2 * SAFE_MARGIN_PT;
  const maxTextHeight = cardHeightPt - 2 * SAFE_MARGIN_PT - CAPTION_RESERVE_PT;

  for (let i = 0; i < cards.length; i += 2) {
    const page = doc.addPage([PAGE_WIDTH_PT, PAGE_HEIGHT_PT]);
    const pair = [cards[i], cards[i + 1]];

    pair.forEach((card, slot) => {
      if (!card) return;
      // slot 0 is the top card, slot 1 the bottom — origin is bottom-left.
      const cardOriginY = slot === 0 ? PAGE_HEIGHT_PT - cardHeightPt : 0;
      drawCard(page, font, card.backNumber, {
        originX: 0,
        originY: cardOriginY,
        width: cardWidthPt,
        height: cardHeightPt,
        maxTextWidth,
        maxTextHeight,
      });
    });

    page.drawLine({
      start: { x: SAFE_MARGIN_PT / 2, y: PAGE_HEIGHT_PT / 2 },
      end: { x: PAGE_WIDTH_PT - SAFE_MARGIN_PT / 2, y: PAGE_HEIGHT_PT / 2 },
      thickness: 0.75,
      dashArray: [4, 4],
      color: rgb(0.6, 0.6, 0.6),
    });
  }

  return doc.save();
}

function fitFontSize(
  font: Awaited<ReturnType<PDFDocument['embedFont']>>,
  text: string,
  maxWidth: number,
  maxHeight: number,
): number {
  let size = MAX_FONT_SIZE;
  while (size > MIN_FONT_SIZE) {
    const width = font.widthOfTextAtSize(text, size);
    const height = size * CAP_HEIGHT_RATIO;
    if (width <= maxWidth && height <= maxHeight) break;
    size -= FONT_STEP;
  }
  return size;
}

function drawCard(
  page: Awaited<ReturnType<PDFDocument['addPage']>>,
  font: Awaited<ReturnType<PDFDocument['embedFont']>>,
  text: string,
  box: { originX: number; originY: number; width: number; height: number; maxTextWidth: number; maxTextHeight: number },
): void {
  const size = fitFontSize(font, text, box.maxTextWidth, box.maxTextHeight);
  const textWidth = font.widthOfTextAtSize(text, size);
  const capHeight = size * CAP_HEIGHT_RATIO;

  const x = box.originX + (box.width - textWidth) / 2;
  const y = box.originY + (box.height - capHeight) / 2;

  page.drawText(text, { x, y, size, font, color: rgb(0, 0, 0) });

  const captionSize = 8;
  const caption = 'PRINT AT 100% / ACTUAL SIZE';
  const captionWidth = font.widthOfTextAtSize(caption, captionSize);
  page.drawText(caption, {
    x: box.originX + (box.width - captionWidth) / 2,
    y: box.originY + SAFE_MARGIN_PT / 3,
    size: captionSize,
    font,
    color: rgb(0.55, 0.55, 0.55),
  });
}
