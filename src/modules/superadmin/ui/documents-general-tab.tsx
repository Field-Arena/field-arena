'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/shadcn/table';
import { cn } from '@/shared/lib/utils';
import { formatTimestamp } from '@/shared/lib/format/date';
import type { CatalogDocument } from '@/modules/superadmin/types';
import { readFileAsBase64 } from '@/modules/superadmin/utils/read-file-as-base64';
import {
  useUploadDocument,
  useDeleteDocument,
} from '@/modules/superadmin/hooks/use-document-mutations';
import { ConfirmDeleteDocument } from '@/modules/superadmin/ui/confirm-delete-document';
import { DocumentsUpload } from '@/modules/superadmin/ui/documents-upload';

const HEAD =
  'bg-[#FBFCFD] px-5 py-[11px] text-[10px] font-bold uppercase tracking-[.08em] text-[#8A94A3]';
const LINK =
  'text-[13px] font-semibold text-[#101828] underline underline-offset-[3px] hover:text-[#146A47]';
const DEL = 'text-[13px] font-bold text-[#B42318] hover:text-[#B42318]';

export function DocumentsGeneralTab({ docs }: { docs: CatalogDocument[] }) {
  const upload = useUploadDocument();
  const remove = useDeleteDocument();

  const generalDocs = docs.filter((d) => d.folder === 'Documents');

  async function uploadFile(folder: string, name: string, file: File) {
    const { dataBase64, contentType } = await readFileAsBase64(file);
    upload.mutate({ folder, name, dataBase64, contentType });
  }

  return (
    <div className="space-y-5">
      <DocumentsUpload
        onFiles={(files) => {
          for (const file of Array.from(files)) void uploadFile('Documents', file.name, file);
        }}
      />
      <div className="overflow-hidden rounded-[14px] border border-[#E7EAEE] bg-white">
        <Table className="min-w-[820px] border-collapse">
          <TableHeader className="[&_tr]:border-0">
            <TableRow className="border-b-0 hover:bg-transparent">
              <TableHead className={cn('h-auto', HEAD, 'text-left')}>Name</TableHead>
              <TableHead className={cn('h-auto', HEAD, 'w-[220px] text-left')}>Uploaded</TableHead>
              <TableHead className={cn('h-auto', HEAD, 'w-[240px] text-right')}>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {generalDocs.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={3}
                  className="px-5 py-[42px] text-center text-[13.5px] whitespace-normal text-[#8A94A3]"
                >
                  No files uploaded yet.
                </TableCell>
              </TableRow>
            ) : (
              generalDocs.map((d, i) => (
                <TableRow
                  key={d.id}
                  className="border-b border-[#EEF1F4] last:border-b-0 hover:bg-transparent"
                  style={{ background: i % 2 ? '#FBFCFD' : '#FFFFFF' }}
                >
                  <TableCell className="px-5 py-3.5 text-[14px] whitespace-normal text-[#101828]">
                    {d.name}
                  </TableCell>
                  <TableCell className="px-4 py-3.5 text-[13.5px] whitespace-nowrap text-[#475467]">
                    {formatTimestamp(d.createdAt)}
                  </TableCell>
                  <TableCell className="px-5 py-3">
                    <div className="flex items-center justify-end gap-3.5">
                      {d.url && (
                        <a href={d.url} target="_blank" rel="noreferrer" className={LINK}>
                          View / Download
                        </a>
                      )}
                      <ConfirmDeleteDocument
                        fileName={d.name}
                        pending={remove.isPending}
                        className={`h-auto px-0 py-0 hover:bg-transparent ${DEL}`}
                        onConfirm={() => {
                          remove.mutate(d.id);
                        }}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
