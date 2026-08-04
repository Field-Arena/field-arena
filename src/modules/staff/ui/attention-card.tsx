'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/shared/ui/organizer/card';
import { ghostButtonClass } from '@/shared/ui/organizer/buttons';
import { cn } from '@/shared/lib/utils';
import type { AttentionItem } from '@/modules/shows/data/queries';

/**
 * "Needs your attention" — the first thing on the dashboard.
 *
 * Ported from showstaff.html's attentionCardHtml. It sits above the stat cards
 * rather than among them because "is anything broken right now" is the question
 * an organizer lands with, and a grid of equally-weighted tiles answers it last.
 *
 * Every row is a real signal computed from real rows — see getShowAttention.
 * Nothing is padded in to keep the card from looking empty; when there is
 * nothing wrong the card does not render at all.
 */
export function AttentionCard({ items }: { items: AttentionItem[] }) {
  /**
   * Dismissal is per session, not stored.
   *
   * The organizer can clear it off the screen while they work through
   * something, and it comes back next time they land on the dashboard — a
   * persisted dismissal would let a show quietly stay unpublished forever.
   */
  const [dismissed, setDismissed] = useState(false);

  if (items.length === 0 || dismissed) return null;

  return (
    <Card className="mb-3.5 border-l-4 border-l-gold p-[16px_20px_10px]">
      <div className="flex items-center justify-between gap-2.5">
        <h2 className="font-[family-name:var(--font-nr)] text-[17px] font-semibold text-forest">
          Needs your attention
        </h2>
        <button
          type="button"
          title="Hide until the next time you load the Dashboard"
          className={cn(ghostButtonClass, 'px-2.5 py-[3px] text-[11.5px]')}
          onClick={() => {
            setDismissed(true);
          }}
        >
          ✕ Hide
        </button>
      </div>

      <ul className="mt-1">
        {items.map((item) => (
          <li
            key={item.label}
            className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EEF2F0] py-[9px] last:border-b-0"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[13.5px] font-semibold">
                {/* Severity is carried in the dot as well as the order, so the
                    difference between "this blocks going live" and "this wants
                    a decision" reads without counting rows. */}
                <span
                  aria-hidden
                  className={cn(
                    'inline-block size-[7px] flex-none rounded-full',
                    item.severity === 'warn' ? 'bg-[#B23A3A]' : 'bg-gold'
                  )}
                />
                {item.label}
              </div>
              <p className="mt-0.5 ml-[13px] text-[12.5px] text-[#6E7C76]">{item.detail}</p>
            </div>

            <Link
              href={item.href}
              className={cn(ghostButtonClass, 'flex-none px-3 py-1.5 text-[12.5px]')}
            >
              {item.actionLabel} →
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
