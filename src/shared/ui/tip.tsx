'use client';

import { useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

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
  const [coords, setCoords] = useState<{ x: number; y: number } | null>(null);
  const ref = useRef<HTMLSpanElement>(null);

  function open() {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    setCoords(
      placement === 'right'
        ? { x: rect.right + 10, y: rect.top + rect.height / 2 }
        : { x: rect.left + rect.width / 2, y: rect.top - 10 },
    );
  }

  function close() {
    setCoords(null);
  }

  return (
    <>
      <span
        ref={ref}
        onMouseEnter={open}
        onMouseLeave={close}
        onFocus={open}
        onBlur={close}
        className={className ?? 'block'}
      >
        {children}
      </span>

      {coords &&
        typeof document !== 'undefined' &&
        createPortal(
          <span
            role="tooltip"
            className="bg-hunter-deep pointer-events-none fixed z-[1000] max-w-[240px] rounded-lg px-[11px] py-[7px] text-[12.5px] leading-[1.35] font-semibold text-white shadow-[0_6px_20px_rgba(20,30,25,.28)]"
            style={{
              left: coords.x,
              top: coords.y,
              transform: placement === 'right' ? 'translateY(-50%)' : 'translate(-50%, -100%)',
            }}
          >
            {text}
            <span
              aria-hidden
              className="bg-hunter-deep absolute size-2 rotate-45"
              style={
                placement === 'right'
                  ? { left: -4, top: '50%', marginTop: -4 }
                  : { bottom: -4, left: '50%', marginLeft: -4 }
              }
            />
          </span>,
          document.body,
        )}
    </>
  );
}
