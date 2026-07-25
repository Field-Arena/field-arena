import type { ReactNode } from 'react';

const PATHS: Record<string, ReactNode> = {
  grid: (
    <>
      <rect x="4" y="4" width="7" height="7" rx="1.4" />
      <rect x="13" y="4" width="7" height="7" rx="1.4" />
      <rect x="4" y="13" width="7" height="7" rx="1.4" />
      <rect x="13" y="13" width="7" height="7" rx="1.4" />
    </>
  ),
  database: (
    <>
      <ellipse cx="12" cy="6" rx="7" ry="3" />
      <path d="M5 6v6c0 1.6 3.1 3 7 3s7-1.4 7-3V6" />
      <path d="M5 12v6c0 1.6 3.1 3 7 3s7-1.4 7-3v-6" />
    </>
  ),
  pencil: (
    <>
      <path d="M4 20h4L19 9a2 2 0 00-3-3L5 17v3z" />
      <path d="M14 7l3 3" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20a6 6 0 0112 0" />
      <path d="M16 5.5a3.2 3.2 0 010 5.6M21 20a6 6 0 00-4.5-5.8" />
    </>
  ),
  doc: (
    <>
      <path d="M7 3h7l4 4v14a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z" />
      <path d="M14 3v4h4M9 12h6M9 16h4" />
    </>
  ),
  tag: (
    <>
      <path d="M3 12l8-8h9v9l-8 8-9-9z" />
      <circle cx="16" cy="8" r="1.4" fill="currentColor" stroke="none" />
    </>
  ),
  billing: (
    <>
      <rect x="4" y="6" width="16" height="12" rx="1.6" />
      <path d="M4 10h16M8 14h4" />
    </>
  ),
  shield: <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />,
  'check-square': (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2.4" />
      <path d="M8 12l3 3 5-6" />
    </>
  ),
  flag: <path d="M6 21V4M6 4h11l-3 4 3 4H6" />,
  scale: (
    <>
      <path d="M12 3v18M5 8l7-3 7 3" />
      <path d="M5 8l-2 5a3 3 0 006 0L7 8M19 8l-2 5a3 3 0 006 0l-2-5" />
    </>
  ),
  speaker: (
    <>
      <path d="M3 11v2a2 2 0 002 2h1l3 5V5L6 10H5a2 2 0 00-2 1z" />
      <path d="M13 8a4 4 0 010 8M16 5a8 8 0 010 14" />
    </>
  ),
  briefcase: (
    <>
      <rect x="3" y="8" width="18" height="12" rx="1.6" />
      <path d="M8 8V6a2 2 0 012-2h4a2 2 0 012 2v2M3 13h18" />
    </>
  ),
  trophy: (
    <>
      <path d="M7 4h10v4a5 5 0 01-10 0V4z" />
      <path d="M7 6H4v1a3 3 0 003 3M17 6h3v1a3 3 0 01-3 3M9 15h6M10 19h4M12 15v4" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  mobile: (
    <>
      <rect x="7" y="3" width="10" height="18" rx="2" />
      <path d="M11 18h2" />
    </>
  ),
};

export function DashIcon({ name, size = 18 }: { name: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}
