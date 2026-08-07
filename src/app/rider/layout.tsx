import { getCurrentRiderProfile } from '@/modules/riders/data/queries';

const HUNTER_DEEP = '#1F3A2E';
const GOLD = '#C9A227';
const CREAM = '#F7F3E9';
const INK = '#22271F';
const SYSTEM_SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
const GEORGIA_SERIF = "Georgia, 'Times New Roman', serif";

/**
 * The rider portal's page-level shell — pixel-matched to legacy's `<header>`
 * (public/views/rider.html lines 19-24, 321-327), which sits above every
 * rider view (wizard, dashboard, confirmation) and is shared across all of
 * them, not per-view. Deliberately uses legacy's own exact palette
 * (--hunter-deep:#1F3A2E, --gold:#C9A227, --cream:#F7F3E9) and font stack
 * (system sans body, Georgia serif headings) rather than this app's own
 * dashboard theme (--hunter-deep:#0d2c23, Fraunces/Inter) — the two are
 * deliberately different design systems, and the rider portal is scoped to
 * match legacy exactly, not the rest of this app.
 *
 * "Rider Portal" in the DOM, not "RIDER PORTAL" — legacy's `.brand-sub`
 * applies `text-transform:uppercase` in CSS, so the literal text stays
 * title-case here and the same CSS-level transform reproduces the look.
 */
export default async function RiderLayout({ children }: { children: React.ReactNode }) {
  const rider = await getCurrentRiderProfile();
  const name = rider
    ? [rider.first_name, rider.last_name].filter(Boolean).join(' ') || rider.email
    : null;

  return (
    <div style={{ fontFamily: SYSTEM_SANS, backgroundColor: CREAM, color: INK, minHeight: '100vh' }}>
      <header
        style={{
          background: HUNTER_DEEP,
          color: '#fff',
          padding: '18px 30px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `3px solid ${GOLD}`,
        }}
      >
        <div>
          <div style={{ fontFamily: GEORGIA_SERIF, fontSize: 21, fontWeight: 700 }}>
            Field <span style={{ color: GOLD }}>&amp;</span> Arena
          </div>
          <div
            style={{
              fontSize: 11,
              color: '#9FB4A7',
              letterSpacing: 1,
              marginTop: 2,
              textTransform: 'uppercase',
            }}
          >
            Rider Portal
          </div>
        </div>
        {name && (
          <div style={{ fontSize: 13, color: '#CBD8D0', textAlign: 'right' }}>
            Signed in as <b style={{ color: '#fff', display: 'block', fontSize: 14 }}>{name}</b>
          </div>
        )}
      </header>
      {children}
    </div>
  );
}
