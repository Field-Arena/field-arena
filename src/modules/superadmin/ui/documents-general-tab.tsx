'use client';

import { Button } from '@/shared/ui/shadcn/button';
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
import { DocumentsUpload } from '@/modules/superadmin/ui/documents-upload';

const HEAD =
  'bg-[#F6F0E2] px-5 py-[11px] text-[10px] font-bold uppercase tracking-[0.14em] text-fa-muted-2';
const LINK =
  'text-[13px] font-semibold text-[#16261F] underline underline-offset-[3px] hover:text-gold';
const DEL = 'text-[13px] font-bold text-[#B4432F] hover:text-[#8E3627]';

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
      <div className="overflow-hidden rounded-[14px] border border-[#E2E8E4] bg-white">
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
                  className="text-fa-muted-2 px-5 py-[42px] text-center text-[13.5px] whitespace-normal"
                >
                  No files uploaded yet.
                </TableCell>
              </TableRow>
            ) : (
              generalDocs.map((d, i) => (
                <TableRow
                  key={d.id}
                  className="border-b border-[#EEF2EF] last:border-b-0 hover:bg-transparent"
                  style={{ background: i % 2 ? '#FBF7EC' : '#FFFFFF' }}
                >
                  <TableCell className="px-5 py-3.5 text-[14px] whitespace-normal text-[#16261F]">
                    {d.name}
                  </TableCell>
                  <TableCell className="px-4 py-3.5 text-[13.5px] whitespace-nowrap text-[#5A6B63]">
                    {formatTimestamp(d.createdAt)}
                  </TableCell>
                  <TableCell className="px-5 py-3">
                    <div className="flex items-center justify-end gap-3.5">
                      {d.url && (
                        <a href={d.url} target="_blank" rel="noreferrer" className={LINK}>
                          View / Download
                        </a>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        className={`h-auto px-0 py-0 hover:bg-transparent ${DEL}`}
                        onClick={() => {
                          remove.mutate(d.id);
                        }}
                      >
                        Delete
                      </Button>
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
