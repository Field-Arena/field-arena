'use client';

import { useRef, useState } from 'react';
import { CheckIcon, UploadIcon } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { formatTimestamp } from '@/shared/lib/format/date';
import type { CatalogDocument } from '../data/queries';
import {
  useUploadDocument,
  useDeleteDocument,
  useMoveDocument,
} from '../hooks/use-document-mutations';

const HEAD = 'bg-[#F6F0E2] px-5 py-[11px] text-[10px] font-bold uppercase tracking-[0.14em] text-fa-muted-2';
const LINK = 'text-[13px] font-semibold text-[#16261F] underline underline-offset-[3px] hover:text-gold';
const DEL = 'text-[13px] font-bold text-[#B4432F] hover:text-[#8E3627]';

export interface TestSheetItem {
  id: string;
  title: string;
  level: string | null;
  sourceFile: string;
}

/** Strips extension, years, and punctuation so bulk uploads match by filename. */
function norm(s: string): string {
  return s
    .replace(/\.[^.]+$/, '')
    .replace(/(19|20)\d{2}/g, '')
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase();
}

function readFile(file: File): Promise<{ dataBase64: string; contentType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      resolve({ dataBase64: result.split(',')[1] ?? '', contentType: file.type || 'application/pdf' });
    };
    reader.onerror = () => {
      reject(new Error('Could not read the file'));
    };
    reader.readAsDataURL(file);
  });
}

/**
 * The platform file store, matching the Admin Console design: a Tests tab that
 * matches uploads to catalog sheets by filename, and a Documents tab for
 * everything else. Uploads/downloads/deletes hit Supabase Storage.
 */
