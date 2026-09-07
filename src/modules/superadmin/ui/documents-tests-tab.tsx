'use client';

import { useState } from 'react';
import { CheckIcon } from 'lucide-react';
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
import type { CatalogDocument, TestSheetItem } from '@/modules/superadmin/types';
import { findCatalogMatch } from '@/modules/superadmin/utils/find-catalog-match';
import { readFileAsBase64 } from '@/modules/superadmin/utils/read-file-as-base64';
import {
  useUploadDocument,
  useDeleteDocument,
  useMoveDocument,
  useMoveDocuments,
  useRematchDocuments,
} from '@/modules/superadmin/hooks/use-document-mutations';
import { ConfirmDeleteDocument } from '@/modules/superadmin/ui/confirm-delete-document';
import { StatusPill } from '@/modules/superadmin/ui/documents-tests-status-pill';
import { RowUpload } from '@/modules/superadmin/ui/documents-tests-row-upload';
import { BulkDrop } from '@/modules/superadmin/ui/documents-tests-bulk-drop';

const HEAD =
  'bg-[#F6F0E2] px-5 py-[11px] text-[10px] font-bold uppercase tracking-[0.14em] text-fa-muted-2';
const LINK =
  'text-[13px] font-semibold text-[#16261F] underline underline-offset-[3px] hover:text-gold';
const DEL = 'text-[13px] font-bold text-[#B4432F] hover:text-[#8E3627]';

