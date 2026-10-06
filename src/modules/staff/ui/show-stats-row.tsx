import Link from 'next/link';
import { StatCard } from '@/shared/ui/organizer/stat-card';
import { formatMoney } from '@/shared/lib/format/currency';
import type { ShowStats } from '@/modules/shows/types';

/* Stat icons from the redesign's dashboard (field-arena-prototype/organizer.html). */
const Ico = ({ d, filled = false }: { d: string; filled?: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    width={18}
    height={18}
    aria-hidden
    fill={filled ? 'currentColor' : 'none'}
    stroke={filled ? 'none' : 'currentColor'}
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={d} />
  </svg>
);
const ICONS = {
  riders: <Ico d="M17 20v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2M10 10a3 3 0 100-6 3 3 0 000 6z" />,
  entries: <Ico d="M9 5h10M9 12h10M9 19h10M5 5h.01M5 12h.01M5 19h.01" />,
  horses: (
    <Ico
      filled
      d="M6 22h12v-1.5H6V22zm1.5-2.5h9c.4-3.3-.6-6-2.7-7.9.6-.6 1-1.5.9-2.4 0-.3.3-.6.6-.4.7.3 1.5-.3 1.4-1.1-.1-2.2-1.5-4-3.5-4.8l.3-1.3c.1-.5-.4-.9-.9-.6-.8.4-1.5 1.1-1.9 1.9C8 4 6.4 5.8 6.4 8c0 .3 0 .5.1.8L5.1 10c-.5.4-.4 1.1.2 1.3l1.3.5c-.9 1.7-1.2 3.5-.9 5.3.1.5.3 1 .6 1.4z"
    />
  ),
  vendors: <Ico d="M3 7h18l-1.5 12H4.5L3 7zM8 7V5a4 4 0 018 0v2" />,
  tests: <Ico d="M4 5h10v14H4zM14 8h6v11h-6" />,
  revenue: <Ico d="M12 3v18M17 7a4 4 0 00-4-2h-2a3 3 0 000 6h2a3 3 0 010 6h-2a4 4 0 01-4-2" />,
};

const STAT_TINTS = [
  { bg: '#EEEEFB', fg: '#5B5BD6' }, // riders — violet
  { bg: '#E8F2FB', fg: '#0B6BB8' }, // entries — sky
  { bg: '#EAF5EF', fg: '#146A47' }, // horses — brand
  { bg: '#FDF2E3', fg: '#B45309' }, // vendor spaces — amber
  { bg: '#E7F6EE', fg: '#15794F' }, // tests offered — emerald
  { bg: '#E7F6EE', fg: '#15794F' }, // revenue — emerald
] as const;

export function ShowStatsRow({
  stats,
  canViewMoney,
  showId,
}: {
  stats: ShowStats;
  canViewMoney: boolean;

  showId?: string;
}) {
  const links: Record<string, string | undefined> = showId
    ? {
        'Total riders': `/dashboard/riders?show=${showId}`,
        'Entries sold': `/dashboard/entries?show=${showId}`,
        Horses: '/dashboard/horses',
        'Vendor spaces': '/dashboard/vendor',
        'Tests offered': `/dashboard/shows/${showId}/test-builder`,
      }
    : {};

  const statCards = [
    {
      icon: ICONS.riders,
      label: 'Total riders',
      value: stats.riders,
      note: 'this show',
    },
    {
      icon: ICONS.entries,
      label: 'Entries sold',
      value: stats.entries,
      note: 'this show',
    },
    { icon: ICONS.horses, label: 'Horses', value: stats.horses, note: 'this show' },
    {
      icon: ICONS.vendors,
      label: 'Vendor spaces',
      value: stats.vendorSpaces,
      note: 'booths sold',
    },
    {
      icon: ICONS.tests,
      label: 'Tests offered',
      value: stats.testsOffered,
      note: 'this show',
    },
    ...(canViewMoney
      ? [
          {
            icon: ICONS.revenue,
            label: 'Revenue (settled)',
            value: stats.settledRevenue,
            note: stats.settledRevenue === 0 ? 'no paid orders yet' : 'collected through checkout',
            money: true,
          },
        ]
      : []),
  ];

  return (
    <div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(158px,1fr))] gap-3.5">
        {statCards.map((card, i) => {
          const tint = STAT_TINTS[i % STAT_TINTS.length] ?? STAT_TINTS[0];
          const href = links[card.label];
          const value =
            'money' in card && card.money ? formatMoney(card.value) : String(card.value);

          const stat = (
            <StatCard
              icon={card.icon}
              value={value}
              label={card.label}
              note={href ? `${card.note} · view list →` : card.note}
              tintBg={tint.bg}
              tintFg={tint.fg}
              clickable={Boolean(href)}
            />
          );

          return href ? (
            <Link key={card.label} href={href} className="contents">
              {stat}
            </Link>
          ) : (
            <div key={card.label} className="contents">
              {stat}
            </div>
          );
        })}
      </div>
    </div>
  );
}
