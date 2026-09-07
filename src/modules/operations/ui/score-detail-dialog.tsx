'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/shadcn/dialog';

/* Click any score, anywhere it is shown, to open its detail — legacy
 * showstaff-ops.html:615 openScoreDetail, reached through scoreLink (:694).
 *
 * In REAL mode legacy deliberately refuses to show a breakdown: the roster GET
 * carries only the class's final percentage, never the judge's per-movement
 * marks (those live in the scoring app's own sheets, keyed by seat/judge), and
 * a fabricated breakdown "would look exactly like a real judge's sheet"
 * (:621-625). So the dialog restates who and what, shows the final score, and
 * points at the app that does hold the sheet. That signpost is the only thing
 * here the row itself doesn't already say — and it is the reason to keep it. */
export function ScoreDetailDialog({
  num,
  rider,
  horse,
  className: classLabel,
  pct,
  children,
}: {
  num: string;
  rider: string;
  horse: string;
  className: string;
  pct: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Reset to inline text: `.pct` carries no styling in this app, so the
          score previously rendered as plain text. A default <button> would put
          a grey box in the middle of the table — this keeps it looking like the
          score it replaces, with a link affordance. */}
      <button
        type="button"
        className="score-link pct"
        onClick={() => {
          setOpen(true);
        }}
        aria-label={`Score detail for ${rider}`}
        style={{
          all: 'unset',
          cursor: 'pointer',
          textDecoration: 'underline',
          textDecorationStyle: 'dotted',
          textUnderlineOffset: 3,
          whiteSpace: 'nowrap',
        }}
      >
        {children} ↗
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle className="text-hunter-deep font-serif text-lg">
              {num ? `#${num} · ` : ''}
              {rider}
            </DialogTitle>
            <DialogDescription>
              {horse} · {classLabel}
            </DialogDescription>
          </DialogHeader>

          <p className="font-serif text-[22px] font-bold text-[#16261F]">Final score: {pct}</p>

          <p className="text-fa-muted text-[13.5px] leading-[1.6]">
            Movement-by-movement detail isn&apos;t available from this screen. See the judge/scribe
            scoring app for the full sheet.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
