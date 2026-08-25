const STROKE = {
  stroke: 'currentColor',
  strokeWidth: 1.75,
  fill: 'none',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const ROLE_PATHS: Record<string, React.ReactNode> = {
  SuperAdmin: <path {...STROKE} d="M12 3l7 3v5c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V6l7-3z" />,

  Organizer: (
    <>
      <rect x="4" y="4" width="12" height="12" rx="2" {...STROKE} />
      <path {...STROKE} d="M8 8h12v12H8" />
    </>
  ),

  ShowAdmin: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2" {...STROKE} />
      <path {...STROKE} d="M8.5 12l2.5 2.5 4.5-5" />
    </>
  ),

  Judge: (
    <>
      <path {...STROKE} d="M12 3v18" />
      <path {...STROKE} d="M5 8l7-3 7 3" />
      <path {...STROKE} d="M5 8l-2 5a3 3 0 006 0L7 8" />
      <path {...STROKE} d="M19 8l-2 5a3 3 0 006 0l-2-5" />
      <path {...STROKE} d="M8 21h8" />
    </>
  ),

  Scribe: (
    <>
      <path {...STROKE} d="M4 20l4-1 10.5-10.5a2.1 2.1 0 00-3-3L5 16l-1 4z" />
      <path {...STROKE} d="M13.5 6.5l3 3" />
    </>
  ),

  Announcer: (
    <>
      <path
        {...STROKE}
        d="M4 10v4a1 1 0 001 1h2l6 4V6L7 10H5a1 1 0 00-1 1z"
        transform="translate(-1 0)"
      />
      <path {...STROKE} d="M16 8a5 5 0 010 8" />
      <path {...STROKE} d="M18.5 5.5a9 9 0 010 13" />
    </>
  ),

  Vendor: (
    <>
      <path {...STROKE} d="M5 8h14l-1 12H6L5 8z" />
      <path {...STROKE} d="M9 8V6a3 3 0 016 0v2" />
    </>
  ),

  Rider: (
    <>
      <path {...STROKE} d="M6 20v-4c0-4 2-7 6-8l-1-3 3 1 2 3c2 1 3 3 3 6v5" />
      <path {...STROKE} d="M6 16h4" />
    </>
  ),

  ShowStaff: (
    <>
      <path {...STROKE} d="M6 21V4" />
      <path {...STROKE} d="M6 5h10l-2 3 2 3H6" />
    </>
  ),
};

export function RoleIcon({ role, size = 22 }: { role: string; size?: number }) {
  const body = ROLE_PATHS[role] ?? ROLE_PATHS.Organizer;

  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false">
      {body}
    </svg>
  );
}