export function DocumentsTestsTab({
  testSheets,
  docs,
}: {
  testSheets: TestSheetItem[];
  docs: CatalogDocument[];
}) {
  const [onlyMissing, setOnlyMissing] = useState(false);
  const [bulkSummary, setBulkSummary] = useState<string | null>(null);

  const upload = useUploadDocument();
  const remove = useDeleteDocument();
  const move = useMoveDocument();
  const moveMany = useMoveDocuments();
  const rematch = useRematchDocuments();

  const testDocs = docs.filter((d) => d.folder === 'Tests');
  const docByName = new Map(testDocs.map((d) => [d.name, d] as const));
  const matchedNames = new Set(testSheets.map((s) => s.sourceFile));
  const unmatched = testDocs.filter((d) => !matchedNames.has(d.name));
  const uploadedCount = testSheets.filter((s) => docByName.has(s.sourceFile)).length;

  // An unmatched upload can become matchable after the fact — the catalog
  // gains the sheet, or the matcher improves. Those are fixable in place by
  // renaming the row; the rest genuinely aren't tests and belong in Documents.
  const rematchable = unmatched
    .map((d) => ({ doc: d, hit: findCatalogMatch(d.name, testSheets) }))
    .filter((row): row is { doc: CatalogDocument; hit: TestSheetItem } => row.hit !== null);
  const trulyUnmatched = unmatched.filter((d) => findCatalogMatch(d.name, testSheets) === null);

  const rows = onlyMissing ? testSheets.filter((s) => !docByName.has(s.sourceFile)) : testSheets;

  async function uploadFile(folder: string, name: string, file: File) {
    const { dataBase64, contentType } = await readFileAsBase64(file);
    upload.mutate({ folder, name, dataBase64, contentType });
  }

  async function bulkTests(files: FileList) {
    const list = Array.from(files);
    let matched = 0;
    let unmatchedCount = 0;

    for (const file of list) {
      // Title, then source file, then a substring fallback — a real downloaded
      // PDF rarely carries the catalog's own stub filename.
      const hit = findCatalogMatch(file.name, testSheets);
      await uploadFile('Tests', hit ? hit.sourceFile : file.name, file);
      if (hit) matched += 1;
      else unmatchedCount += 1;
    }

    // Legacy summarised the whole batch in one line — with dozens of files a
    // per-file toast says nothing about what actually landed.
    setBulkSummary(
      `${String(matched)} matched to a test, ${String(unmatchedCount)} uploaded unmatched.`,
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-[13.5px] text-[#5A6B63]">
          {uploadedCount} of {testSheets.length} official test sheet
          {testSheets.length === 1 ? '' : 's'} uploaded.
        </span>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setOnlyMissing((v) => !v);
          }}
          className="inline-flex h-auto items-center gap-2.5 px-0 py-0 text-[13.5px] text-[#16261F] hover:bg-transparent"
        >
          <span
            className="grid size-[17px] place-items-center rounded border"
            style={{
              borderColor: onlyMissing ? '#0D2C23' : '#C7D6CE',
              background: onlyMissing ? '#0D2C23' : '#FFFFFF',
            }}
          >
            {onlyMissing && <CheckIcon className="text-gold size-3" aria-hidden />}
          </span>
          Show only missing
        </Button>
      </div>

      <BulkDrop
        onFiles={(files) => {
          setBulkSummary(null);
          void bulkTests(files);
        }}
      />
      {bulkSummary && (
        <p className="text-fa-muted text-[13px]" role="status">
          {bulkSummary}
        </p>
      )}

      <div className="overflow-hidden rounded-[14px] border border-[#E2E8E4] bg-white">
        <Table className="min-w-[900px] border-collapse">
          <TableHeader className="[&_tr]:border-0">
            <TableRow className="border-b-0 hover:bg-transparent">
              <TableHead className={cn('h-auto', HEAD, 'text-left')}>Test</TableHead>
              <TableHead className={cn('h-auto', HEAD, 'w-[170px] text-left')}>Level</TableHead>
              <TableHead className={cn('h-auto', HEAD, 'w-[200px] text-left')}>Status</TableHead>
              <TableHead className={cn('h-auto', HEAD, 'w-[280px] text-right')}>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={4}
                  className="text-fa-muted-2 px-5 py-[42px] text-center text-[13.5px] whitespace-normal"
                >
                  {onlyMissing ? 'Every test sheet has a file. 🎉' : 'No test sheets yet.'}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((sheet, i) => {
                const doc = docByName.get(sheet.sourceFile);
                return (
                  <TableRow
                    key={sheet.id}
                    className="border-b border-[#EEF2EF] last:border-b-0 hover:bg-transparent"
                    style={{ background: i % 2 ? '#FBF7EC' : '#FFFFFF' }}
                  >
                    <TableCell className="px-5 py-3 text-[14px] whitespace-normal text-[#16261F]">
                      {sheet.title}
                      {!sheet.hasDeclaredSourceFile && (
                        <span className="text-fa-muted-2 mt-0.5 block text-[11.5px]">
                          No source filename set — an upload here is stored as{' '}
                          <code>{sheet.sourceFile}</code>
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-[13.5px] whitespace-nowrap text-[#5A6B63]">
                      {sheet.level ?? '—'}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {doc ? (
                        <StatusPill
                          tone="ok"
                          label={`Uploaded ${formatTimestamp(doc.createdAt)}`}
                        />
                      ) : (
                        <StatusPill tone="warn" label="Missing" />
                      )}
                    </TableCell>
                    <TableCell className="px-5 py-3">
                      <div className="flex items-center justify-end gap-3.5">
                        {doc ? (
                          <>
                            {doc.url && (
                              <a href={doc.url} target="_blank" rel="noreferrer" className={LINK}>
                                View / Download
                              </a>
                            )}
                            <ConfirmDeleteDocument
                              fileName={doc.name}
                              pending={remove.isPending}
                              className={`h-auto px-0 py-0 hover:bg-transparent ${DEL}`}
                              onConfirm={() => {
                                remove.mutate(doc.id);
                              }}
                            />
                          </>
                        ) : (
                          <RowUpload
                            onFile={(file) => {
                              void uploadFile('Tests', sheet.sourceFile, file);
                            }}
                          />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {unmatched.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-[family-name:var(--font-nr)] text-[20px] font-semibold text-[#16261F]">
            Unmatched uploads ({unmatched.length})
          </h2>
          <p className="max-w-[900px] text-[13.5px] leading-[1.6] text-[#5A6B63]">
            These uploaded fine, but their filename didn&apos;t match any test in the Scoring
            Catalog, so they won&apos;t show a file against one there. If a file genuinely
            isn&apos;t a test — a waiver, glossary, agreement — move it to the Documents folder
            instead.
            {rematchable.length > 0 &&
              ' Some now match a real test since the catalog or matcher was updated — fix them in place below, no re-upload needed.'}
          </p>

          <div className="flex flex-wrap gap-2.5">
            {rematchable.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                disabled={rematch.isPending}
                onClick={() => {
                  rematch.mutate(
                    rematchable.map(({ doc, hit }) => ({ id: doc.id, name: hit.sourceFile })),
                  );
                }}
                className="text-hunter-deep hover:border-gold h-auto rounded-lg border border-[#C4D3CB] bg-white px-3.5 py-2 text-[12.5px] font-bold transition-colors hover:bg-[#FFFCF2]"
              >
                {rematch.isPending
                  ? 'Matching…'
                  : `Try to match again (${String(rematchable.length)})`}
              </Button>
            )}
            {trulyUnmatched.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                disabled={moveMany.isPending}
                onClick={() => {
                  moveMany.mutate({
                    ids: trulyUnmatched.map((d) => d.id),
                    folder: 'Documents',
                  });
                }}
                className="text-hunter-deep hover:border-gold h-auto rounded-lg border border-[#C4D3CB] bg-white px-3.5 py-2 text-[12.5px] font-bold transition-colors hover:bg-[#FFFCF2]"
              >
                {moveMany.isPending
                  ? 'Moving…'
                  : `Move all ${String(trulyUnmatched.length)} non-matching to Documents`}
              </Button>
            )}
          </div>
          <div className="overflow-hidden rounded-[14px] border border-[#E2E8E4] bg-white">
            <Table className="min-w-[720px] border-collapse">
              <TableHeader className="[&_tr]:border-0">
                <TableRow className="border-b-0 hover:bg-transparent">
                  <TableHead className={cn('h-auto', HEAD, 'text-left')}>File</TableHead>
                  <TableHead className={cn('h-auto', HEAD, 'w-[220px] text-left')}>
                    Uploaded
                  </TableHead>
                  <TableHead className={cn('h-auto', HEAD, 'w-[340px] text-right')}>
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unmatched.map((d, i) => (
                  <TableRow
                    key={d.id}
                    className="border-b border-[#EEF2EF] last:border-b-0 hover:bg-transparent"
                    style={{ background: i % 2 ? '#FBF7EC' : '#FFFFFF' }}
                  >
                    <TableCell className="px-5 py-3 text-[14px] whitespace-normal text-[#16261F]">
                      {d.name}
                      {(() => {
                        const hit = findCatalogMatch(d.name, testSheets);
                        if (!hit) return null;
                        return (
                          <span className="ml-2 inline-flex h-[19px] items-center rounded-full bg-[#E6F1EA] px-2 text-[10.5px] font-bold text-[#2E7048]">
                            Now matches {hit.title}
                          </span>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-[13.5px] whitespace-nowrap text-[#5A6B63]">
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
                          className="hover:text-gold h-auto px-0 py-0 text-[13px] font-semibold text-[#5A6B63] hover:bg-transparent"
                          onClick={() => {
                            move.mutate({ id: d.id, folder: 'Documents' });
                          }}
                        >
                          Move to Documents
                        </Button>
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
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
