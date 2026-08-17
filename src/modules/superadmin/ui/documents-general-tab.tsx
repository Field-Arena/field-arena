'use client';

import { useRef, useState } from 'react';
import { UploadIcon } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { formatTimestamp } from '@/shared/lib/format/date';
import type { CatalogDocument } from '../types';
import { readFileAsBase64 } from '../utils';
import { useUploadDocument, useDeleteDocument } from '../hooks/use-document-mutations';

const HEAD = 'bg-[#F6F0E2] px-5 py-[11px] text-[10px] font-bold uppercase tracking-[0.14em] text-fa-muted-2';
const LINK = 'text-[13px] font-semibold text-[#16261F] underline underline-offset-[3px] hover:text-gold';
const DEL = 'text-[13px] font-bold text-[#B4432F] hover:text-[#8E3627]';

/**
 * The Documents board's "Documents" tab: everything that isn't an official test
 * sheet PDF — waivers, glossaries, agreements. Extracted from DocumentsBoard,
 * which now only owns which tab is active.
 */
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
        <table className="w-full min-w-[820px] border-collapse">
          <thead>
            <tr>
              <th className={cn(HEAD, 'text-left')}>Name</th>
              <th className={cn(HEAD, 'w-[220px] text-left')}>Uploaded</th>
              <th className={cn(HEAD, 'w-[240px] text-right')}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {generalDocs.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-5 py-[42px] text-center text-[13.5px] text-fa-muted-2">
                  No files uploaded yet.
                </td>
              </tr>
            ) : (
              generalDocs.map((d, i) => (
                <tr key={d.id} className="border-b border-[#EEF2EF] last:border-b-0" style={{ background: i % 2 ? '#FBF7EC' : '#FFFFFF' }}>
                  <td className="px-5 py-3.5 text-[14px] text-[#16261F]">{d.name}</td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-[13.5px] text-[#5A6B63]">
                    {formatTimestamp(d.createdAt)}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-3.5">
                      {d.url && (
                        <a href={d.url} target="_blank" rel="noreferrer" className={LINK}>
                          View / Download
                        </a>
                      )}
                      <button type="button" className={DEL} onClick={() => { remove.mutate(d.id); }}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DocumentsUpload({ onFiles }: { onFiles: (files: FileList) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [label, setLabel] = useState('No file chosen');
  return (
    <div className="flex flex-wrap items-center gap-4">
      <input
        ref={ref}
        type="file"
        accept="application/pdf,image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = e.target.files;
          if (files?.length) {
            setLabel(files.length === 1 ? (files[0]?.name ?? '1 file') : `${String(files.length)} files`);
            onFiles(files);
          }
          e.target.value = '';
        }}
      />
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="inline-flex items-center rounded-[7px] border border-[#D7CFBB] bg-white px-3.5 py-2 text-[13px] font-semibold text-[#16261F]"
      >
        Choose files
      </button>
      <span className="text-[13px] text-[#9AA6A0]">{label}</span>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="inline-flex items-center gap-1.5 rounded-[9px] bg-[#17402F] px-5 py-2.5 text-[13.5px] font-bold text-paper transition hover:bg-gold hover:text-hunter-deep"
      >
        <UploadIcon className="size-[14px]" aria-hidden />
        Upload
      </button>
    </div>
  );
}
