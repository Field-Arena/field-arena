'use client';

import { useRef, useState } from 'react';
import { Loader2Icon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/shadcn/dialog';
import { Button } from '@/shared/ui/shadcn/button';
import { ghostButtonClass } from '@/shared/ui/organizer/buttons';
import { IconUpload } from '@/shared/ui/organizer/icons';
import { parseStaffCsv } from '../utils';
import { useImportStaffList } from '../hooks/use-user-directory-mutations';

const TEMPLATE_CSV =
  'First name,Last name,Role,Phone,Email\nJane,Smith,Judge,(555) 123-4567,jane@example.com\n';

export function UploadStaffListDialog({ showId, showName }: { showId: string; showName: string }) {
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [rows, setRows] = useState<ReturnType<typeof parseStaffCsv>>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const importList = useImportStaffList({
    onSuccess: () => {
      setOpen(false);
      setFileName(null);
      setRows([]);
      if (inputRef.current) inputRef.current.value = '';
    },
  });

  function handleFile(file: File) {
    setParseError(null);
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setParseError("Excel files aren't supported yet — save as CSV and upload that instead.");
      setFileName(null);
      setRows([]);
      return;
    }
    setFileName(file.name);
    void file.text().then((text) => {
      const parsed = parseStaffCsv(text);
      if (parsed.length === 0) {
        setParseError('No rows with an email address were found in that file.');
      }
      setRows(parsed);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" className={ghostButtonClass}>
          <IconUpload size={14} /> Upload Staff List
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-hunter-deep font-serif text-xl">
            Upload staff list
          </DialogTitle>
          <DialogDescription>
            A CSV with a row per person for {showName} — First name, Last name, Role (Show Admin,
            Judge, Scribe, ShowStaff, Vendor, or Announcer), Phone, and Email. Each new address gets
            a real invite email. Anyone already on this show (matched by email) is skipped.
          </DialogDescription>
        </DialogHeader>

        <a
          href={`data:text/csv;charset=utf-8,${encodeURIComponent(TEMPLATE_CSV)}`}
          download="field-and-arena-staff-template.csv"
          className="text-forest text-[12.5px] font-semibold underline"
        >
          ⤓ Download CSV template
        </a>

        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="text-[12.5px]"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
          aria-label="Staff list CSV file"
        />

        {fileName && !parseError && (
          <p className="text-[12.5px] text-[#7A8781]">Selected: {fileName}</p>
        )}
        {parseError && (
          <p role="alert" className="text-status-danger text-[13px]">
            {parseError}
          </p>
        )}
        {rows.length > 0 && !parseError && (
          <p className="text-[13px] text-[#5A6B63]">
            {rows.length} {rows.length === 1 ? 'row' : 'rows'} ready to import.
          </p>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setOpen(false);
            }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={rows.length === 0 || importList.isPending}
            onClick={() => {
              importList.mutate({ showId, rows });
            }}
          >
            {importList.isPending && <Loader2Icon className="animate-spin" aria-hidden />}
            {importList.isPending
              ? 'Importing…'
              : `Import ${rows.length ? String(rows.length) : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
