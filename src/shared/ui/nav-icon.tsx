const S = {
  stroke: 'currentColor',
  strokeWidth: 1.75,
  fill: 'none',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const S16 = { ...S, strokeWidth: 1.6 };

const PATHS: Record<string, React.ReactNode> = {
  dashboard: (
    <>
      <rect x="4" y="4" width="7" height="7" rx="1.5" {...S} />
      <rect x="13" y="4" width="7" height="7" rx="1.5" {...S} />
      <rect x="4" y="13" width="7" height="7" rx="1.5" {...S} />
      <rect x="13" y="13" width="7" height="7" rx="1.5" {...S} />
    </>
  ),

  members: (
    <>
      <ellipse cx="12" cy="6" rx="8" ry="3" stroke="currentColor" strokeWidth={1.75} fill="none" />
      <path {...S} d="M4 6v6c0 1.66 3.58 3 8 3s8-1.34 8-3V6" />
      <path {...S} d="M4 12v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" />
    </>
  ),

  showmanager: (
    <>
      <path {...S} d="M4 20l4-1 10.5-10.5a2.1 2.1 0 00-3-3L5 16l-1 4z" />
      <path {...S} d="M13.5 6.5l3 3" />
    </>
  ),

  schedule: (
    <>
      <rect x="4" y="5" width="16" height="15" rx="1.5" {...S} />
      <path {...S} d="M4 9.5h16M8 3v3.5M16 3v3.5" />
    </>
  ),

  users: (
    <>
      <circle cx="9" cy="8" r="3" {...S} />
      <path {...S} d="M3 20a6 6 0 0112 0" />
      <path {...S} d="M16 6a3 3 0 010 6M21 20a6 6 0 00-5-5.9" />
    </>
  ),

  venues: (
    <>
      <path {...S} d="M12 21s7-6.6 7-11.5A7 7 0 005 9.5C5 14.4 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.4" stroke="currentColor" strokeWidth={1.75} fill="none" />
    </>
  ),

  horses: (
    <>
      <path
        {...S16}
        d="M15.2 20c-.2-2.8.3-4.8 1.7-6.6 1.2-1.5 1.5-3.1 1-4.9-.5-1.7-1.8-2.9-3.5-3.5L13 3l-.9 2.1c-3 .7-5.1 3.3-5.1 6.4 0 1.6.6 2.7 1.7 3.7L7.5 20"
      />
      <path {...S16} d="M15.6 8.2c1 .3 1.9.2 2.7-.5" />
      <circle cx="15.3" cy="7.1" r={0.7} fill="currentColor" stroke="none" />
    </>
  ),

  eventsales: (
    <>
      <rect
        x="4"
        y="10"
        width="16"
        height="9.5"
        rx="1.3"
        stroke="currentColor"
        strokeWidth={1.6}
        fill="none"
      />
      <path {...S16} d="M7.5 10V8a2 2 0 012-2h5a2 2 0 012 2v2" />
      <path
        stroke="currentColor"
        strokeWidth={1.6}
        fill="none"
        strokeLinecap="round"
        d="M4 14.7h16"
      />
      <circle cx="12" cy="17.2" r={0.7} fill="currentColor" stroke="none" />
    </>
  ),

  financial: (
    <>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={1.75} fill="none" />
      <path
        {...S}
        d="M12 6.5v11M15 9c0-1.4-1.3-2.3-3-2.3s-3 .9-3 2.2c0 1.4 1.3 1.9 3 2.3s3 .9 3 2.3c0 1.3-1.3 2.2-3 2.2s-3-.9-3-2.3"
      />
    </>
  ),

  documents: (
    <>
      <path {...S} d="M6 2h9l5 5v13a1 1 0 01-1 1H6a1 1 0 01-1-1V3a1 1 0 011-1z" />
      <path {...S} d="M14 2v6h6" />
    </>
  ),

  history: (
    <>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={1.75} fill="none" />
      <path {...S} d="M12 6v6l4 2" />
    </>
  ),

  find: (
    <>
      <circle cx="11" cy="11" r="6" {...S} />
      <path {...S} d="M20 20l-4-4" />
    </>
  ),

  riders: (
    <>
      <ellipse cx="10.5" cy="15.2" rx="6" ry="2.8" {...S} />
      <path {...S} d="M16 13.8c1-1.8 2-3.2 3.2-5" />
      <path {...S} d="M19.2 8.8l1.3.6" />
      <path {...S} d="M18.6 7.2l.6-1.4" />
      <path {...S} d="M5 14.2c-1.2.3-2 1.4-2.6 3" />
      <path {...S} d="M7 17.8v3M9.5 18v3M13 17.8v3M15.5 17.5v3" />
      <circle cx="12.6" cy="8" r="1.4" {...S} />
      <path {...S} d="M12.4 9.4v3.4" />
      <path {...S} d="M12.4 12.8c-.6 1.4-1 2.8-1.4 4.6" />
      <path {...S} d="M12.6 10.2c1.4.2 2.6.6 3.6 1.6" />
      <path {...S} d="M16.2 11.8l1.6-1.4" />
    </>
  ),

  stabling: (
    <>
      <path {...S} d="M3 10l9-6 9 6" />
      <path {...S} d="M5 10v10h14V10" />
      <path {...S} d="M12 20v-6M9 14h6" />
    </>
  ),

  vendors: (
    <>
      <path {...S} d="M5 8h14l-1 12H6L5 8z" />
      <path {...S} d="M9 8V6a3 3 0 016 0v2" />
    </>
  ),
};

/* Redesign icons (field-arena-prototype/organizer.html sidebar), drawn at the
   prototype's 1.7 stroke. Keys listed here win over PATHS above. */
const FA = {
  stroke: 'currentColor',
  strokeWidth: 1.7,
  fill: 'none',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const DESIGN_PATHS: Record<string, React.ReactNode> = {
  dashboard: <path {...FA} d="M3 13h8V3H3v10zm10 8h8V3h-8v18zM3 21h8v-6H3v6z" />,
  showmanager: <path {...FA} d="M16 4l4 4L8 20H4v-4L16 4z" />,
  schedule: (
    <path
      {...FA}
      d="M8 3v3M16 3v3M4 8h16M5 5h14a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z"
    />
  ),
  entries: <path {...FA} d="M9 5h10M9 12h10M9 19h10M5 5h.01M5 12h.01M5 19h.01" />,
  members: (
    <path {...FA} d="M17 20v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2M10 10a3 3 0 100-6 3 3 0 000 6z" />
  ),
  horses: (
    <path
      fill="currentColor"
      d="M6 22h12v-1.5H6V22zm1.5-2.5h9c.4-3.3-.6-6-2.7-7.9.6-.6 1-1.5.9-2.4 0-.3.3-.6.6-.4.7.3 1.5-.3 1.4-1.1-.1-2.2-1.5-4-3.5-4.8l.3-1.3c.1-.5-.4-.9-.9-.6-.8.4-1.5 1.1-1.9 1.9C8 4 6.4 5.8 6.4 8c0 .3 0 .5.1.8L5.1 10c-.5.4-.4 1.1.2 1.3l1.3.5c-.9 1.7-1.2 3.5-.9 5.3.1.5.3 1 .6 1.4z"
    />
  ),
  venues: (
    <>
      <path {...FA} d="M12 21s7-6.3 7-11a7 7 0 10-14 0c0 4.7 7 11 7 11z" />
      <circle {...FA} cx="12" cy="10" r="2.5" />
    </>
  ),
  eventsales: <path {...FA} d="M3 9l1-4h16l1 4M3 9h18v10a1 1 0 01-1 1H4a1 1 0 01-1-1V9zM9 13h6" />,
  documents: (
    <path {...FA} d="M4 5a2 2 0 012-2h5l2 3h5a2 2 0 012 2v9a2 2 0 01-2 2H6a2 2 0 01-2-2V5z" />
  ),
  financial: (
    <path {...FA} d="M12 3v18M17 7a4 4 0 00-4-2h-2a3 3 0 000 6h2a3 3 0 010 6h-2a4 4 0 01-4-2" />
  ),
};

export function NavIcon({ name, size = 22 }: { name: string; size?: number }) {
  const body = DESIGN_PATHS[name] ?? PATHS[name] ?? PATHS.dashboard;

  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false">
      {body}
    </svg>
  );
}
