'use client';

import { useMemo, useState } from 'react';
import { ChevronDownIcon, SearchIcon } from 'lucide-react';
import { Button } from '@/shared/ui/shadcn/button';
import { Input } from '@/shared/ui/shadcn/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/shadcn/dropdown-menu';
import { cn } from '@/shared/lib/utils';
import type { DirectoryOrganizer } from '@/modules/superadmin/types';
import { AddOrgStaffDialog } from '@/modules/superadmin/ui/add-org-staff-dialog';
import { StaffRow, STAFF_COLS } from '@/modules/superadmin/ui/directory-org-staff-row';

type SortKey = 'name' | 'role' | 'shows';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'name', label: 'Name' },
  { key: 'role', label: 'Role' },
  { key: 'shows', label: 'Shows' },
];

/**
 * Column templates as inline styles, shared with DirectoryPanel's header so they
 * line up exactly. Inline rather than a Tailwind arbitrary class because the
 * class is defined in this file but also consumed from another, and Tailwind's
 * cross-file scan did not reliably emit it for the header there.
 */
export const ORG_COLS = 'minmax(240px,1fr) 90px 110px 132px';
const NR = 'font-[family-name:var(--font-nr)]';

/**
 * One organizer row in the directory, matching the Admin Console design: a grid
 * row (Organizer · Shows · Staff · View) that expands in place to a per-show
 * staff table with add / search / sort / re-role / permissions / remove.
 */
export function DirectoryOrg({ org }: { org: DirectoryOrganizer }) {
  const [expanded, setExpanded] = useState(false);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('name');

  const location = [org.city, org.region].filter(Boolean).join(', ');

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = term
      ? org.staff.filter(
          (s) =>
            s.name.toLowerCase().includes(term) || (s.email ?? '').toLowerCase().includes(term)
        )
      : org.staff;
    return [...filtered].sort((a, b) => {
      if (sortBy === 'role') return a.role.localeCompare(b.role) || a.name.localeCompare(b.name);
      if (sortBy === 'shows') return a.showName.localeCompare(b.showName) || a.name.localeCompare(b.name);
      return a.name.localeCompare(b.name);
    });
  }, [org.staff, search, sortBy]);

  return (
    <div className="border-b border-[#EEF2EF] last:border-b-0">
      <div
        className="grid min-w-[620px] items-center gap-3.5 px-5 py-[15px]"
        style={{ gridTemplateColumns: ORG_COLS }}
      >
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-[14px] font-bold text-hunter-deep">{org.name}</span>
          {location && <span className="text-[12px] text-fa-muted-2">{location}</span>}
        </div>
        <span className={cn(NR, 'text-right text-[20px] text-hunter-deep')}>{org.showCount}</span>
        <span className="text-right text-[12.5px] text-fa-muted-2">
          {org.staff.length} staff
        </span>
        <div className="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setExpanded((v) => !v);
            }}
            className="h-auto rounded-lg border border-[#D7E0DA] bg-white px-3 py-2 text-[12.5px] font-bold text-hunter-deep hover:bg-transparent hover:border-gold"
          >
            {expanded ? 'Hide staff' : 'View staff'}
            <ChevronDownIcon
              className={cn('size-[13px] transition-transform', expanded && 'rotate-180')}
              aria-hidden
            />
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="[animation:fa-in_.16s_ease-out_both] px-5 pb-[22px] pt-1">
          <div className="mb-4 flex flex-wrap items-center gap-3.5">
            <AddOrgStaffDialog orgName={org.name} shows={org.shows} />
            <span className="max-w-[460px] text-[12.5px] leading-[1.5] text-fa-muted-2">
              Same invite flow {org.name} uses for their own team — email, role, and a show to
              assign them to.
            </span>
            <div className="relative ml-auto min-w-[170px] max-w-[260px] flex-[1_1_200px]">
              <SearchIcon
                className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#9AA6A0]"
                aria-hidden
              />
              <Input
                type="search"
                autoComplete="off"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                }}
                placeholder="Search name or email…"
                className="h-auto w-full rounded-lg border border-[#D7E0DA] bg-white py-[9px] pl-[34px] pr-3 text-[13px] text-hunter-deep focus-visible:border-gold focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-gold/[.14]"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex flex-none items-center gap-1.5 rounded-lg border border-[#D7E0DA] bg-white px-3 py-[9px] text-[12.5px] font-semibold text-hunter-deep transition-colors hover:border-gold data-[state=open]:border-gold">
                Sort: {SORT_OPTIONS.find((o) => o.key === sortBy)?.label}
                <ChevronDownIcon className="size-[13px] text-fa-muted-2" aria-hidden />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[140px] rounded-xl border-line-mint p-1.5">
                {SORT_OPTIONS.map((option) => (
                  <DropdownMenuItem
                    key={option.key}
                    onSelect={() => {
                      setSortBy(option.key);
                    }}
                    className={cn('text-[13px]', sortBy === option.key && 'font-bold text-gold')}
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="rounded-xl border border-[#E2E8E4] bg-white">
            <div className="overflow-x-auto">
              <div
                className="grid min-w-[740px] gap-3 border-b border-[#E2E8E4] bg-[#F6F3EC] px-4 py-2.5"
                style={{ gridTemplateColumns: STAFF_COLS }}
              >
                {['Person', 'Role', 'Shows', 'Status', 'Permissions', 'Action'].map((h, i) => (
                  <span
                    key={h}
                    className={cn(
                      'text-[9.5px] font-bold uppercase tracking-[0.14em] text-fa-muted-2',
                      i === 5 && 'text-right'
                    )}
                  >
                    {h}
                  </span>
                ))}
              </div>

              {visible.length === 0 ? (
                <div className="px-[18px] pb-[38px] pt-[34px] text-center">
                  <div className={cn(NR, 'mb-1.5 text-[20px] text-hunter-deep')}>
                    {search.trim() ? 'No matches' : 'No staff yet'}
                  </div>
                  <p className="text-[13px] text-fa-muted-2">
                    {search.trim()
                      ? `No one matches “${search.trim()}”.`
                      : 'Add a user to invite their first team member.'}
                  </p>
                </div>
              ) : (
                visible.map((staff) => <StaffRow key={staff.id} staff={staff} />)
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
