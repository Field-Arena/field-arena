'use client';

import { useState } from 'react';
import { Button } from '@/shared/ui/shadcn/button';
import { Card } from '@/shared/ui/organizer/card';
import { cn } from '@/shared/lib/utils';
import { STRIPE_PAYOUT_DECISIONS } from '@/modules/shows/constants';
import { SM_CARD_PAD, SM_NOTE } from '@/modules/shows/ui/show-manager/tokens';

export function PayoutArchitectureCard() {
  const [open, setOpen] = useState(true);

  return (
    <Card className={cn(SM_CARD_PAD, 'border-l-gold border-l-4')}>
      <Button
        type="button"
        variant="ghost"
        onClick={() => {
          setOpen((v) => !v);
        }}
        aria-expanded={open}
        className="flex h-auto w-full items-center justify-between gap-2.5 px-0 py-0 text-left hover:bg-transparent"
      >
        <span className="text-forest font-[family-name:var(--font-nr)] text-[17px] font-semibold">
          ✓ Payout architecture — confirmed
        </span>
        <span className="text-[11px] whitespace-nowrap text-[#7A8781]">
          {open ? 'Hide ▲' : 'Show ▼'}
        </span>
      </Button>

      {open && (
        <>
          <p className={cn(SM_NOTE, 'mt-2.5')}>
            Field &amp; Arena is merchant of record — <b>Separate Charges and Transfers</b>: rider
            and vendor payments land in Field &amp; Arena&apos;s Stripe balance first, and
            organizers are paid out via a separate transfer afterward.
          </p>
          <ol className="text-ink-deep mt-2.5 list-decimal pl-5 text-[13.5px] leading-[1.55]">
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
    </Card>
  );
}
