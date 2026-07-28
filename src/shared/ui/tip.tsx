'use client';

import { useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/**
 * The hover/focus tooltip from the legacy app, ported from FA.tooltips and the
 * `.fa-tip` rules in public/assets/styles.css.
 *
 * Styling matches: hunter-deep bubble, white 12.5px semibold text, 8px radius,
 * 240px max width, a rotated square as the arrow, and a short opacity plus 2px
 * translate transition.
 *
 * Two behaviours from the original are deliberately kept:
 *
 *  - It opens on keyboard focus as well as hover. In the collapsed sidebar the
 *    labels are hidden entirely, so the tooltip is the only way to identify an
 *    item — making it hover-only would leave keyboard users with nine unlabelled
 *    icons.
 *  - It renders through a portal to document.body. The sidebar is a scrolling
 *    flex column, so a tooltip positioned inside it gets clipped at the edge.
 */
export function Tip({
  text,
  placement = 'right',
  className,
  children,
}: {
  text: string;
  placement?: 'right' | 'top';
  /** Layout classes for the wrapper, which becomes the flex/grid child. */
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
        : { x: rect.left + rect.width / 2, y: rect.top - 10 }
    );
  }

  function close() {
    setCoords(null);
  }

  return (
    <>
      {/*
        A real box, not `display: contents`. An element with display:contents
        generates no box at all, so it cannot be hovered — the handlers never
        fire. This wrapper becomes the flex child in the sidebar and rail, so
        callers pass the layout classes the child used to carry.
      */}
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
            className="pointer-events-none fixed z-[1000] max-w-[240px] rounded-lg bg-hunter-deep px-[11px] py-[7px] text-[12.5px] font-semibold leading-[1.35] text-white shadow-[0_6px_20px_rgba(20,30,25,.28)]"
            style={{
              left: coords.x,
              top: coords.y,
              transform: placement === 'right' ? 'translateY(-50%)' : 'translate(-50%, -100%)',
            }}
          >
            {text}
            <span
              aria-hidden
              className="absolute size-2 rotate-45 bg-hunter-deep"
              style={
                placement === 'right'
                  ? { left: -4, top: '50%', marginTop: -4 }
                  : { bottom: -4, left: '50%', marginLeft: -4 }
              }
            />
          </span>,
          document.body
        )}
    </>
  );
}
