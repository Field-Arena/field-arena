import Link from 'next/link';
import { ROUTES } from '@/shared/constants/routes';
import { getCurrentRiderProfile, listRiderShowLinks } from '@/modules/riders/data/queries';

const HUNTER_DEEP = '#1F3A2E';
const GOLD = '#C9A227';
const CREAM = '#F7F3E9';
const INK = '#22271F';
const SYSTEM_SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
const GEORGIA_SERIF = "Georgia, 'Times New Roman', serif";

export default async function RiderLayout({ children }: { children: React.ReactNode }) {
  const rider = await getCurrentRiderProfile();
  const name = rider
    ? [rider.first_name, rider.last_name].filter(Boolean).join(' ') || rider.email
    : null;

  // Only shown when it's unambiguous which show's number applies — a rider
  // entered in more than one show doesn't get a single header-wide number.
  const shows = rider ? await listRiderShowLinks() : [];
  const riderNumber = shows.length === 1 ? (shows[0]?.riderNumber ?? null) : null;

  return (
    <div
      style={{ fontFamily: SYSTEM_SANS, backgroundColor: CREAM, color: INK, minHeight: '100vh' }}
    >
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <Link
              href={ROUTES.rider}
              prefetch={false}
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: 8,
                padding: '7px 12px',
                textDecoration: 'none',
              }}
            >
              My shows
            </Link>
            <div style={{ fontSize: 13, color: '#CBD8D0', textAlign: 'right' }}>
              Signed in as{' '}
              <b style={{ color: '#fff', display: 'block', fontSize: 14 }}>
                {name}
                {riderNumber && ` · Rider #${riderNumber}`}
              </b>
            </div>
          </div>
        )}
      </header>
      {children}
    </div>
  );
}
