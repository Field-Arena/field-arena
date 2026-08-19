'use client';

import { ghostButtonClass } from '@/shared/ui/organizer/buttons';
import { IconFile } from '@/shared/ui/organizer/icons';
import { buildStaffCsv, staffCsvFilename, splitName } from '../utils';
import type { UserDirectoryRow } from '../types';

export function ExportStaffListButton({
  rows,
  showName,
}: {
  rows: UserDirectoryRow[];
  showName: string;
}) {
  return (
    <button
      type="button"
      className={ghostButtonClass}
      onClick={() => {
        const csv = buildStaffCsv(
          rows.map((r) => {
            const { first, last } = splitName(r.name);
            return {
              firstName: first,
              lastName: last,
              role: r.role,
              phone: r.phone,
              email: r.email,
            };
          }),
        );
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = staffCsvFilename(showName);
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }}
    >
      <IconFile size={14} /> Export Staff List
    </button>
  );
}
