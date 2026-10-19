'use client';

import { PrinterIcon } from 'lucide-react';
import { FA_BTN } from '@/shared/ui/organizer/fa-page';

export function PrintPnlButton() {
  return (
    <button
      type="button"
      className={`${FA_BTN} print:hidden`}
      onClick={() => {
        window.print();
      }}
    >
      <PrinterIcon className="size-4" aria-hidden />
      Print P&amp;L
    </button>
  );
}
