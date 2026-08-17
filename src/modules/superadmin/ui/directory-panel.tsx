import { cn } from '@/shared/lib/utils';
import type { DirectoryOrganizer } from '../types';
import { DirectoryOrg, ORG_COLS } from './directory-org';

/**
 * The "Organizer staff directory" tab, matching the Admin Console design: one
 * card holding a header row (Organizer · Shows · Staff · Action), a row per
 * organizer that expands in place to its staff table, and a footer note.
 */
export function DirectoryPanel({ organizers }: { organizers: DirectoryOrganizer[] }) {
  if (organizers.length === 0) {
    return (
      <p className="rounded-[14px] border border-dashed border-[#E2E8E4] bg-white px-5 py-8 text-center text-sm text-fa-muted-2">
        No organizers yet.
      </p>
    );
  }

  return (
    <div className="rounded-[14px] border border-[#E2E8E4] bg-white">
      <div className="overflow-x-auto">
        <div
          className="grid min-w-[620px] gap-3.5 border-b border-[#E2E8E4] bg-[#F6F3EC] px-5 py-[11px]"
          style={{ gridTemplateColumns: ORG_COLS }}
        >
          {(['Organizer', 'Shows', 'Staff', 'Action'] as const).map((label, i) => (
            <span
              key={label}
              className={cn(
                'text-[10px] font-bold uppercase tracking-[0.14em] text-fa-muted-2',
                i > 0 && 'text-right'
              )}
            >
              {label}
            </span>
          ))}
        </div>

        {organizers.map((org) => (
          <DirectoryOrg key={org.id} org={org} />
        ))}
      </div>

      <div className="px-5 py-3.5 text-[12.5px] text-[#9AA6A0]">
        Each organizer manages their own team. Open one to see who can sign in and in what role.
      </div>
    </div>
  );
}