export function DocumentsBoard({
  testSheets,
  docs,
}: {
  testSheets: TestSheetItem[];
  docs: CatalogDocument[];
}) {
  const [tab, setTab] = useState<'tests' | 'documents'>('tests');
  const [onlyMissing, setOnlyMissing] = useState(false);

  const upload = useUploadDocument();
  const remove = useDeleteDocument();
  const move = useMoveDocument();

  const testDocs = docs.filter((d) => d.folder === 'Tests');
  const docByName = new Map(testDocs.map((d) => [d.name, d] as const));
  const matchedNames = new Set(testSheets.map((s) => s.sourceFile));
  const unmatched = testDocs.filter((d) => !matchedNames.has(d.name));
  const generalDocs = docs.filter((d) => d.folder === 'Documents');
  const uploadedCount = testSheets.filter((s) => docByName.has(s.sourceFile)).length;

  const rows = onlyMissing ? testSheets.filter((s) => !docByName.has(s.sourceFile)) : testSheets;

  async function uploadFile(folder: string, name: string, file: File) {
    const { dataBase64, contentType } = await readFile(file);
    upload.mutate({ folder, name, dataBase64, contentType });
  }

  async function bulkTests(files: FileList) {
    for (const file of Array.from(files)) {
      const hit = testSheets.find((s) => norm(s.sourceFile) === norm(file.name));
      await uploadFile('Tests', hit ? hit.sourceFile : file.name, file);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2.5">
        {(['tests', 'documents'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setTab(t);
            }}
            className={cn(
              'rounded-full border px-5 py-2 text-[13.5px] font-semibold transition-colors',
              tab === t
                ? 'border-hunter-deep bg-hunter-deep text-paper'
                : 'border-[#D7E0DA] bg-white text-[#5A6B63] hover:border-hunter-deep'
            )}
          >
            {t === 'tests' ? 'Tests' : 'Documents'}
          </button>
        ))}
      </div>

      {tab === 'tests' ? (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-[13.5px] text-[#5A6B63]">
              {uploadedCount} of {testSheets.length} official test sheet
              {testSheets.length === 1 ? '' : 's'} uploaded.
            </span>
            <button
              type="button"
              onClick={() => {
                setOnlyMissing((v) => !v);
              }}
              className="inline-flex items-center gap-2.5 text-[13.5px] text-[#16261F]"
            >
              <span
                className="grid size-[17px] place-items-center rounded border"
                style={{
                  borderColor: onlyMissing ? '#0D2C23' : '#C7D6CE',
                  background: onlyMissing ? '#0D2C23' : '#FFFFFF',
                }}
              >
                {onlyMissing && <CheckIcon className="size-3 text-gold" aria-hidden />}
              </span>
              Show only missing
            </button>
          </div>

          <BulkDrop
            onFiles={(files) => {
              void bulkTests(files);
            }}
          />

          <div className="overflow-hidden rounded-[14px] border border-[#E2E8E4] bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse">
                <thead>
                  <tr>
                    <th className={cn(HEAD, 'text-left')}>Test</th>
                    <th className={cn(HEAD, 'w-[170px] text-left')}>Level</th>
                    <th className={cn(HEAD, 'w-[200px] text-left')}>Status</th>
                    <th className={cn(HEAD, 'w-[280px] text-right')}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-[42px] text-center text-[13.5px] text-fa-muted-2">
                        {onlyMissing ? 'Every test sheet has a file. 🎉' : 'No test sheets yet.'}
                      </td>
                    </tr>
                  ) : (
                    rows.map((sheet, i) => {
                      const doc = docByName.get(sheet.sourceFile);
                      return (
                        <tr
                          key={sheet.id}
                          className="border-b border-[#EEF2EF] last:border-b-0"
                          style={{ background: i % 2 ? '#FBF7EC' : '#FFFFFF' }}
                        >
                          <td className="px-5 py-3 text-[14px] text-[#16261F]">{sheet.title}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-[13.5px] text-[#5A6B63]">
                            {sheet.level ?? '—'}
                          </td>
                          <td className="px-4 py-3">
                            {doc ? (
                              <StatusPill tone="ok" label={`Uploaded ${formatTimestamp(doc.createdAt)}`} />
                            ) : (
                              <StatusPill tone="warn" label="Missing" />
                            )}
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center justify-end gap-3.5">
                              {doc ? (
                                <>
                                  {doc.url && (
                                    <a href={doc.url} target="_blank" rel="noreferrer" className={LINK}>
                                      View / Download
                                    </a>
                                  )}
                                  <button type="button" className={DEL} onClick={() => { remove.mutate(doc.id); }}>
                                    Delete
                                  </button>
                                </>
                              ) : (
                                <RowUpload
                                  onFile={(file) => {
                                    void uploadFile('Tests', sheet.sourceFile, file);
                                  }}
                                />
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {unmatched.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-[family-name:var(--font-nr)] text-[20px] font-semibold text-[#16261F]">
                Unmatched uploads ({unmatched.length})
              </h2>
              <p className="max-w-[900px] text-[13.5px] leading-[1.6] text-[#5A6B63]">
                These uploaded fine, but their filename didn&apos;t match any test in the Scoring
                Catalog. If one genuinely isn&apos;t a test, move it to the Documents folder.
              </p>
              <div className="overflow-hidden rounded-[14px] border border-[#E2E8E4] bg-white">
                <table className="w-full min-w-[720px] border-collapse">
                  <thead>
                    <tr>
                      <th className={cn(HEAD, 'text-left')}>File</th>
                      <th className={cn(HEAD, 'w-[220px] text-left')}>Uploaded</th>
                      <th className={cn(HEAD, 'w-[340px] text-right')}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unmatched.map((d, i) => (
                      <tr key={d.id} className="border-b border-[#EEF2EF] last:border-b-0" style={{ background: i % 2 ? '#FBF7EC' : '#FFFFFF' }}>
                        <td className="px-5 py-3 text-[14px] text-[#16261F]">{d.name}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-[13.5px] text-[#5A6B63]">
                          {formatTimestamp(d.createdAt)}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-3.5">
                            {d.url && (
                              <a href={d.url} target="_blank" rel="noreferrer" className={LINK}>
                                View / Download
                              </a>
                            )}
                            <button type="button" className="text-[13px] font-semibold text-[#5A6B63] hover:text-gold" onClick={() => { move.mutate({ id: d.id, folder: 'Documents' }); }}>
                              Move to Documents
                            </button>
                            <button type="button" className={DEL} onClick={() => { remove.mutate(d.id); }}>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
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
      )}
    </div>
  );
}

function StatusPill({ tone, label }: { tone: 'ok' | 'warn'; label: string }) {
  const c =
    tone === 'ok'
      ? { bg: '#E4F0E8', fg: '#2E7048', dot: '#3E8E5A' }
      : { bg: '#FBF0D4', fg: '#8A6D14', dot: '#C9A227' };
  return (
    <span
      className="inline-flex h-6 items-center gap-[7px] whitespace-nowrap rounded-full px-2.5 text-[11.5px] font-bold"
      style={{ background: c.bg, color: c.fg }}
    >
      <span className="size-1.5 rounded-full" style={{ background: c.dot }} aria-hidden />
      {label}
    </span>
  );
}

function RowUpload({ onFile }: { onFile: (file: File) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept="application/pdf,image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = '';
        }}
      />
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#8A6D14] hover:text-gold"
      >
        <UploadIcon className="size-[13px]" aria-hidden />
        Upload
      </button>
    </>
  );
}

function BulkDrop({ onFiles }: { onFiles: (files: FileList) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  return (
    <button
      type="button"
      onClick={() => ref.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => {
        setOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        if (e.dataTransfer.files.length) onFiles(e.dataTransfer.files);
      }}
      className={cn(
        'flex w-full flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-[30px] transition-colors',
        over ? 'border-gold bg-[#FCFAF4]' : 'border-[#C9B98A] hover:border-gold hover:bg-[#FCFAF4]'
      )}
    >
      <input
        ref={ref}
        type="file"
        accept="application/pdf"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) onFiles(e.target.files);
          e.target.value = '';
        }}
      />
      <span className="text-center text-[14px] text-[#5A6B63]">
        Drag and drop test sheet PDFs here — each is matched to its test automatically by filename.
      </span>
      <span className="inline-flex items-center gap-2 rounded-lg border border-[#D7CFBB] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#16261F]">
        Choose files
      </span>
    </button>
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
