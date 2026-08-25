'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/shadcn/dialog';
import { Button } from '@/shared/ui/shadcn/button';
import { Input } from '@/shared/ui/shadcn/input';
import { useMemberImport } from '@/modules/organizations/hooks/use-member-import';

export function MemberImportDialog({ onClose }: { onClose: () => void }) {
  const {
    columns,
    fileName,
    error,
    excluded,
    pickable,
    rowCount,
    loadFile,
    toggleExcluded,
    submit,
    isPending,
  } = useMemberImport({ onSuccess: onClose });

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="text-hunter-deep font-serif text-xl">Upload a list</DialogTitle>
          <DialogDescription>
            A CSV with a header row. First name, Last name, Type, Phone, Email and Notes are
            recognised — any other column is kept against each person as an extra field.
          </DialogDescription>
        </DialogHeader>

        <div className="my-4">
          {columns.length === 0 ? (
            <Input
              type="file"
              accept=".csv,text/csv"
              className="h-auto text-[13px]"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                loadFile(file);
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
                          toggleExcluded(col.header);
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
          <Button type="button" disabled={columns.length === 0 || isPending} onClick={submit}>
            {isPending ? 'Importing…' : 'Import →'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
