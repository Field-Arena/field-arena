/**
 * Organizer sidebar icons, ported verbatim from the inline SVGs in the legacy
 * showstaff.html sidebar (lines 862-871).
 *
 * These are the real paths, not lookalikes. Several carry their own stroke widths
 * (1.6 rather than 1.75 on the horse, ticket and dollar glyphs) and a couple use
 * a filled dot with `stroke="none"` — both preserved, because at 22px those
 * choices are what make the glyphs read correctly.
 */
const S = {
  stroke: 'currentColor',
  strokeWidth: 1.75,
  fill: 'none',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

/** The horse, ticket and dollar glyphs were drawn at a slightly finer weight. */
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
      <rect x="4" y="10" width="16" height="9.5" rx="1.3" stroke="currentColor" strokeWidth={1.6} fill="none" />
      <path {...S16} d="M7.5 10V8a2 2 0 012-2h5a2 2 0 012 2v2" />
      <path stroke="currentColor" strokeWidth={1.6} fill="none" strokeLinecap="round" d="M4 14.7h16" />
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
};

export function NavIcon({ name, size = 22 }: { name: string; size?: number }) {
  const body = PATHS[name] ?? PATHS.dashboard;

  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false">
      {body}
    </svg>
  );
}
