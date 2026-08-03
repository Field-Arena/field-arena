import { Users, ClipboardList, Tent, DollarSign, FileText } from 'lucide-react';
import { StatCard } from './stat-card';
import { IconHorse } from './icons';
import { fa } from '@/shared/lib/organizer-theme';
import { formatMoney } from '@/shared/lib/format/currency';
import type { ShowStats } from '@/modules/shows/data/queries';

/**
 * The six-stat-card row from the Admin Console design's Dashboard — riders,
 * entries, horses, vendor spaces, tests offered, revenue — reused verbatim
 * on every Show Manager tab. The design repeats this exact row (plus the
 * lifecycle bar) above every tab's own content, not only on the Dashboard;
 * see ShowManagerShell for where the rest of that header lives.
 *
 * Extracted to shared/ rather than living in one module because both the
 * staff module's DashboardOverview and the shows module's ShowManagerShell
 * need the identical row and neither may import the other's internals.
 */
const STAT_TINTS = [
  { bg: '#EEE7FA', fg: '#6B4FA0' }, // riders
  { bg: '#E3EDFB', fg: '#2E5FA8' }, // entries
  { bg: fa.greenTint, fg: fa.green }, // horses
  { bg: fa.goldTint, fg: fa.goldFg }, // vendor spaces
  { bg: fa.greenTint, fg: fa.green }, // tests offered
  { bg: fa.greenTint, fg: fa.green }, // revenue
] as const;

export function ShowStatsRow({ stats, canViewMoney }: { stats: ShowStats; canViewMoney: boolean }) {
  const statCards = [
    { icon: <Users className="size-[18px]" aria-hidden />, label: 'Total riders', value: stats.riders, note: 'this show' },
    { icon: <ClipboardList className="size-[18px]" aria-hidden />, label: 'Entries sold', value: stats.entries, note: 'this show' },
    { icon: <IconHorse size={18} />, label: 'Horses', value: stats.horses, note: 'this show' },
    { icon: <Tent className="size-[18px]" aria-hidden />, label: 'Vendor spaces', value: stats.vendorSpaces, note: 'booths paid' },
    { icon: <FileText className="size-[18px]" aria-hidden />, label: 'Tests offered', value: stats.testsOffered, note: 'this show' },
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
        return (
          <StatCard
            key={card.label}
            icon={card.icon}
            value={'money' in card && card.money ? formatMoney(card.value) : String(card.value)}
            label={card.label}
            note={card.note}
            tintBg={tint.bg}
            tintFg={tint.fg}
          />
        );
      })}
    </div>
  );
}
