'use client';

import { ScreenTitle, ScreenLede, Card } from '@/shared/ui/organizer/card';
import { GhostButton, PrimaryButton } from '@/shared/ui/organizer/buttons';
import { IconUpload, IconFile, IconColumns } from '@/shared/ui/organizer/icons';
import { SearchInput } from '@/shared/ui/organizer/search-input';
import { StatusBadge } from '@/shared/ui/status-badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/shadcn/table';
import { cn } from '@/shared/lib/utils';
import { MEMBER_ROW_CAP, type MemberColumnKey } from '@/modules/organizations/constants';
import type { MemberRow } from '@/modules/organizations/data/queries';
import { useMemberDatabase } from '@/modules/organizations/hooks/use-member-database';
import { MemberEditDialog } from '@/modules/organizations/ui/member-edit-dialog';
import { MemberImportDialog } from '@/modules/organizations/ui/member-import-dialog';

export function MemberDatabaseScreen({
  members,
  shows,
}: {
  members: MemberRow[];
  shows: { id: string; name: string }[];
}) {
  const {
    search,
    setSearch,
    roleFilter,
    setRoleFilter,
    columnsOpen,
    setColumnsOpen,
    checked,
    toggleChecked,
    toggleAllChecked,
    clearChecked,
    editing,
    setEditing,
    adding,
    setAdding,
    closeEditDialog,
    importing,
    setImporting,
    targetShow,
    setTargetShow,
    addToShow,
    columns,
    roles,
    filtered,
    shown,
    visibleCols,
    toggleHiddenCol,
    today,
    exportCsv,
  } = useMemberDatabase({ members, shows });

  return (
    <div className="text-ink-deep font-[family-name:var(--font-ar)]">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <ScreenTitle className="mb-1.5">Member Database</ScreenTitle>
          <ScreenLede className="mb-0">
            {`${String(members.length)} of ${String(members.length)} ${members.length === 1 ? 'person' : 'people'} in your organization's database.`}
          </ScreenLede>
        </div>

        <div className="flex flex-wrap gap-2">
          <PrimaryButton
            onClick={() => {
              setAdding(true);
            }}
          >
            + Add Member
          </PrimaryButton>
          <GhostButton
            onClick={() => {
              setImporting(true);
            }}
          >
            <IconUpload size={14} /> Upload List
          </GhostButton>
          <GhostButton onClick={exportCsv}>
            <IconFile size={14} /> Export List
          </GhostButton>
        </div>
      </div>

      {checked.size > 0 && (
        <Card className="mb-4 flex flex-wrap items-center gap-2.5 p-4">
          <b className="text-[13.5px]">{checked.size} selected</b>
          <select
            value={targetShow}
            onChange={(e) => {
              setTargetShow(e.target.value);
            }}
            aria-label="Show to add them to"
            className="rounded-[8px] border border-[#D9E1DD] bg-white px-3 py-2 text-[13px]"
          >
            {shows.map((show) => (
              <option key={show.id} value={show.id}>
                {show.name}
              </option>
            ))}
          </select>
          <PrimaryButton
            disabled={!targetShow || addToShow.isPending}
            onClick={() => {
              addToShow.mutate({ showId: targetShow, memberIds: [...checked] });
            }}
          >
            {addToShow.isPending ? 'Adding…' : 'Add to Show →'}
          </PrimaryButton>
          <GhostButton onClick={clearChecked}>Clear</GhostButton>
        </Card>
      )}

      <Card className="p-5">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
          <span className="text-forest font-[family-name:var(--font-nr)] text-[17px] font-semibold">
            Member Database
          </span>
          <span className="text-[12.5px] text-[#7A8781]">
            {filtered.length} of {members.length}
          </span>
        </div>
        <p className="mb-3 text-[12.5px] leading-[1.55] text-[#6E7C76]">
          Your organization&apos;s full contact list. Check anyone and add them straight into a show
          — it copies them in, it doesn&apos;t remove them from here.
        </p>

        <div className="relative mb-3 flex flex-wrap gap-2">
          <SearchInput
            type="text"
            placeholder="Search name or email…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
            }}
            containerClassName="min-w-[180px] basis-auto"
            className="rounded-[8px] py-2 text-[13.5px]"
          />
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
            }}
            aria-label="Filter by type"
            className="rounded-[8px] border border-[#D9E1DD] bg-white px-3 py-2 text-[13px]"
          >
            <option value="">All types</option>
            {roles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>

          <div className="relative">
            <GhostButton
              onClick={() => {
                setColumnsOpen((v) => !v);
              }}
            >
              <IconColumns size={14} /> Columns
            </GhostButton>
            {columnsOpen && (
              <div className="absolute top-full right-0 z-20 mt-1 w-[190px] rounded-[10px] border border-[#E9EDEB] bg-white p-2 shadow-lg">
                {columns.map((col) => (
                  <label
                    key={col.key}
                    className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-[12.5px] hover:bg-[#F5F7F6]"
                  >
                    <input
                      type="checkbox"
                      checked={!col.hidden}
                      onChange={() => {
                        toggleHiddenCol(col.key);
                      }}
                    />
                    {col.label}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {filtered.length > MEMBER_ROW_CAP && (
          <p className="mb-2.5 rounded-[8px] bg-[#FCF3E4] px-3 py-2 text-[12.5px] text-[#8A6D14]">
            Showing {MEMBER_ROW_CAP} of {filtered.length} matches — search or filter by type to
            narrow it down.
          </p>
        )}

        {filtered.length === 0 ? (
          <p className="py-4 text-[13px] text-[#98A29D] italic">
            {members.length === 0
              ? 'Nobody in your database yet — add someone, or upload a list.'
              : 'No members match those filters.'}
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <Table className="border-collapse text-[13px]">
              <caption className="sr-only">Everyone in your organization&apos;s database</caption>
              <TableHeader className="[&_tr]:border-0">
                <TableRow className="border-b border-[#E9EDEB] hover:bg-transparent">
                  <TableHead scope="col" className="h-auto w-[30px] py-2">
                    <input
                      type="checkbox"
                      title="Selects every match, not just the rows shown"
                      checked={filtered.length > 0 && filtered.every((m) => checked.has(m.id))}
                      onChange={(e) => {
                        toggleAllChecked(e.target.checked);
                      }}
                    />
                  </TableHead>
                  <TableHead scope="col" className="h-auto py-2 text-left">
                    Name
                  </TableHead>
                  {visibleCols.map((col) => (
                    <TableHead key={col.key} scope="col" className="h-auto py-2 text-left">
                      {col.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {shown.map((member) => {
                  const expired = !!member.membershipExpires && member.membershipExpires < today;

                  return (
                    <TableRow
                      key={member.id}
                      onClick={() => {
                        setEditing(member);
                      }}
                      className="cursor-pointer border-b border-[#F1F4F3] hover:bg-[#F8FAF9]"
                    >
                      <TableCell
                        className="py-2 whitespace-normal"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked.has(member.id)}
                          aria-label={`Select ${member.name}`}
                          onChange={(e) => {
                            toggleChecked(member.id, e.target.checked);
                          }}
                        />
                      </TableCell>
                      <TableCell className="py-2 font-semibold whitespace-normal">
                        {member.name}
                      </TableCell>

                      {visibleCols.map((col) => (
                        <TableCell
                          key={col.key}
                          className={cn(
                            'py-2 whitespace-normal',
                            (col.key === 'notes' || col.extra) && 'text-[12px] text-[#7A8781]',
                            col.key === 'membershipExpires' &&
                              expired &&
                              'font-semibold text-[#B4432F]',
                          )}
                        >
                          {col.key === 'membershipStatus' ? (
                            <StatusBadge
                              tone={member.membershipStatus === 'inactive' ? 'neutral' : 'success'}
                            >
                              {member.membershipStatus === 'inactive' ? 'Inactive' : 'Active'}
                            </StatusBadge>
                          ) : col.key === 'membershipExpires' ? (
                            <>
                              {member.membershipExpires ?? '—'}
                              {expired && <span className="ml-1 text-[11px]">(expired)</span>}
                            </>
                          ) : col.extra ? (
                            (member.extraFields[col.key.slice(6)] ?? '—')
                          ) : (
                            (member[col.key as MemberColumnKey] ?? '—')
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {(editing ?? adding) && (
        <MemberEditDialog key={editing?.id ?? 'new'} member={editing} onClose={closeEditDialog} />
      )}

      {importing && (
        <MemberImportDialog
          onClose={() => {
            setImporting(false);
          }}
        />
      )}
    </div>
  );
}
