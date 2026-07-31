import Link from 'next/link';
import { cn } from '@/shared/lib/utils';

/**
 * The "All / Onboard / Pending" pill row above the organizers table.
 *
 * Plain links carrying a `status` search param, not a client toggle — the
 * table it filters is a Server Component reading `searchParams`, and a click
 * here is a discrete choice rather than something that needs debouncing the
 * way free-text search does (see OrganizerSearch). Keeping it server-rendered
 * means the table never needs a client boundary.
 */
export interface OrganizerStatusCounts {
  all: number;
  onboard: number;
  pending: number;
}

export function OrganizerStatusFilter({
  active,
  counts,
  q,
}: {
  active: 'all' | 'onboard' | 'pending';
  counts: OrganizerStatusCounts;
  q?: string;
}) {
  const tabs = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'onboard', label: 'Onboard', count: counts.onboard },
    { key: 'pending', label: 'Pending', count: counts.pending },
  ] as const;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {tabs.map((tab) => {
        const params = new URLSearchParams();
        if (q) params.set('q', q);
        if (tab.key !== 'all') params.set('status', tab.key);
        const query = params.toString();

        return (
          <Link
            key={tab.key}
            href={query ? `/dashboard/superadmin?${query}` : '/dashboard/superadmin'}
            scroll={false}
            className={cn(
              'inline-flex h-8 items-center rounded-full px-3.5 text-[12.5px] font-semibold transition-colors',
              active === tab.key
                ? 'bg-forest text-paper'
                : 'border border-line bg-white text-forest hover:border-gold'
            )}
          >
            {tab.label} {tab.count}
          </Link>
        );
      })}
    </div>
  );
}
