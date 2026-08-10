'use client';

import { useEffect, useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';

const EDGE_THRESHOLD = 24;

const JUMP_BTN =
  'flex size-10 items-center justify-center rounded-full border border-[#D9E1DD] bg-white text-forest shadow-[0_4px_14px_rgba(16,40,32,.16)] transition-colors hover:border-gold';

/**
 * Site-wide "scroll to top / scroll to bottom" jump buttons, fixed to the
 * bottom-right corner on every page. Tracks window scroll rather than any
 * one page's own layout, so it works the same on the dashboard, the public
 * marketing pages, and the rider-facing pages alike. Each button only shows
 * once there's actually somewhere to jump to.
 */
export function ScrollJumpButtons() {
  const [showTop, setShowTop] = useState(false);
  const [showBottom, setShowBottom] = useState(false);

  useEffect(() => {
    const update = () => {
      const scrollTop = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;
      setShowTop(scrollTop > EDGE_THRESHOLD);
      setShowBottom(scrollHeight - scrollTop - clientHeight > EDGE_THRESHOLD);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  if (!showTop && !showBottom) return null;

  return (
    <div className="fixed right-5 bottom-5 z-50 flex flex-col gap-2.5">
      {showTop && (
        <button
          type="button"
          aria-label="Scroll to top"
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={JUMP_BTN}
        >
          <ChevronUpIcon className="size-5" aria-hidden />
        </button>
      )}
      {showBottom && (
        <button
          type="button"
          aria-label="Scroll to bottom"
          onClick={() => {
            window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
          }}
          className={JUMP_BTN}
        >
          <ChevronDownIcon className="size-5" aria-hidden />
        </button>
      )}
    </div>
  );
}
