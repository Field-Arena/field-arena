import type { ReactNode } from 'react';
import { EmptyState, PageHeader } from '@/shared/ui/organizer/fa-page';

export const OPS_WRAP = 'text-ink-deep font-[family-name:var(--font-ar)]';
export const OPS_CLOCK_CLASS =
  'inline-flex items-center rounded-[9px] border-2 border-[#1A5B3C] bg-white px-3.5 py-2 font-mono text-[15px] whitespace-nowrap text-[#1A5B3C]';

export function OpsNoShows({ eyebrow, title }: { eyebrow: ReactNode; title: string }) {
  return (
    <div className={OPS_WRAP}>
      <PageHeader eyebrow={eyebrow} title={title} />
      <EmptyState
        title="No shows assigned"
        note="You are not staffed on any show yet. An organizer adds show staff from ShowManager."
      />
    </div>
  );
}
