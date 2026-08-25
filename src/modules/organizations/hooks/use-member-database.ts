'use client';

import { useMemo, useState } from 'react';
import { MEMBER_COLUMNS, MEMBER_ROW_CAP } from '@/modules/organizations/constants';
import type { MemberRow } from '@/modules/organizations/data/queries';
import { buildMembersCsv } from '@/modules/organizations/utils/build-members-csv';
import { useAddMembersToShow } from '@/modules/organizations/hooks/use-member-mutations';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function useMemberDatabase({
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

  const allColumns = useMemo(() => {
    const extraKeys = [...new Set(members.flatMap((m) => Object.keys(m.extraFields)))].sort();
    return [
      ...MEMBER_COLUMNS.map((c) => ({ key: c.key, label: c.label, extra: false })),
      ...extraKeys.map((k) => ({ key: `extra:${k}`, label: k, extra: true })),
    ];
  }, [members]);

  const columns = useMemo(
    () => allColumns.map((c) => ({ ...c, hidden: hiddenCols.has(c.key) })),
    [allColumns, hiddenCols],
  );

  const roles = useMemo(
    () => [...new Set(members.map((m) => m.role).filter((r): r is string => !!r))].sort(),
    [members],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return members
      .filter((m) => {
        if (roleFilter && m.role !== roleFilter) return false;
        if (!q) return true;
        return m.name.toLowerCase().includes(q) || (m.email ?? '').toLowerCase().includes(q);
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [members, search, roleFilter]);

  const shown = filtered.slice(0, MEMBER_ROW_CAP);
  const visibleCols = allColumns.filter((c) => !hiddenCols.has(c.key));
  const today = todayIso();

  function toggleHiddenCol(key: string) {
    setHiddenCols((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleChecked(id: string, value: boolean) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (value) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function toggleAllChecked(value: boolean) {
    setChecked((prev) => {
      const next = new Set(prev);
      for (const m of filtered) {
        if (value) next.add(m.id);
        else next.delete(m.id);
      }
      return next;
    });
  }

  function exportCsv() {
    const csv = buildMembersCsv(members);
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'field-and-arena-member-database.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  function closeEditDialog() {
    setEditing(null);
    setAdding(false);
  }

  return {
    search,
    setSearch,
    roleFilter,
    setRoleFilter,
    columnsOpen,
    setColumnsOpen,
    checked,
    toggleChecked,
    toggleAllChecked,
    clearChecked: () => {
      setChecked(new Set());
    },
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
  };
}
