import { cn } from '@/shared/lib/utils';

/**
 * Route-level loading skeletons for the SuperAdmin console.
 *
 * These render as Next.js `loading.tsx` fallbacks while a page's Server
 * Components stream, so a navigation shows the page's shape immediately instead
 * of a blank panel. The tone (#E7ECE9) is a touch darker than the console's
 * cream so the blocks read on white cards; the top progress bar carries the rest.
 */
function Bar({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-[#E7ECE9]', className)} />;
}

function PageHeader() {
  return (
    <div className="space-y-2.5">
      <Bar className="h-3 w-20" />
      <Bar className="h-8 w-52" />
      <Bar className="h-4 w-[420px] max-w-full" />
    </div>
  );
}

function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-[14px] border border-[#E2E8E4] bg-white">
      <div className="flex gap-4 border-b border-[#E2E8E4] bg-[#F6F3EC] px-5 py-3">
        {['w-24', 'w-16', 'w-12', 'w-16', 'w-10'].map((w, i) => (
          <Bar key={i} className={cn('h-2.5', w)} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-[#EEF2EF] px-5 py-4 last:border-b-0">
          <div className="flex-1 space-y-2">
            <Bar className="h-3.5 w-48" />
            <Bar className="h-3 w-32" />
          </div>
          <Bar className="h-3.5 w-24" />
          <Bar className="h-5 w-20 rounded-full" />
          <Bar className="h-8 w-20 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

/** Header + a row of stat tiles + a table — the shape most console pages share. */
export function ConsolePageSkeleton({ tiles = 5 }: { tiles?: number }) {
  return (
    <div className="space-y-7">
      <PageHeader />
      <div className="flex flex-wrap gap-3">
        {Array.from({ length: tiles }).map((_, i) => (
          <div
            key={i}
            className="flex min-w-[138px] flex-[1_1_150px] flex-col gap-2.5 rounded-[11px] border border-[#E7E0D0] bg-[#F6F3EC] px-[18px] pb-[15px] pt-4"
          >
            <Bar className="h-7 w-12 bg-[#E7E0D0]" />
            <Bar className="h-2.5 w-20 bg-[#E7E0D0]" />
          </div>
        ))}
      </div>
      <TableSkeleton />
    </div>
  );
}

/** The lead detail page: a title, a status pill, and four stacked form cards. */
export function LeadDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-8">
        <div className="space-y-3">
          <Bar className="h-8 w-64" />
          <Bar className="h-5 w-24 rounded-full" />
        </div>
        <Bar className="h-9 w-32 rounded-[9px]" />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-[14px] border border-[#E2E8E4] bg-white px-7 pb-7 pt-[26px]">
          <Bar className="mb-5 h-5 w-40" />
          <div className="grid gap-[18px] [grid-template-columns:repeat(auto-fit,minmax(258px,1fr))]">
            {Array.from({ length: 4 }).map((__, j) => (
              <div key={j} className="space-y-2">
                <Bar className="h-2.5 w-24" />
                <Bar className="h-11 w-full rounded-[9px]" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
