'use client';

import { useMemo, useState } from 'react';
import { SearchIcon } from 'lucide-react';
import {
  Chip,
  ChipRow,
  EmptyState,
  FA_BTN,
  FA_BTN_PRIMARY,
  FA_BTN_SMALL,
  FA_MUTED,
  FA_SELECT,
  FA_TABLE,
  FA_TABLE_WRAP,
  FA_TD,
  FA_TH,
  FA_THEAD_ROW,
  FA_TR,
  FaCard,
  PageHeader,
  Pill,
  StatBox,
  StatGrid,
} from '@/shared/ui/organizer/fa-page';
import { formatDateShort } from '@/shared/lib/format/date';
import { cn } from '@/shared/lib/utils';
import {
  MEMBER_COLUMNS,
  MEMBER_ROW_CAP,
  type MemberColumnKey,
} from '@/modules/organizations/constants';
import type { MemberRow } from '@/modules/organizations/types';
import { buildMembersCsv } from '@/modules/organizations/utils/build-members-csv';
import { useAddMembersToShow } from '@/modules/organizations/hooks/use-member-mutations';
import { MemberEditDialog } from '@/modules/organizations/ui/member-edit-dialog';
import { MemberImportDialog } from '@/modules/organizations/ui/member-import-dialog';

function isoDaysFromToday(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

const ALL = '';
const EXPIRED = '\u0000expired';
const OFFICIAL_ROLES = new Set(['Judge', 'Scribe', 'Announcer', 'Show Admin', 'Organizer']);

export function MemberDatabaseScreen({
  members,
  shows,
}: {
  members: MemberRow[];
  shows: { id: string; name: string }[];
}) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState(ALL);
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

  const columns = useMemo(() => {
    const extraKeys = [...new Set(members.flatMap((m) => Object.keys(m.extraFields)))].sort();
    return [
      ...MEMBER_COLUMNS.map((c) => ({ key: c.key, label: c.label, extra: false })),
      ...extraKeys.map((k) => ({ key: `extra:${k}`, label: k, extra: true })),
    ];
  }, [members]);

  const roles = useMemo(
    () => [...new Set(members.map((m) => m.role).filter((r): r is string => !!r))].sort(),
    [members],
  );

  const today = isoDaysFromToday(0);
  const in30Days = isoDaysFromToday(30);
  const isExpired = (m: MemberRow) => !!m.membershipExpires && m.membershipExpires < today;

  const counts = {
    active: members.filter((m) => m.membershipStatus !== 'inactive' && !isExpired(m)).length,
    expiringSoon: members.filter(
      (m) =>
        !!m.membershipExpires && m.membershipExpires >= today && m.membershipExpires <= in30Days,
    ).length,
    expired: members.filter(isExpired).length,
  };

  const q = search.trim().toLowerCase();
  const filtered = members
    .filter((m) => {
      if (filter === EXPIRED) {
        if (!isExpired(m)) return false;
      } else if (filter && m.role !== filter) return false;
      if (!q) return true;
      return m.name.toLowerCase().includes(q) || (m.email ?? '').toLowerCase().includes(q);
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const shown = filtered.slice(0, MEMBER_ROW_CAP);
  const visibleCols = columns.filter((c) => !hiddenCols.has(c.key));

  function exportCsv() {
    const csv = buildMembersCsv(members);
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'field-and-arena-member-database.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="text-ink-deep font-[family-name:var(--font-ar)]">
      <PageHeader
        eyebrow="Everyone in your organization's contact database"
        title="Member Database"
        actions={
          <>
            <button
              type="button"
              className={FA_BTN}
              onClick={() => {
                setImporting(true);
              }}
            >
              <span aria-hidden>⇪</span> Upload list
            </button>
            <button type="button" className={FA_BTN} onClick={exportCsv}>
              <span aria-hidden>⇩</span> Export
            </button>
            <button
              type="button"
              className={FA_BTN_PRIMARY}
              onClick={() => {
                setAdding(true);
              }}
            >
              + Add member
            </button>
          </>
        }
      />

      <StatGrid cols={4}>
        <StatBox label="People" value={members.length} />
        <StatBox label="Active members" value={counts.active} tone="green" />
        <StatBox label="Expiring in 30 days" value={counts.expiringSoon} tone="yellow" />
        <StatBox
          label="Expired"
          value={counts.expired}
          tone="red"
          active={filter === EXPIRED}
          onClick={() => {
            setFilter(filter === EXPIRED ? ALL : EXPIRED);
          }}
        />
      </StatGrid>

      {checked.size > 0 && (
        <FaCard tone="live" className="mb-3 flex flex-wrap items-center gap-2.5">
          <b className="text-[13.5px]">{checked.size} selected</b>
          <select
            value={targetShow}
            onChange={(e) => {
              setTargetShow(e.target.value);
            }}
            aria-label="Show to add them to"
            className={FA_SELECT}
          >
            {shows.map((show) => (
              <option key={show.id} value={show.id}>
                {show.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            className={FA_BTN_PRIMARY}
            disabled={!targetShow || addToShow.isPending}
            onClick={() => {
              addToShow.mutate({ showId: targetShow, memberIds: [...checked] });
            }}
          >
            {addToShow.isPending ? 'Adding…' : 'Add to show →'}
          </button>
          <button
            type="button"
            className={FA_BTN}
            onClick={() => {
              setChecked(new Set());
            }}
          >
            Clear
          </button>
          <span className={FA_MUTED}>
            Copies them into the show — they stay in your database too.
          </span>
        </FaCard>
      )}

      <ChipRow>
        <Chip
          active={filter === ALL}
          onClick={() => {
            setFilter(ALL);
          }}
        >
          Everyone
        </Chip>
        {roles.map((role) => (
          <Chip
            key={role}
            active={filter === role}
            onClick={() => {
              setFilter(role);
            }}
          >
            {role}
          </Chip>
        ))}
        <Chip
          active={filter === EXPIRED}
          onClick={() => {
            setFilter(EXPIRED);
          }}
        >
          Expired
        </Chip>

        <div className="relative">
          <button
            type="button"
            className={FA_BTN_SMALL}
            aria-expanded={columnsOpen}
            onClick={() => {
              setColumnsOpen((v) => !v);
            }}
          >
            Columns ▾
          </button>
          {columnsOpen && (
            <div className="absolute top-full left-0 z-20 mt-1 w-[190px] rounded-[10px] border-[1.5px] border-[#C9D3CE] bg-white p-2 shadow-lg">
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

        <label className="ml-auto flex h-10 w-[290px] max-w-full items-center gap-2 rounded-[10px] border-2 border-[#C9D3CE] bg-white px-3 focus-within:border-[#1A5B3C]">
          <SearchIcon className="size-4 text-[#98A29D]" aria-hidden />
          <input
            type="text"
            placeholder="Name or email"
            aria-label="Search members"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
            }}
            className="w-full border-0 bg-transparent text-[14px] outline-none"
          />
        </label>
      </ChipRow>

      {filtered.length > MEMBER_ROW_CAP && (
        <p className="mb-2.5 rounded-[10px] bg-[#FCF3E4] px-3 py-2 text-[12.5px] font-semibold text-[#8A6D14]">
          Showing {MEMBER_ROW_CAP} of {filtered.length} matches — search or filter by type to narrow
          it down.
        </p>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          title={members.length === 0 ? 'Nobody in your database yet' : 'No members match'}
          note={
            members.length === 0
              ? 'Add someone, or upload a list.'
              : 'Try another type or clear the search.'
          }
        />
      ) : (
        <div className={FA_TABLE_WRAP}>
          <table className={FA_TABLE}>
            <caption className="sr-only">Everyone in your organization&apos;s database</caption>
            <thead>
              <tr className={FA_THEAD_ROW}>
                <th scope="col" className={cn(FA_TH, 'w-[34px]')}>
                  <input
                    type="checkbox"
                    title="Selects every match, not just the rows shown"
                    aria-label="Select every match"
                    checked={filtered.length > 0 && filtered.every((m) => checked.has(m.id))}
                    onChange={(e) => {
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
                <th scope="col" className={FA_TH}>
                  Name
                </th>
                {visibleCols.map((col) => (
                  <th key={col.key} scope="col" className={FA_TH}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((member) => {
                const expired = isExpired(member);

                return (
                  <tr
                    key={member.id}
                    onClick={() => {
                      setEditing(member);
                    }}
                    className={cn(FA_TR, 'cursor-pointer hover:bg-[#FBFCFB]')}
                  >
                    <td
                      className={FA_TD}
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
                    <td className={cn(FA_TD, 'font-bold')}>{member.name}</td>

                    {visibleCols.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          FA_TD,
                          (col.key === 'notes' || col.extra) && 'text-[12px] text-[#5A6B63]',
                          (col.key === 'email' || col.key === 'phone') &&
                            'text-[12.5px] font-semibold text-[#5A6B63]',
                          col.key === 'membershipExpires' &&
                            (expired
                              ? 'font-semibold text-[#B4432F]'
                              : 'text-[12.5px] font-semibold text-[#5A6B63]'),
                        )}
                      >
                        {col.key === 'role' ? (
                          member.role ? (
                            <Pill tone={OFFICIAL_ROLES.has(member.role) ? 'blue' : 'grey'}>
                              {member.role}
                            </Pill>
                          ) : (
                            '—'
                          )
                        ) : col.key === 'membershipStatus' ? (
                          expired ? (
                            <Pill tone="red">Expired</Pill>
                          ) : member.membershipStatus === 'inactive' ? (
                            <Pill tone="yellow">Inactive</Pill>
                          ) : (
                            <Pill tone="green">Active</Pill>
                          )
                        ) : col.key === 'membershipExpires' ? (
                          member.membershipExpires ? (
                            formatDateShort(member.membershipExpires)
                          ) : (
                            '—'
                          )
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
      <p className="mt-2.5 text-[12.5px] font-semibold text-[#5A6B63]">
        {filtered.length} of {members.length} {members.length === 1 ? 'person' : 'people'}. Click
        someone to edit them, or check people and add them straight into a show.
      </p>

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
