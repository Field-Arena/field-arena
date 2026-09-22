'use client';

import type { ReactNode } from 'react';
import { Tooltip } from 'radix-ui';

export function Tip({
  text,
  placement = 'right',
  className,
  children,
}: {
  text: string;
  placement?: 'right' | 'top';

  className?: string;
  children: ReactNode;
}) {
  return (
    <Tooltip.Provider delayDuration={200}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <span className={className ?? 'block'}>{children}</span>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side={placement}
            sideOffset={10}
            collisionPadding={8}
            className="bg-hunter-deep z-[80] max-w-[min(240px,calc(100vw-16px))] rounded-lg px-[11px] py-[7px] text-[12.5px] leading-[1.35] font-semibold text-white shadow-[0_6px_20px_rgba(20,30,25,.28)]"
          >
            {text}
            <Tooltip.Arrow className="fill-hunter-deep" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
