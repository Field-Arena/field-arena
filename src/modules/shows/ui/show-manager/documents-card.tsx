'use client';

import { useRef, useState } from 'react';
import { Card } from '@/shared/ui/organizer/card';
import { PrimaryButton } from '@/shared/ui/organizer/buttons';
import { Button } from '@/shared/ui/shadcn/button';
import { Input } from '@/shared/ui/shadcn/input';
import { Label } from '@/shared/ui/shadcn/label';
import { formatTimestamp } from '@/shared/lib/format/date';
import {
  useUploadShowDocument,
  useRemoveShowDocument,
  useUpdateDocumentEvents,
} from '@/modules/shows/hooks/use-documents-mutations';
import type { ShowDocumentRow } from '@/modules/shows/data/setup-queries';
import { SM_CARD_PAD, SM_SECTION_HEAD, SM_NOTE } from '@/modules/shows/ui/show-manager/tokens';
import { SectionFooter } from '@/modules/shows/ui/show-manager/section-footer';

export function DocumentsCard({
  showId,
  documents,
  classes,
}: {
  showId: string;
  documents: ShowDocumentRow[];
  classes: { id: string; label: string }[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [openDocId, setOpenDocId] = useState<string | null>(null);
  const upload = useUploadShowDocument();
  const remove = useRemoveShowDocument();
  const assign = useUpdateDocumentEvents();

  function handleFiles(files: FileList) {
    for (const file of Array.from(files)) {
      upload.mutate({ showId, file });
    }
  }

  function toggleEvent(doc: ShowDocumentRow, classId: string) {
    const next = doc.eventIds.includes(classId)
      ? doc.eventIds.filter((id) => id !== classId)
      : [...doc.eventIds, classId];
    assign.mutate({ id: doc.id, showId, eventIds: next });
  }

  return (
    <>
      <Card className={SM_CARD_PAD}>
        <h2 className={SM_SECTION_HEAD}>Documents</h2>
        <p className={SM_NOTE}>
          Files this show publishes to competitors — prize lists, maps, forms. Attach a file to one
          or more classes to control where riders see it.
        </p>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Input
            ref={inputRef}
            type="file"
            accept="application/pdf,image/*"
            multiple
            className="hidden h-auto"
            onChange={(e) => {
              const files = e.target.files;
              if (files?.length) handleFiles(files);
              e.target.value = '';
            }}
          />
          <PrimaryButton
            disabled={upload.isPending}
            onClick={() => {
              inputRef.current?.click();
            }}
          >
            + Upload PDF
          </PrimaryButton>
        </div>

        {documents.length === 0 ? (
          <p className="text-[13px] text-[#98A29D] italic">No files published yet.</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {documents.map((doc) => {
              const open = openDocId === doc.id;
              return (
                <div key={doc.id} className="rounded-[10px] border border-[#E9EDEB]">
                  <div className="flex flex-wrap items-center gap-3.5 px-4 py-3">
                    <span className="text-ink-deep min-w-0 flex-1 truncate text-[13.5px] font-semibold">
                      {doc.name}
                    </span>
                    <span className="text-[12px] text-[#98A29D]">
                      {formatTimestamp(doc.createdAt)}
                    </span>
                    {doc.url && (
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-forest text-[13px] font-semibold underline underline-offset-2"
                      >
                        View
                      </a>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setOpenDocId(open ? null : doc.id);
                      }}
                      className="hover:text-forest h-auto px-0 py-0 text-[13px] font-semibold text-[#5A6B63] hover:bg-transparent"
                    >
                      {doc.eventIds.length > 0
                        ? `Attached to ${String(doc.eventIds.length)} ${doc.eventIds.length === 1 ? 'class' : 'classes'}`
                        : 'Attach to classes'}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        remove.mutate({ id: doc.id, showId });
                      }}
                      className="hover:text-status-danger h-auto px-0 py-0 text-[13px] font-semibold text-[#5A6B63] hover:bg-transparent"
                    >
                      Remove
                    </Button>
                  </div>
                  {open && (
                    <div className="border-t border-[#EEF2F0] bg-[#FBFCFB] px-4 py-3.5">
                      {classes.length === 0 ? (
                        <p className="text-[12.5px] text-[#98A29D] italic">
                          No classes on this show yet — pick some in Select Events first.
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-x-5 gap-y-2">
                          {classes.map((c) => (
                            <Label
                              key={c.id}
                              className="inline-flex items-center gap-[7px] text-[13px] text-[#48574F]"
                            >
                              <input
                                type="checkbox"
                                checked={doc.eventIds.includes(c.id)}
                                className="size-3.5 accent-[#1A5B3C]"
                                onChange={() => {
                                  toggleEvent(doc, c.id);
                                }}
                              />
                              {c.label}
                            </Label>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <SectionFooter currentTab="Documents" showId={showId} />
    </>
  );
}
