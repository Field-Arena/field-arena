'use client';

import { useState } from 'react';
import { useImportMembers } from '@/modules/organizations/hooks/use-member-mutations';
import {
  detectMemberCsvColumns,
  type ParsedMemberCsvColumn,
} from '@/modules/organizations/utils/detect-member-csv-columns';
import { buildMemberRowsFromCsv } from '@/modules/organizations/utils/build-member-rows-from-csv';

export function useMemberImport({ onSuccess }: { onSuccess: () => void }) {
  const [columns, setColumns] = useState<ParsedMemberCsvColumn[]>([]);
  const [dataLines, setDataLines] = useState<string[]>([]);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');

  const importMembers = useImportMembers({ onSuccess });

  function loadFile(file: File) {
    setFileName(file.name);
    void file.text().then(parse);
  }

  function parse(text: string) {
    const result = detectMemberCsvColumns(text);
    if ('error' in result) {
      setError(result.error);
      return;
    }

    setError(null);
    setColumns(result.columns);
    setDataLines(result.dataLines);
    setExcluded(new Set());
  }

  function toggleExcluded(header: string) {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(header)) next.delete(header);
      else next.add(header);
      return next;
    });
  }

  function submit() {
    const rows = buildMemberRowsFromCsv(dataLines, columns, excluded);
    if (rows.length === 0) {
      setError('No rows in that file had a name.');
      return;
    }
    importMembers.mutate({ rows });
  }

  const pickable = columns.filter(
    (c) => c.field !== 'name' && c.field !== 'firstName' && c.field !== 'lastName',
  );

  return {
    columns,
    fileName,
    error,
    excluded,
    pickable,
    rowCount: dataLines.length,
    loadFile,
    toggleExcluded,
    submit,
    isPending: importMembers.isPending,
  };
}
