'use client';

import { useEffect } from 'react';
import { PrinterIcon } from 'lucide-react';

/** Opens the print dialog once the sheets have rendered (the organizer
 * clicked Print to get here), and offers a button to open it again.
 * "Save as PDF" in that dialog gives the single PDF of every sheet. */
export function PrintNowButton({ autoPrint }: { autoPrint: boolean }) {
  useEffect(() => {
    if (!autoPrint) return;
    const t = window.setTimeout(() => {
      window.print();
    }, 600);
    return () => {
      window.clearTimeout(t);
    };
  }, [autoPrint]);

  return (
    <button
      type="button"
      onClick={() => {
        window.print();
      }}
      className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-[10px] border-2 border-[#1A5B3C] bg-[#1A5B3C] px-5 text-[15px] font-bold text-white"
    >
      <PrinterIcon className="size-4" aria-hidden />
      Print or save as PDF
    </button>
  );
}
