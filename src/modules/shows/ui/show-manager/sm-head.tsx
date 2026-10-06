import type { ReactNode } from 'react';
import { SM_SECTION_HEAD } from './tokens';

const S = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

/* Section icons — the prototype's Setup ones where it has them, the same
 * stroke language for the sections only the live app has. */
const ICONS: Record<string, ReactNode> = {
  details: <path {...S} d="M9 5h10M9 12h10M9 19h10M5 5h.01M5 12h.01M5 19h.01" />,
  bodies: <path {...S} d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" />,
  venue: (
    <>
      <path {...S} d="M12 21s7-6.3 7-11a7 7 0 10-14 0c0 4.7 7 11 7 11z" />
      <circle {...S} cx="12" cy="10" r="2.5" />
    </>
  ),
  schedule: (
    <path
      {...S}
      d="M8 3v3M16 3v3M4 8h16M5 5h14a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z"
    />
  ),
  link: (
    <path
      {...S}
      d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1"
    />
  ),
  contact: <path {...S} d="M4 6h16v12H4zM4 7l8 6 8-6" />,
  prize: <path {...S} d="M6 3h12v4a6 6 0 01-12 0V3zM12 13v4M8 21h8M9 17h6" />,
  divisions: <path {...S} d="M4 6h16M4 12h16M4 18h10" />,
  merch: <path {...S} d="M3 7h18l-1.5 12H4.5L3 7zM8 7V5a4 4 0 018 0v2" />,
  waiver: <path {...S} d="M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h4" />,
};

export function SmHead({
  icon,
  title,
  sub,
  children,
}: {
  icon: keyof typeof ICONS;
  title: ReactNode;
  sub?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className={SM_SECTION_HEAD}>
      <span className="grid size-8 flex-none place-items-center rounded-[9px] bg-[#EAF5EF] text-[#146A47]">
        <svg viewBox="0 0 24 24" width={17} height={17} aria-hidden>
          {ICONS[icon]}
        </svg>
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="m-0 text-[14.5px] font-semibold text-[#101828]">{title}</h2>
        {sub && <div className="mt-px text-[12px] font-normal text-[#8A94A3]">{sub}</div>}
      </div>
      {children}
    </div>
  );
}
