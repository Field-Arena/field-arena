'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/shared/ui/organizer/card';
import { ghostButtonClass } from '@/shared/ui/organizer/buttons';
import { cn } from '@/shared/lib/utils';
import type { AttentionItem } from '@/modules/shows/data/queries';

export function AttentionCard({ items }: { items: AttentionItem[] }) {
  const [dismissed, setDismissed] = useState(false);

  if (items.length === 0 || dismissed) return null;

  return (
    <Card className="border-l-gold mb-3.5 border-l-4 p-[16px_20px_10px]">
      <div className="flex items-center justify-between gap-2.5">
        <h2 className="text-forest font-[family-name:var(--font-nr)] text-[17px] font-semibold">
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
                <span
                  aria-hidden
                  className={cn(
                    'inline-block size-[7px] flex-none rounded-full',
                    item.severity === 'warn' ? 'bg-[#B23A3A]' : 'bg-gold',
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
