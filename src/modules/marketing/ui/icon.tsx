import type { ReactNode } from 'react';

const PATHS: Record<string, ReactNode> = {
  registration: (
    <>
      <rect x="6" y="5" width="12" height="16" rx="1.5" />
      <path d="M9 5V4a1 1 0 011-1h4a1 1 0 011 1v1" />
      <path d="M9 11h6M9 15h6" />
    </>
  ),
  spreadsheet: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="1.5" />
      <path d="M4 9.5h16M4 14.5h16M9.5 4v16M14.5 4v16" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r=".7" fill="currentColor" stroke="none" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s7-6.6 7-11.5A7 7 0 005 9.5C5 14.4 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.4" />
    </>
  ),
  'clipboard-check': (
    <>
      <rect x="6" y="5" width="12" height="16" rx="1.5" />
      <path d="M9 5V4a1 1 0 011-1h4a1 1 0 011 1v1" />
      <path d="M9.5 13l1.5 1.5L14 11" />
    </>
  ),
  jump: <path d="M5 20V8M19 20V8M5 11h14" />,
  flag: <path d="M6 21V4M6 4h11l-3 4 3 4H6" />,
  star: <path d="M12 3l2.1 4.4 4.9.5-3.5 3.4.9 4.7L12 13.9 7.6 16l.9-4.7L5 7.9l4.9-.5L12 3z" />,
  grid: (
    <>
      <rect x="4" y="4" width="7" height="7" rx="1.2" />
      <rect x="13" y="4" width="7" height="7" rx="1.2" />
      <rect x="4" y="13" width="7" height="7" rx="1.2" />
      <rect x="13" y="13" width="7" height="7" rx="1.2" />
    </>
  ),
  database: (
    <>
      <ellipse cx="12" cy="7" rx="7" ry="3" />
      <path d="M5 7v5c0 1.6 3.1 3 7 3s7-1.4 7-3V7" />
      <path d="M5 12v5c0 1.6 3.1 3 7 3s7-1.4 7-3v-5" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5" width="16" height="15" rx="1.5" />
      <path d="M4 9.5h16M8 3v3.5M16 3v3.5" />
    </>
  ),
  copy: (
    <>
      <rect x="8" y="8" width="12" height="12" rx="1.5" />
      <path d="M4 16V5a1 1 0 011-1h11" />
    </>
  ),
  briefcase: (
    <>
      <rect x="3" y="8" width="18" height="12" rx="1.5" />
      <path d="M8 8V6a2 2 0 012-2h4a2 2 0 012 2v2" />
      <path d="M3 13h18" />
    </>
  ),
  check: <path d="M20 6L9 17l-5-5" />,
  clipboard: (
    <>
      <rect x="6" y="5" width="12" height="16" rx="1.5" />
      <path d="M9 5V4a1 1 0 011-1h4a1 1 0 011 1v1" />
      <path d="M9 11h6M9 15h4" />
    </>
  ),
  megaphone: (
    <>
      <path d="M3 11v2a2 2 0 002 2h1l3 5V5L6 10H5a2 2 0 00-2 1z" />
      <path d="M13 8a4 4 0 010 8" />
      <path d="M16 5a8 8 0 010 14" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="7" r="4" />
      <path d="M5 21c0-4.5 3-7 7-7s7 2.5 7 7" />
    </>
  ),
  store: (
    <>
      <path d="M4 9l1-4h14l1 4" />
      <path d="M4 9v10a1 1 0 001 1h14a1 1 0 001-1V9" />
      <path d="M4 9a2 2 0 004 0 2 2 0 004 0 2 2 0 004 0 2 2 0 004 0" />
    </>
  ),
};

export function Icon({ name, size = 22 }: { name: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}
