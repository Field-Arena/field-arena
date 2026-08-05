'use client';

import { useMemo, useState } from 'react';
import { ScreenTitle, ScreenLede, Eyebrow, Card } from '@/shared/ui/organizer/card';
import { SearchInput } from '@/shared/ui/organizer/search-input';
import { StatusPill } from '@/shared/ui/organizer/status-pill';
import { cn } from '@/shared/lib/utils';
import { formatDateShort } from '@/shared/lib/format/date';
import { USER_STATUS_META } from '../constants';
import { roleRank } from '../utils';
import { AddUserDialog, type ClassOption } from './add-user-dialog';
import { UploadStaffListDialog } from './upload-staff-list-dialog';
import { ExportStaffListButton } from './export-staff-list-button';
import { PermissionsListDialog } from './permissions-list-dialog';
import { StaffEditDialog } from './staff-edit-dialog';
import type { UserDirectoryRow, UserDirectoryStatus } from '../types';
import type { ShowListItem } from '@/modules/shows/data/queries';

const FILTER_SELECT_CLASS =
  'min-w-[160px] flex-1 rounded-[10px] border border-[#D9E1DD] bg-white px-3 py-2.5 text-[13.5px] text-ink-deep outline-none focus-visible:border-gold';

const STATUS_ORDER: UserDirectoryStatus[] = ['onboard', 'pending', 'not_invited'];

/**
 * The organizer "All Users" directory — org-wide, across every show, ported
 * from showstaff.html's `renderUserDirectory()`/`updateUserDirTable()`.
 * All filtering/sorting happens client-side against the full row set the
 * Server Component page already composed (`listAllUsersAcrossShows`), since
 * it's a bounded, already-fetched list — the same "search-as-you-type without
 * a round trip" behaviour the legacy view had.
 *
 * Two independent show selections live on this screen, matching the design:
 * the "SHOW" section's dropdown is the *target* for Add User / Upload /
 * Export / Permissions (you're always adding/exporting for one show), while
 * the "All Users" filter row's "All shows" dropdown *filters* the directory
 * (defaults to showing every show at once).
 */
