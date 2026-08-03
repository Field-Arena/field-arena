'use client';

import { useMemo, useState } from 'react';
import { ScreenTitle, ScreenLede, Card } from '@/shared/ui/organizer/card';
import { GhostButton, PrimaryButton } from '@/shared/ui/organizer/buttons';
import { StatusBadge } from '@/shared/ui/status-badge';
import { cn } from '@/shared/lib/utils';
import {
  MEMBER_COLUMNS,
  MEMBER_CSV_HEADERS,
  MEMBER_ROW_CAP,
  type MemberColumnKey,
} from '../constants';
import type { MemberRow } from '../data/queries';
import { useAddMembersToShow } from '../hooks/use-member-mutations';
import { MemberEditDialog } from './member-edit-dialog';
import { MemberImportDialog } from './member-import-dialog';

/** Today in ISO, for the expired check. */
function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function csvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/**
 * The organization's contact database — ported from showstaff.html's
 * renderMemberDb / updateMemberDbTable.
 *
 * One list of everyone the organization deals with, independent of any show.
 * Checking people and adding them to a show *copies* them in; they stay here
 * either way, which is the distinction the screen's own note draws.
 */
export function MemberDatabaseScreen({
  members,
  shows,
}: {
  members: MemberRow[];
  shows: { id: string; name: string }[];
}) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(new Set());
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<MemberRow | null>(null);
  const [adding, setAdding] = useState(false);
  const [importing, setImporting] = useState(false);
  const [targetShow, setTargetShow] = useState(shows[0]?.id ?? '');

  const addToShow = useAddMembersToShow({
    onSuccess: () => {
      setChecked(new Set());
    },
  });

  /**
   * The toggleable columns: the fixed six, plus one per custom field any
   * imported row carries — memberColumnDefs concatenates `extra:` columns the
   * same way, so a spreadsheet's own columns are as visible as the built-in
   * ones instead of only surfacing inside a person's detail.
   */
  const columns = useMemo(() => {
    const extraKeys = [...new Set(members.flatMap((m) => Object.keys(m.extraFields)))].sort();
    return [
      ...MEMBER_COLUMNS.map((c) => ({ key: c.key, label: c.label, extra: false })),
      ...extraKeys.map((k) => ({ key: `extra:${k}`, label: k, extra: true })),
    ];
  }, [members]);

  const roles = useMemo(
    () => [...new Set(members.map((m) => m.role).filter((r): r is string => !!r))].sort(),
    [members]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return members
      .filter((m) => {
        if (roleFilter && m.role !== roleFilter) return false;
        if (!q) return true;
        return (
          m.name.toLowerCase().includes(q) || (m.email ?? '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [members, search, roleFilter]);

  const shown = filtered.slice(0, MEMBER_ROW_CAP);
  const visibleCols = columns.filter((c) => !hiddenCols.has(c.key));
  const today = todayIso();

  function exportCsv() {
    const headers = [...MEMBER_CSV_HEADERS];
    const extraKeys = [...new Set(members.flatMap((m) => Object.keys(m.extraFields)))].sort();
    const lines = [[...headers, ...extraKeys].map(csvCell).join(',')];

    for (const m of members) {
      // A person imported without split names still exports as two columns —
      // the display name is the only thing that survived, so it leads.
      const first = m.firstName ?? m.name.split(/\s+/).slice(0, -1).join(' ');
      const last = m.lastName ?? m.name.split(/\s+/).slice(-1).join(' ');
      lines.push(
        [
          first,
          last,
          m.role ?? '',
          m.phone ?? '',
          m.email ?? '',
          m.notes ?? '',
          ...extraKeys.map((k) => m.extraFields[k] ?? ''),
        ]
          .map(csvCell)
          .join(',')
      );
    }

    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'field-and-arena-member-database.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="font-[family-name:var(--font-ar)] text-ink-deep">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <ScreenTitle className="mb-1.5">Member Database</ScreenTitle>
          <ScreenLede className="mb-0">
            {members.length} {members.length === 1 ? 'person' : 'people'} in your
            organization&apos;s database
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
            ⬆ Upload List
          </GhostButton>
          <GhostButton onClick={exportCsv}>⬇ Export List</GhostButton>
        </div>
      </div>

      {/* Only appears once something is checked, matching the legacy add-bar. */}
      {checked.size > 0 && (
        <Card className="mb-4 flex flex-wrap items-center gap-2.5 p-4">
          <b className="text-[13.5px]">
            {checked.size} selected
          </b>
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
          <GhostButton
            onClick={() => {
              setChecked(new Set());
            }}
          >
            Clear
          </GhostButton>
        </Card>
      )}

      <Card className="p-5">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
          <span className="font-[family-name:var(--font-nr)] text-[17px] font-semibold text-forest">
            Member Database
          </span>
          <span className="text-[12.5px] text-[#7A8781]">
            {filtered.length} of {members.length}
          </span>
        </div>
        <p className="mb-3 text-[12.5px] leading-[1.55] text-[#6E7C76]">
          Your organization&apos;s full contact list. Check anyone and add them straight into a
          show — it copies them in, it doesn&apos;t remove them from here.
        </p>

        <div className="relative mb-3 flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="Search name or email…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
            }}
            className="min-w-[180px] flex-1 rounded-[8px] border border-[#D9E1DD] px-3 py-2 text-[13.5px] outline-none focus-visible:border-gold"
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
              ☰ Columns
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
                      checked={!hiddenCols.has(col.key)}
                      onChange={() => {
                        setHiddenCols((prev) => {
                          const next = new Set(prev);
                          if (next.has(col.key)) next.delete(col.key);
                          else next.add(col.key);
                          return next;
                        });
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
          <p className="py-4 text-[13px] italic text-[#98A29D]">
            {members.length === 0
              ? 'Nobody in your database yet — add someone, or upload a list.'
              : 'No members match those filters.'}
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="w-full border-collapse text-[13px]">
              <caption className="sr-only">Everyone in your organization&apos;s database</caption>
              <thead>
                <tr className="border-b border-[#E9EDEB]">
                  <th scope="col" className="w-[30px] py-2">
                    <input
                      type="checkbox"
                      title="Selects every match, not just the rows shown"
                      checked={filtered.length > 0 && filtered.every((m) => checked.has(m.id))}
                      onChange={(e) => {
                        // Adds or removes only the current matches, leaving a
                        // selection made under a different filter alone — the
                        // legacy toggleAllMembers walks the filtered list and
                        // adds/deletes each rather than replacing the set. It
                        // covers every match, not just the capped rows on
                        // screen, which is what its title promised.
                        setChecked((prev) => {
                          const next = new Set(prev);
                          for (const m of filtered) {
                            if (e.target.checked) next.add(m.id);
                            else next.delete(m.id);
                          }
                          return next;
                        });
                      }}
                    />
                  </th>
                  <th scope="col" className="py-2 text-left">
                    Name
                  </th>
                  {visibleCols.map((col) => (
                    <th key={col.key} scope="col" className="py-2 text-left">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shown.map((member) => {
                  const expired =
                    !!member.membershipExpires && member.membershipExpires < today;

                  return (
                    <tr
                      key={member.id}
                      onClick={() => {
                        setEditing(member);
                      }}
                      className="cursor-pointer border-b border-[#F1F4F3] hover:bg-[#F8FAF9]"
                    >
                      <td
                        className="py-2"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked.has(member.id)}
                          aria-label={`Select ${member.name}`}
                          onChange={(e) => {
                            setChecked((prev) => {
                              const next = new Set(prev);
                              if (e.target.checked) next.add(member.id);
                              else next.delete(member.id);
                              return next;
                            });
                          }}
                        />
                      </td>
                      <td className="py-2 font-semibold">{member.name}</td>

                      {visibleCols.map((col) => (
                        <td
                          key={col.key}
                          className={cn(
                            'py-2',
                            // Notes and imported columns read as supplementary —
                            // smaller and muted, so the identifying columns stay
                            // the ones the eye lands on.
                            (col.key === 'notes' || col.extra) && 'text-[12px] text-[#7A8781]',
                            col.key === 'membershipExpires' && expired && 'font-semibold text-[#B4432F]'
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
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {(editing ?? adding) && (
        <MemberEditDialog
          key={editing?.id ?? 'new'}
          member={editing}
          onClose={() => {
            setEditing(null);
            setAdding(false);
          }}
        />
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
