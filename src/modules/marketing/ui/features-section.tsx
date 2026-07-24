import type { ReactNode } from 'react';
import { FEATURES } from '../constants';

const ICONS: Record<string, ReactNode> = {
  calendar: (
    <>
      <rect x="4" y="5" width="16" height="16" rx="2" />
      <path d="M4 9h16M8 3v4M16 3v4" />
    </>
  ),
  scale: (
    <>
      <path d="M12 3v18" />
      <path d="M5 8l7-3 7 3" />
      <path d="M5 8l-2 5a3 3 0 006 0L7 8" />
      <path d="M19 8l-2 5a3 3 0 006 0l-2-5" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20a6 6 0 0112 0" />
      <path d="M16 6a3 3 0 010 6M21 20a6 6 0 00-5-5.9" />
    </>
  ),
  receipt: (
    <>
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" />
      <path d="M9 8h6M9 12h6" />
    </>
  ),
};

export function FeaturesSection() {
  return (
    <section id="features" className="px-6 pt-20 pb-[30px]">
      <div className="mx-auto mb-[46px] max-w-[560px] text-center">
        <span className="text-gold-deep mb-2.5 inline-block text-[11.5px] font-bold tracking-[1.6px] uppercase">
          What you get
        </span>
        <h2 className="font-[family-name:var(--font-fraunces)] text-hunter mb-2.5 text-[clamp(24px,3vw,30px)] font-semibold tracking-[-0.01em]">
          Everything That&apos;s Currently in Six Places
        </h2>
        <p className="text-ink-soft text-[14.5px]">
          All of it talks to the same show, the same schedule, and the same set of riders.
        </p>
      </div>

      <div className="mx-auto grid max-w-[820px] grid-cols-1 gap-[18px] sm:grid-cols-2">
        {FEATURES.map((feature) => (
          <div
            key={feature.title}
            className="border-line rounded-[14px] border bg-white px-6 pt-6 pb-[22px]"
          >
            <div className="bg-hunter-pale mb-4 flex h-[38px] w-[38px] items-center justify-center rounded-[9px]">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-hunter h-[19px] w-[19px]"
              >
                {ICONS[feature.icon]}
              </svg>
            </div>
            <h3 className="font-[family-name:var(--font-fraunces)] text-ink mb-[7px] text-base font-semibold">{feature.title}</h3>
            <p className="text-ink-soft text-[13.5px] leading-relaxed">{feature.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
