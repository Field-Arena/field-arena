'use client';

import { useMemo, useState } from 'react';
import { USER_STATUS_META } from '../constants';
import { roleRank } from '../utils';
import { AddUserDialog, type ClassOption } from './add-user-dialog';
import { UploadStaffListDialog } from './upload-staff-list-dialog';
import { ExportStaffListButton } from './export-staff-list-button';
import { PermissionsListDialog } from './permissions-list-dialog';
import { StaffEditDialog } from './staff-edit-dialog';
import { RingCoverageCard } from './ring-coverage-card';
import { RiderDetailDialog } from './rider-detail-dialog';
import { VendorDetailDialog } from './vendor-detail-dialog';
import { VendorApprovalActions } from '@/modules/vendors/ui/vendor-approval-actions';
import { formatDateShort } from '@/shared/lib/format/date';
import type { UserDirectoryRow, RingCoverageData } from '../types';
import type { ShowListItem } from '@/modules/shows/data/queries';

type Chip =
  'all' | 'staff' | 'officials' | 'riders' | 'vendors' | 'pending' | 'not_invited' | 'coggins';

const CHIPS: { key: Chip; label: string }[] = [
  { key: 'all', label: 'Everyone' },
  { key: 'staff', label: 'Staff' },
  { key: 'officials', label: 'Judges & scribes' },
  { key: 'riders', label: 'Riders' },
  { key: 'vendors', label: 'Vendors' },
  { key: 'pending', label: 'Pending' },
  { key: 'not_invited', label: 'Not invited' },
  { key: 'coggins', label: 'Coggins problems' },
];

const OFFICIALS = new Set(['Judge', 'Scribe']);

function matchesChip(row: UserDirectoryRow, chip: Chip): boolean {
  switch (chip) {
    case 'all':
      return true;
    case 'staff':
      return row.kind === 'staff';
    case 'officials':
      return row.kind === 'staff' && OFFICIALS.has(row.role);
    case 'riders':
      return row.kind === 'rider';
    case 'vendors':
      return row.kind === 'vendor';
    case 'pending':
      return row.status === 'pending';
    case 'not_invited':
      return row.status === 'not_invited';
    case 'coggins':
      return row.kind === 'rider' && row.coggins?.compliant === false;
  }
}

const ROLE_PILL: Record<string, string> = {
  staff: 'bg-[#EEF3FB] text-[#3E6FA8]',
  rider: 'bg-[#EDF0EE] text-[#5A6B63]',
  vendor: 'bg-[#F4EEFA] text-[#6B4FA0]',
};

const SMALL_BTN =
  'cursor-pointer rounded-[8px] border-[1.5px] border-[#1A5B3C] bg-white px-3 py-1 text-[12.5px] font-bold text-[#1A5B3C]';

function StatBox({
  label,
  value,
  note,
  color,
  active,
  onClick,
}: {
  label: string;
  value: number;
  note?: string;
  color?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`cursor-pointer rounded-[12px] border-[1.5px] bg-white px-4 py-3 text-left ${
        active
          ? 'border-[#1A5B3C] shadow-[0_0_0_3px_#E9F4EE]'
          : 'border-[#D9E1DD] hover:border-[#1A5B3C]'
      }`}
    >
      <span className="block text-[12.5px] font-semibold text-[#5A6B63]">{label}</span>
      <span
        className="block text-[26px] leading-tight font-bold"
        style={{ color: color ?? '#0D2C23' }}
      >
        {value}
      </span>
      {note && <span className="block text-[12px] font-semibold text-[#5A6B63]">{note}</span>}
    </button>
  );
}

