'use client';

import { ChevronDownIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/shadcn/dropdown-menu';
import { useSetPreviewShow } from '../hooks/use-session-mutations';

/* Legacy's per-show "Viewing as" menu: pick a role AND the show it applies to,
 * and land in that role's real workspace scoped to that show. Picking the show
 * is what makes the preview real rather than example data — the workspaces
 * have nothing of their own to read for a SuperAdmin.
 *
 * Announcer and Show Staff already read a selected show, so they only need the
 * same show context set before navigating. */
const ROLE_DESTINATIONS: { role: string; href: string; hint: string }[] = [
  { role: 'Judge', href: '/dashboard/judging', hint: 'Panel, assignments and scoring' },
  { role: 'Scribe', href: '/dashboard/judging', hint: 'Same workspace, recording seat' },
  { role: 'Announcer', href: '/dashboard/announcing', hint: 'Running order and ring feed' },
  { role: 'Show Staff', href: '/dashboard/operations', hint: 'Live board and ride-day ops' },
];

export function ExperienceShowMenu({ showId, showName }: { showId: string; showName: string }) {
  const { isPending: pending, preview } = useSetPreviewShow();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={pending}
        aria-label={`Experience ${showName} as a role`}
        className="inline-flex items-center gap-1.5 rounded-lg border border-[#D0D5DD] bg-white px-3 py-2 text-[12.5px] font-bold whitespace-nowrap text-[#101828] transition-colors hover:border-[#D6DBE1] hover:bg-[#FBFCFD] disabled:opacity-50"
      >
        {pending ? 'Opening…' : 'Experience'}
        <ChevronDownIcon className="size-[13px]" aria-hidden />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64 rounded-xl border-[#E7EAEE] p-1.5">
        <DropdownMenuLabel className="text-[10px] font-bold tracking-[.08em] text-[#8A94A3] uppercase">
          {showName}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-[#EEF1F4]" />

        {ROLE_DESTINATIONS.map((target) => (
          <DropdownMenuItem
            key={target.role}
            onSelect={() => {
              preview(showId, target.href);
            }}
            className="flex-col items-start gap-0.5"
          >
            <span className="text-[13px] font-semibold text-[#101828]">{target.role}</span>
            <span className="text-[11.5px] text-[#8A94A3]">{target.hint}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
