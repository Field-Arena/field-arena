'use client';

import { useState } from 'react';
import { CardTitle, FA_BTN_SMALL, FaCard } from '@/shared/ui/organizer/fa-page';
import { STRIPE_PAYOUT_DECISIONS } from '@/modules/shows/constants';

export function PayoutArchitectureCard() {
  const [open, setOpen] = useState(false);

  return (
    <FaCard className="mt-4">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <CardTitle className="text-[17px]">✓ Payout architecture — confirmed</CardTitle>
        <button
          type="button"
          className={FA_BTN_SMALL}
          aria-expanded={open}
          onClick={() => {
            setOpen((v) => !v);
          }}
        >
          {open ? 'Hide ▴' : 'Show ▾'}
        </button>
      </div>

      {open && (
        <>
          <p className="mt-2.5 text-[13.5px] leading-[1.55] text-[#3F4F48]">
            Field &amp; Arena is merchant of record — <b>Separate Charges and Transfers</b>: rider
            and vendor payments land in Field &amp; Arena&apos;s Stripe balance first, and
            organizers are paid out via a separate transfer afterward.
          </p>
          <ol className="mt-2.5 list-decimal pl-5 text-[13.5px] leading-[1.55] text-[#0D2C23]">
            {STRIPE_PAYOUT_DECISIONS.map((decision) => (
              <li key={decision} className="mb-2">
                {decision.startsWith('Still open') ? (
                  <>
                    <b>Still open</b>
                    {decision.slice('Still open'.length)}
                  </>
                ) : (
                  decision
                )}
              </li>
            ))}
          </ol>
        </>
      )}
    </FaCard>
  );
}
