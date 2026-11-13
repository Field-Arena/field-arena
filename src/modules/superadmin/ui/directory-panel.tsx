import { cn } from '@/shared/lib/utils';
import type { DirectoryOrganizer } from '@/modules/superadmin/types';
import { DirectoryOrg, ORG_COLS } from '@/modules/superadmin/ui/directory-org';

export function DirectoryPanel({
  organizers,
  expandedOrgId = null,
}: {
  organizers: DirectoryOrganizer[];
  expandedOrgId?: string | null;
}) {
  if (organizers.length === 0) {
    return (
      <p className="rounded-[14px] border border-dashed border-[#E7EAEE] bg-white px-5 py-8 text-center text-sm text-[#8A94A3]">
        No organizers yet.
      </p>
    );
  }

  return (
    <div className="rounded-[14px] border border-[#E7EAEE] bg-white">
      <div className="overflow-x-auto">
        <div
          className="grid min-w-[620px] gap-3.5 border-b border-[#E7EAEE] bg-[#FBFCFD] px-5 py-[11px]"
          style={{ gridTemplateColumns: ORG_COLS }}
        >
          {(['Organizer', 'Shows', 'Staff', 'Action'] as const).map((label, i) => (
            <span
              key={label}
              className={cn(
                'text-[10px] font-bold tracking-[.08em] text-[#8A94A3] uppercase',
                i > 0 && 'text-right',
              )}
            >
              {label}
            </span>
          ))}
        </div>

        {organizers.map((org) => (
          <DirectoryOrg key={org.id} org={org} defaultExpanded={org.id === expandedOrgId} />
        ))}
      </div>

      <div className="px-5 py-3.5 text-[12.5px] text-[#8A94A3]">
        Each organizer manages their own team. Open one to see who can sign in and in what role.
      </div>
    </div>
  );
}