export function UsersDirectory({
  rows,
  shows,
  initialShowId,
  initialShowFilter = '',
  classesByShow,
  ringCoverageByShow,
}: {
  rows: UserDirectoryRow[];
  shows: ShowListItem[];
  initialShowId: string;
  /** Opened from a show (?show=…): list only that show's people at first. */
  initialShowFilter?: string;

  classesByShow: Record<string, ClassOption[]>;
  ringCoverageByShow: Record<string, RingCoverageData>;
}) {
  const [targetShowId, setTargetShowId] = useState(initialShowId);
  const [search, setSearch] = useState('');
  const [chip, setChip] = useState<Chip>('all');
  const [showFilter, setShowFilter] = useState(initialShowFilter);
  const [editingRow, setEditingRow] = useState<UserDirectoryRow | null>(null);
  const [viewingRiderRow, setViewingRiderRow] = useState<UserDirectoryRow | null>(null);
  const [viewingVendorRow, setViewingVendorRow] = useState<UserDirectoryRow | null>(null);
  const [page, setPage] = useState(1);

  const targetShow = shows.find((s) => s.id === targetShowId) ?? shows[0] ?? null;
  const targetShowStaff = useMemo(
    () => rows.filter((r) => r.kind === 'staff' && r.showId === targetShowId),
    [rows, targetShowId],
  );
  const targetShowAnnouncers = useMemo(
    () =>
      targetShowStaff
        .filter((r) => r.role === 'Announcer')
        .map((r) => ({ id: r.id, name: r.name, isSteward: r.isSteward })),
    [targetShowStaff],
  );
  const targetShowRingCoverage = ringCoverageByShow[targetShowId] ?? { rings: [], assignments: {} };

  // Counts follow the show filter so the boxes always describe what's listed.
  const scoped = useMemo(
    () => (showFilter ? rows.filter((r) => r.showId === showFilter) : rows),
    [rows, showFilter],
  );
  const counts = useMemo(() => {
    const staff = scoped.filter((r) => r.kind === 'staff');
    return {
      staff: staff.length,
      judges: staff.filter((r) => r.role === 'Judge').length,
      scribes: staff.filter((r) => r.role === 'Scribe').length,
      riders: scoped.filter((r) => r.kind === 'rider').length,
      vendors: scoped.filter((r) => r.kind === 'vendor').length,
      invitesPending: staff.filter((r) => r.status === 'pending').length,
      vendorsPending: scoped.filter((r) => r.kind === 'vendor' && r.status === 'pending').length,
      coggins: scoped.filter((r) => r.kind === 'rider' && r.coggins?.compliant === false).length,
    };
  }, [scoped]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return scoped
      .filter((u) => {
        if (!matchesChip(u, chip)) return false;
        if (
          q &&
          !u.name.toLowerCase().includes(q) &&
          !(u.email ?? '').toLowerCase().includes(q) &&
          !(u.phone ?? '').toLowerCase().includes(q)
        )
          return false;
        return true;
      })
      .sort((a, b) => roleRank(a.role) - roleRank(b.role) || a.name.localeCompare(b.name));
  }, [scoped, chip, search]);

  const PAGE_SIZE = 25;
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const effectivePage = Math.min(Math.max(1, page), pageCount);
  const pageStart = (effectivePage - 1) * PAGE_SIZE;
  const pagedRows = filteredRows.slice(pageStart, pageStart + PAGE_SIZE);

  const pickChip = (next: Chip) => {
    setChip(next);
    setPage(1);
  };

  return (
    <div className="text-ink-deep font-[family-name:var(--font-ar)]">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[13.5px] font-semibold text-[#5A6B63]">
            Everyone working, riding or selling at your shows
          </p>
          <h1 className="mt-1 font-[family-name:var(--ws-fraunces)] text-[32px] leading-[1.1] font-bold text-[#0D2C23]">
            Users
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={targetShowId}
            onChange={(e) => {
              setTargetShowId(e.target.value);
            }}
            className="text-ink-deep max-w-full min-w-0 rounded-[10px] border-2 border-[#C9D3CE] bg-white px-3 py-2 text-[13.5px] font-semibold"
            aria-label="Show to add, upload or export staff for"
          >
            {shows.map((show) => (
              <option key={show.id} value={show.id}>
                Staff for: {show.name}
              </option>
            ))}
          </select>
          {targetShow && (
            <UploadStaffListDialog showId={targetShow.id} showName={targetShow.name} />
          )}
          {targetShow && (
            <ExportStaffListButton rows={targetShowStaff} showName={targetShow.name} />
          )}
          {targetShow && (
            <PermissionsListDialog
              staff={targetShowStaff}
              showName={targetShow.name}
              onEditStaff={setEditingRow}
            />
          )}
          <AddUserDialog
            shows={shows}
            defaultShowId={targetShowId}
            classes={classesByShow[targetShowId] ?? []}
          />
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatBox
          label="Staff & officials"
          value={counts.staff}
          note={`${String(counts.judges)} judges · ${String(counts.scribes)} scribes`}
          active={chip === 'staff'}
          onClick={() => {
            pickChip('staff');
          }}
        />
        <StatBox
          label="Riders"
          value={counts.riders}
          active={chip === 'riders'}
          onClick={() => {
            pickChip('riders');
          }}
        />
        <StatBox
          label="Vendors"
          value={counts.vendors}
          active={chip === 'vendors'}
          onClick={() => {
            pickChip('vendors');
          }}
        />
        <StatBox
          label="Invites pending"
          value={counts.invitesPending}
          color={counts.invitesPending > 0 ? '#8A6D14' : undefined}
          active={chip === 'pending'}
          onClick={() => {
            pickChip('pending');
          }}
        />
        <StatBox
          label="Coggins problems"
          value={counts.coggins}
          note={
            counts.vendorsPending > 0
              ? `${String(counts.vendorsPending)} vendors to approve`
              : undefined
          }
          color={counts.coggins > 0 ? '#B4432F' : undefined}
          active={chip === 'coggins'}
          onClick={() => {
            pickChip('coggins');
          }}
        />
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        {CHIPS.map((c) => (
          <button
            key={c.key}
            type="button"
            aria-pressed={chip === c.key}
            onClick={() => {
              pickChip(c.key);
            }}
            className={`cursor-pointer rounded-full border-2 px-3.5 py-1.5 text-[13px] font-bold ${
              chip === c.key
                ? 'border-[#1A5B3C] bg-[#1A5B3C] text-white'
                : 'border-[#C9D3CE] bg-white text-[#0D2C23] hover:border-[#1A5B3C]'
            }`}
          >
            {c.label}
          </button>
        ))}
        <select
          value={showFilter}
          onChange={(e) => {
            setShowFilter(e.target.value);
            setPage(1);
          }}
          className="text-ink-deep max-w-[200px] rounded-[10px] border-2 border-[#C9D3CE] bg-white px-3 py-1.5 text-[13px] font-semibold"
          aria-label="Filter by show"
        >
          <option value="">All shows</option>
          {shows.map((show) => (
            <option key={show.id} value={show.id}>
              {show.name}
            </option>
          ))}
        </select>
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Name, email or phone"
          aria-label="Search users"
          className="text-ink-deep ml-auto w-full rounded-[10px] border-2 border-[#C9D3CE] bg-white px-3 py-2 text-[14px] outline-none focus-visible:border-[#1A5B3C] sm:w-[240px]"
        />
      </div>

      <div className="overflow-x-auto rounded-[14px] border-[1.5px] border-[#C9D3CE] bg-white">
        <table className="w-full min-w-[900px] border-collapse text-[13.5px]">
          <thead>
            <tr className="bg-[#F5F7F6] text-left text-[11px] tracking-[.06em] text-[#5A6B63] uppercase">
              <th className="px-3 py-2.5 font-bold">Name</th>
              <th className="px-3 py-2.5 font-bold">Role</th>
              <th className="px-3 py-2.5 font-bold">Show</th>
              <th className="px-3 py-2.5 font-bold">Email · Phone</th>
              <th className="px-3 py-2.5 font-bold">Status</th>
              <th className="px-3 py-2.5 font-bold">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {pagedRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-[13.5px] text-[#7A8781]">
                  No users match those filters.
                </td>
              </tr>
            ) : (
              pagedRows.map((row) => {
                const openRow = () => {
                  if (row.kind === 'staff') setEditingRow(row);
                  else if (row.kind === 'rider') setViewingRiderRow(row);
                  else setViewingVendorRow(row);
                };
                const meta = USER_STATUS_META[row.status];
                return (
                  <tr
                    key={row.key}
                    tabIndex={0}
                    onClick={openRow}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') openRow();
                    }}
                    className="cursor-pointer border-t border-[#EDF0EE] hover:bg-[#F8FAF9]"
                  >
                    <td className="px-3 py-3 font-bold text-[#0D2C23]">{row.name}</td>
                    <td className="px-3 py-3">
                      <span
                        className={`rounded-[7px] px-2 py-0.5 text-[11.5px] font-extrabold ${ROLE_PILL[row.kind] ?? 'bg-[#EDF0EE] text-[#5A6B63]'}`}
                      >
                        {row.role}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-semibold text-[#5A6B63]">{row.showName}</td>
                    <td className="px-3 py-3 text-[12.5px] font-semibold text-[#5A6B63]">
                      <span className="block">{row.email ?? '—'}</span>
                      <span className="block">{row.phone ?? '—'}</span>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className="rounded-[7px] px-2 py-0.5 text-[11.5px] font-extrabold"
                        style={{ background: meta.bg, color: meta.fg }}
                      >
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      {row.kind === 'vendor' && row.status === 'pending' ? (
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          <VendorApprovalActions bookingId={row.id} showId={row.showId} />
                        </span>
                      ) : row.kind === 'rider' ? (
                        <CogginsPill row={row} />
                      ) : row.kind === 'staff' ? (
                        <span className={SMALL_BTN}>Edit</span>
                      ) : (
                        <span className={SMALL_BTN}>View</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {filteredRows.length > PAGE_SIZE && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[13px] text-[#48574F]">
          <span>
            Showing {pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, filteredRows.length)} of{' '}
            {filteredRows.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={effectivePage <= 1}
              onClick={() => {
                setPage(effectivePage - 1);
              }}
              className={`${SMALL_BTN} disabled:opacity-40`}
            >
              Previous
            </button>
            <span className="tabular-nums">
              Page {effectivePage} of {pageCount}
            </span>
            <button
              type="button"
              disabled={effectivePage >= pageCount}
              onClick={() => {
                setPage(effectivePage + 1);
              }}
              className={`${SMALL_BTN} disabled:opacity-40`}
            >
              Next
            </button>
          </div>
        </div>
      )}

      <div className="mt-5" />
      {targetShow && (
        <RingCoverageCard
          showId={targetShow.id}
          coverage={targetShowRingCoverage}
          announcers={targetShowAnnouncers}
        />
      )}

      <StaffEditDialog
        row={editingRow}
        shows={shows}
        onClose={() => {
          setEditingRow(null);
        }}
      />
      {viewingRiderRow && (
        <RiderDetailDialog
          row={viewingRiderRow}
          onClose={() => {
            setViewingRiderRow(null);
          }}
        />
      )}
      {viewingVendorRow && (
        <VendorDetailDialog
          row={viewingVendorRow}
          onClose={() => {
            setViewingVendorRow(null);
          }}
        />
      )}
    </div>
  );
}

/* Rider rows show where their Coggins stands as one colored pill. */
function CogginsPill({ row }: { row: UserDirectoryRow }) {
  const coggins = row.coggins;
  if (!coggins?.applicable) return <span className="text-[#98A29D]">—</span>;

  const date = coggins.expirationDate ? formatDateShort(coggins.expirationDate) : null;
  const [tone, text] =
    coggins.reason === 'missing'
      ? (['bg-[#FDEEEB] text-[#98341F]', 'Coggins not uploaded'] as const)
      : coggins.reason === 'expired'
        ? (['bg-[#FDEEEB] text-[#98341F]', `Coggins expired${date ? ` ${date}` : ''}`] as const)
        : !coggins.expirationDate
          ? (['bg-[#FDEEEB] text-[#98341F]', 'Coggins has no date'] as const)
          : coggins.verified
            ? (['bg-[#E9F4EE] text-[#1A5B3C]', `Coggins ✓ to ${date ?? ''}`] as const)
            : (['bg-[#FCF3E4] text-[#8A6D14]', 'Coggins waiting review'] as const);

  return (
    <span
      className={`rounded-[7px] px-2 py-0.5 text-[11.5px] font-extrabold whitespace-nowrap ${tone}`}
    >
      {text}
    </span>
  );
}