export function UsersDirectory({
  rows,
  shows,
  initialShowId,
  classesByShow,
}: {
  rows: UserDirectoryRow[];
  shows: ShowListItem[];
  initialShowId: string;
  /** This show's classes, for Add User's Judge-classes checklist. */
  classesByShow: Record<string, ClassOption[]>;
}) {
  const [targetShowId, setTargetShowId] = useState(initialShowId);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showFilter, setShowFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [cogginsOnly, setCogginsOnly] = useState(false);
  const [editingRow, setEditingRow] = useState<UserDirectoryRow | null>(null);

  const targetShow = shows.find((s) => s.id === targetShowId) ?? shows[0] ?? null;
  const targetShowStaff = useMemo(
    () => rows.filter((r) => r.kind === 'staff' && r.showId === targetShowId),
    [rows, targetShowId],
  );

  const roleTypes = useMemo(
    () => [...new Set(rows.map((r) => r.role))].sort((a, b) => a.localeCompare(b)),
    [rows],
  );
  const showCoggins = roleFilter === 'Rider';

  const noncompliantCount = useMemo(
    () => rows.filter((r) => r.kind === 'rider' && r.coggins?.compliant === false).length,
    [rows],
  );

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows
      .filter((u) => {
        if (roleFilter && u.role !== roleFilter) return false;
        if (showFilter && u.showId !== showFilter) return false;
        if (statusFilter && u.status !== statusFilter) return false;
        if (cogginsOnly && (u.role !== 'Rider' || u.coggins?.compliant !== false)) return false;
        if (q && !u.name.toLowerCase().includes(q) && !(u.email ?? '').toLowerCase().includes(q))
          return false;
        return true;
      })
      .sort((a, b) => roleRank(a.role) - roleRank(b.role) || a.name.localeCompare(b.name));
  }, [rows, roleFilter, showFilter, statusFilter, cogginsOnly, search]);

  const columns = showCoggins
    ? 'minmax(160px,1.4fr) 120px 160px minmax(160px,1.2fr) 130px 110px 150px'
    : 'minmax(160px,1.4fr) 120px 160px minmax(160px,1.2fr) 130px 110px';

  return (
    <div className="text-ink-deep font-[family-name:var(--font-ar)]">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <Eyebrow className="mb-1.5 block">Access</Eyebrow>
          <ScreenTitle className="mb-1.5">Users</ScreenTitle>
          <ScreenLede className="mb-0">
            Invite and manage everyone with access — judges, scribes, staff, and more.
          </ScreenLede>
        </div>
        <span className="inline-flex flex-none items-center gap-1.5 rounded-full border border-[#E9EDEB] bg-white px-3 py-1.5 text-[12.5px] font-semibold text-[#0D2C23]">
          <span className="size-1.5 rounded-full bg-[#3E8E5A]" aria-hidden />
          {rows.length} of {rows.length}
        </span>
      </div>

      <Card className="mb-5 flex flex-wrap items-center gap-3 p-[16px_18px]">
        <select
          value={targetShowId}
          onChange={(e) => {
            setTargetShowId(e.target.value);
          }}
          className="text-ink-deep min-w-[280px] flex-[0_1_360px] rounded-[10px] border border-[#D9E1DD] px-3 py-2.5 text-sm"
          aria-label="Show to add or export staff for"
        >
          {shows.map((show) => (
            <option key={show.id} value={show.id}>
              {show.name}
              {show.dateLabel ? ` (${show.dateLabel})` : ''}
            </option>
          ))}
        </select>

        <AddUserDialog
          shows={shows}
          defaultShowId={targetShowId}
          classes={classesByShow[targetShowId] ?? []}
        />
        {targetShow && <UploadStaffListDialog showId={targetShow.id} showName={targetShow.name} />}
        {targetShow && <ExportStaffListButton rows={targetShowStaff} showName={targetShow.name} />}
        {targetShow && (
          <PermissionsListDialog
            staff={targetShowStaff}
            showName={targetShow.name}
            onEditStaff={setEditingRow}
          />
        )}
      </Card>

      <Card className="p-[18px_20px_20px]">
        <div className="mb-1 flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-forest font-[Newsreader,serif] text-[20px] font-semibold">
            All Users
          </h2>
          <span className="text-[13px] font-semibold text-[#5A6B63]">
            {filteredRows.length} of {rows.length}
          </span>
        </div>
        <p className="mb-4 text-[13px] text-[#5A6B63]">
          Everyone with access across every one of your shows — search or filter to find someone.
        </p>

        {noncompliantCount > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-[10px] border border-[#E4B5AC] bg-[#FDEEEB] px-4 py-3 text-[13px] text-[#98341F]">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#B4432F] px-2.5 py-1 text-[11.5px] font-bold text-white">
              ⚠ {noncompliantCount}
            </span>
            <span>riders outside Coggins compliance — missing, expired, or not yet verified.</span>
            <button
              type="button"
              onClick={() => {
                setRoleFilter('Rider');
                setCogginsOnly(true);
              }}
              className="ml-auto font-bold hover:underline"
            >
              Show only these →
            </button>
          </div>
        )}

        <div className="mb-3 flex flex-wrap gap-2.5">
          <SearchInput
            placeholder="Search name or email…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
            }}
          />
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              if (e.target.value !== 'Rider') setCogginsOnly(false);
            }}
            className={FILTER_SELECT_CLASS}
            aria-label="Filter by user type"
          >
            <option value="">All user types</option>
            {roleTypes.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
          <select
            value={showFilter}
            onChange={(e) => {
              setShowFilter(e.target.value);
            }}
            className={FILTER_SELECT_CLASS}
            aria-label="Filter by show"
          >
            <option value="">All shows</option>
            {shows.map((show) => (
              <option key={show.id} value={show.id}>
                {show.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4 flex flex-wrap gap-2.5">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
            }}
            className={cn(FILTER_SELECT_CLASS, 'max-w-[220px]')}
            aria-label="Filter by status"
          >
            <option value="">Any status</option>
            {STATUS_ORDER.map((status) => (
              <option key={status} value={status}>
                {USER_STATUS_META[status].label}
              </option>
            ))}
          </select>

          {showCoggins && (
            <select
              value={cogginsOnly ? 'noncompliant' : ''}
              onChange={(e) => {
                setCogginsOnly(e.target.value === 'noncompliant');
              }}
              className={cn(FILTER_SELECT_CLASS, 'max-w-[260px]')}
              aria-label="Filter by Coggins compliance"
            >
              <option value="">Any Coggins status</option>
              <option value="noncompliant">⚠ Non-compliant only</option>
            </select>
          )}
        </div>

        <div className="overflow-x-auto rounded-[12px] border border-[#EDF0EE]">
          <div className="min-w-[900px]">
            <div
              className="grid gap-3.5 border-b border-[#EEF2F0] bg-[#F8FAF9] px-4 py-2.5"
              style={{ gridTemplateColumns: columns }}
            >
              {[
                'Name',
                'User Type',
                'Show',
                'Email',
                'Phone',
                'Status',
                ...(showCoggins ? ['Coggins'] : []),
              ].map((label) => (
                <span
                  key={label}
                  className="text-[9.5px] font-bold tracking-[.14em] text-[#7A8781] uppercase"
                >
                  {label}
                </span>
              ))}
            </div>

            {filteredRows.length === 0 ? (
              <div className="px-5 py-10 text-center text-[13.5px] text-[#7A8781]">
                No users match those filters.
              </div>
            ) : (
              filteredRows.map((row) => {
                const clickable = row.kind === 'staff';
                const meta = USER_STATUS_META[row.status];
                return (
                  <div
                    key={row.key}
                    role={clickable ? 'button' : undefined}
                    tabIndex={clickable ? 0 : undefined}
                    onClick={
                      clickable
                        ? () => {
                            setEditingRow(row);
                          }
                        : undefined
                    }
                    onKeyDown={
                      clickable
                        ? (e) => {
                            if (e.key === 'Enter' || e.key === ' ') setEditingRow(row);
                          }
                        : undefined
                    }
                    className={cn(
                      'grid items-center gap-3.5 border-b border-[#F1F4F3] px-4 py-3 text-[13px] last:border-b-0',
                      clickable && 'cursor-pointer transition-colors hover:bg-[#F8FAF9]',
                    )}
                    style={{ gridTemplateColumns: columns }}
                  >
                    <span className="text-ink-deep min-w-0 truncate font-semibold">{row.name}</span>
                    <span className="min-w-0 truncate text-[#48574F]">{row.role}</span>
                    <span className="min-w-0 truncate text-[#48574F]">{row.showName}</span>
                    <span className="min-w-0 truncate text-[#48574F]">{row.email ?? '—'}</span>
                    <span className="min-w-0 truncate text-[#48574F]">{row.phone ?? '—'}</span>
                    <span>
                      <StatusPill bg={meta.bg} border="transparent" fg={meta.fg}>
                        {meta.label}
                      </StatusPill>
                    </span>
                    {showCoggins && (
                      <span>
                        <CogginsCell row={row} />
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </Card>

      <StaffEditDialog
        row={editingRow}
        shows={shows}
        onClose={() => {
          setEditingRow(null);
        }}
      />
    </div>
  );
}

function CogginsCell({ row }: { row: UserDirectoryRow }) {
  if (row.role !== 'Rider') return <span className="text-[#98A29D]">—</span>;

  const coggins = row.coggins;
  if (!coggins?.applicable) return <span className="text-[#98A29D]">—</span>;

  if (coggins.reason === 'missing') {
    return <span className="text-[12.5px] font-bold text-[#B4432F]">✕ Not uploaded</span>;
  }
  if (coggins.reason === 'expired') {
    return (
      <span className="text-[12.5px] font-bold text-[#B4432F]">
        Expired {coggins.expirationDate ? formatDateShort(coggins.expirationDate) : ''}
      </span>
    );
  }
  if (coggins.reason === 'unverified') {
    return <span className="text-[12.5px] font-semibold text-[#8A6D0B]">Not yet verified</span>;
  }
  return (
    <span className="text-[12.5px] font-semibold text-[#1A5B3C]">
      ✓ {coggins.expirationDate ? formatDateShort(coggins.expirationDate) : 'Compliant'}
    </span>
  );
}
