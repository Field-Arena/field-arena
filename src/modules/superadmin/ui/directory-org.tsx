'use client';

import { useMemo, useState } from 'react';
import { ChevronDownIcon, Loader2Icon, SearchIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/shadcn/dialog';
import { Button } from '@/shared/ui/shadcn/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/shadcn/dropdown-menu';
import { cn } from '@/shared/lib/utils';
import { GRANTABLE_ROLES } from '@/shared/constants/roles';
import type { DirectoryOrganizer, DirectoryStaff } from '../data/queries';
import {
  useChangeStaffRole,
  useRemoveStaffAssignment,
} from '../hooks/use-org-staff-mutations';
import { AddOrgStaffDialog } from './add-org-staff-dialog';
import { StaffPermissionsDialog } from './staff-permissions-dialog';

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
const STAFF_COLS = 'minmax(180px,1.3fr) 128px minmax(96px,0.7fr) 96px 118px 84px';
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
          <button
            type="button"
            onClick={() => {
              setExpanded((v) => !v);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#D7E0DA] bg-white px-3 py-2 text-[12.5px] font-bold text-hunter-deep transition-colors hover:border-gold"
          >
            {expanded ? 'Hide staff' : 'View staff'}
            <ChevronDownIcon
              className={cn('size-[13px] transition-transform', expanded && 'rotate-180')}
              aria-hidden
            />
          </button>
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
              <input
                type="search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                }}
                placeholder="Search name or email…"
                className="w-full rounded-lg border border-[#D7E0DA] bg-white py-[9px] pl-[34px] pr-3 text-[13px] text-hunter-deep focus-visible:border-gold focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-gold/[.14]"
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

function StatusPill({ status }: { status: string | null }) {
  const pending = status === 'pending';
  return (
    <span
      className={cn(
        'inline-flex h-[19px] items-center gap-1.5 justify-self-start rounded-full px-2 text-[10px] font-bold',
        pending ? 'bg-status-warn-bg text-status-warn' : 'bg-status-success-bg text-status-success'
      )}
    >
      <span className="size-[5px] rounded-full bg-current" aria-hidden />
      {pending ? 'Pending' : 'Active'}
    </span>
  );
}

function StaffRow({ staff }: { staff: DirectoryStaff }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const changeRole = useChangeStaffRole();
  const remove = useRemoveStaffAssignment({
    onSuccess: () => {
      setConfirmOpen(false);
    },
  });

  const isVendor = staff.role === 'Vendor';

  return (
    <div
      className="grid min-w-[740px] items-center gap-3 border-b border-[#F2F5F3] px-4 py-2.5 last:border-b-0 hover:bg-[#FAFCFB]"
      style={{ gridTemplateColumns: STAFF_COLS }}
    >
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-[13px] font-semibold text-hunter-deep">{staff.name}</span>
        <span className="truncate text-[11.5px] text-fa-muted-2">{staff.email ?? '—'}</span>
      </span>

      {isVendor ? (
        <span className="inline-flex h-[34px] items-center justify-center rounded-lg bg-hunter-pale px-2 text-[11px] font-bold text-hunter-deep">
          Vendor
        </span>
      ) : (
        <select
          value={staff.role}
          disabled={changeRole.isPending}
          onChange={(event) => {
            changeRole.mutate({
              staffId: staff.id,
              role: event.target.value as (typeof GRANTABLE_ROLES)[number],
            });
          }}
          className="rounded-[7px] border border-[#D7E0DA] bg-white px-2 py-[7px] text-[12.5px] text-hunter-deep focus-visible:border-gold focus-visible:outline-none disabled:opacity-50"
          aria-label={`Role for ${staff.name}`}
        >
          {GRANTABLE_ROLES.filter((r) => r !== 'Vendor').map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
      )}

      <span className="text-[12px] leading-[1.4] text-fa-muted" title={staff.showName}>
        {staff.showName}
      </span>

      <StatusPill status={staff.status} />

      {isVendor ? (
        <span className="text-center text-[11px] text-fa-muted-2">—</span>
      ) : (
        <StaffPermissionsDialog staff={staff} />
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => {
            setConfirmOpen(true);
          }}
          className="rounded-[7px] border border-[#E4CFC9] px-2.5 py-1.5 text-[11.5px] font-bold text-[#B4432F] transition-colors hover:border-[#B4432F] hover:bg-[#FCF1EF]"
        >
          Remove
        </button>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle className={cn(NR, 'text-[26px] font-medium text-hunter-deep')}>
              Remove {staff.name}?
            </DialogTitle>
            <DialogDescription>
              They&apos;ll be removed from {staff.showName}&apos;s staff. This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setConfirmOpen(false);
              }}
            >
              Keep
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={remove.isPending}
              onClick={() => {
                remove.mutate(staff.id);
              }}
            >
              {remove.isPending && <Loader2Icon className="animate-spin" aria-hidden />}
              {remove.isPending ? 'Removing…' : 'Remove'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
