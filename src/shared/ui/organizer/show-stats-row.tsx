import Link from 'next/link';
import { Users, ClipboardList, Tent, DollarSign, FileText } from 'lucide-react';
import { StatCard } from './stat-card';
import { IconHorse } from './icons';
import { formatMoney } from '@/shared/lib/format/currency';
import type { ShowStats } from '@/modules/shows/data/queries';

const STAT_TINTS = [
  { bg: '#EEF0FB', fg: '#5B67C7' }, // riders
  { bg: '#E9F1FB', fg: '#2F6FB0' }, // entries
  { bg: '#E9F4EE', fg: '#1A5B3C' }, // horses
  { bg: '#FCF3E4', fg: '#B07A18' }, // vendor spaces
  { bg: '#EAF3F4', fg: '#2C7175' }, // tests offered
  { bg: '#E9F4EE', fg: '#1A5B3C' }, // revenue
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
      icon: <Users className="size-[18px]" aria-hidden />,
      label: 'Total riders',
      value: stats.riders,
      note: 'this show',
    },
    {
      icon: <ClipboardList className="size-[18px]" aria-hidden />,
      label: 'Entries sold',
      value: stats.entries,
      note: 'this show',
    },
    { icon: <IconHorse size={18} />, label: 'Horses', value: stats.horses, note: 'this show' },
    {
      icon: <Tent className="size-[18px]" aria-hidden />,
      label: 'Vendor spaces',
      value: stats.vendorSpaces,
      note: 'booths sold',
    },
    {
      icon: <FileText className="size-[18px]" aria-hidden />,
      label: 'Tests offered',
      value: stats.testsOffered,
      note: 'this show',
    },
    ...(canViewMoney
      ? [
          {
            icon: <DollarSign className="size-[18px]" aria-hidden />,
            label: 'Revenue (settled)',
            value: stats.settledRevenue,
            note: stats.settledRevenue === 0 ? 'no paid orders yet' : 'collected through checkout',
            money: true,
          },
        ]
      : []),
  ];

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3">
      {statCards.map((card, i) => {
        const tint = STAT_TINTS[i % STAT_TINTS.length] ?? STAT_TINTS[0];
        const href = links[card.label];
        const value = 'money' in card && card.money ? formatMoney(card.value) : String(card.value);

        const stat = (
          <StatCard
            icon={card.icon}
            value={value}
            label={card.label}

            note={href ? `${card.note} · view list →` : card.note}
            tintBg={tint.bg}
            tintFg={tint.fg}
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
  );
}
