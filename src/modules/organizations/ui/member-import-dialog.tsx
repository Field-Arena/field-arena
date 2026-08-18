'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/shadcn/dialog';
import { Button } from '@/shared/ui/shadcn/button';
import { useImportMembers } from '../hooks/use-member-mutations';
import {
  detectMemberCsvColumns,
  buildMemberRowsFromCsv,
  type ParsedMemberCsvColumn,
} from '../utils';

/**
 * "Upload List" — a CSV of people, straight into the database.
 *
 * Any column the file carries beyond the known ones is kept as an extra field
 * rather than dropped, so an organizer's own spreadsheet columns survive the
 * round-trip through export.
 */
export function MemberImportDialog({ onClose }: { onClose: () => void }) {
  const [columns, setColumns] = useState<ParsedMemberCsvColumn[]>([]);
  const [dataLines, setDataLines] = useState<string[]>([]);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');

  const importMembers = useImportMembers({ onSuccess: onClose });

  /**
   * Reads the file into columns and rows, without building members yet.
   *
   * The field picker runs between this and the import, so which columns are
   * used is a decision the organizer makes after seeing what the file has.
   */
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

  // Everything the file offers to leave out — name is not among them.
  const pickable = columns.filter((c) => c.field !== 'name' && c.field !== 'firstName' && c.field !== 'lastName');
  const rowCount = dataLines.length;

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-hunter-deep">Upload a list</DialogTitle>
          <DialogDescription>
            A CSV with a header row. First name, Last name, Type, Phone, Email and Notes are
            recognised — any other column is kept against each person as an extra field.
          </DialogDescription>
        </DialogHeader>

        <div className="my-4">
          {columns.length === 0 ? (
            <input
              type="file"
              accept=".csv,text/csv"
              className="text-[13px]"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setFileName(file.name);
                void file.text().then(parse);
              }}
            />
          ) : (
            <>
              <p className="mb-3 text-[13px] text-[#6E7C76]">
                Found <b>{rowCount}</b> {rowCount === 1 ? 'row' : 'rows'} in {fileName} with these
                columns. Name is always brought in; everything else is checked by default — uncheck
                anything you&apos;d rather leave out.
              </p>

              {pickable.length === 0 ? (
                <p className="text-[13px] text-[#7A8781]">
                  Just names in this file — nothing else to choose.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {pickable.map((col) => (
                    <label
                      key={col.header}
                      className="flex cursor-pointer items-center gap-2.5 text-[13.5px]"
                    >
                      <input
                        type="checkbox"
                        checked={!excluded.has(col.header)}
                        onChange={() => {
                          setExcluded((prev) => {
                            const next = new Set(prev);
                            if (next.has(col.header)) next.delete(col.header);
                            else next.add(col.header);
                            return next;
                          });
                        }}
                      />
                      {col.header}
                      {!col.field && (
                        <span className="text-[11.5px] text-[#98A29D]">custom field</span>
                      )}
                    </label>
                  ))}
                </div>
              )}
            </>
          )}

          {error && <p className="mt-3 text-[13px] text-[#B4432F]">{error}</p>}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={columns.length === 0 || importMembers.isPending}
            onClick={() => {
              const rows = buildMemberRowsFromCsv(dataLines, columns, excluded);
              if (rows.length === 0) {
                setError('No rows in that file had a name.');
                return;
              }
              importMembers.mutate({ rows });
            }}
          >
            {importMembers.isPending ? 'Importing…' : 'Import →'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
