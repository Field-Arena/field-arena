'use client';

import { useRef, useState } from 'react';
import { UploadIcon, XIcon } from 'lucide-react';
import { Card } from '@/shared/ui/organizer/card';
import { PrimaryButton, GhostButton } from '@/shared/ui/organizer/buttons';
import { IconCheck } from '@/shared/ui/organizer/icons';
import { Textarea } from '@/shared/ui/shadcn/textarea';
import {
  useSaveWaiverText,
  useApproveWaiver,
  useUploadWaiverDocument,
  useRemoveWaiverDocument,
} from '@/modules/shows/hooks/use-show-mutations';
import { SM_CARD_PAD, SM_SECTION_HEAD, SM_NOTE } from '@/modules/shows/ui/show-manager/tokens';

export function WaiverCard({
  showId,
  waiverText,
  waiverApprovedText,
  waiverDocumentUrl,
  waiverDocumentName,
}: {
  showId: string;
  waiverText: string | null;
  waiverApprovedText: string | null;
  waiverDocumentUrl: string | null;
  waiverDocumentName: string | null;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState(waiverText ?? '');
  const upload = useUploadWaiverDocument({
    onSuccess: ({ extractedText }) => {
      if (extractedText) setText(extractedText);
    },
  });
  const remove = useRemoveWaiverDocument();
  const [approvedText, setApprovedText] = useState(waiverApprovedText);
  const { mutate: save, isPending: saving } = useSaveWaiverText();
  const { mutate: approve, isPending: approving } = useApproveWaiver({
    onSuccess: () => {
      setApprovedText(text);
    },
  });

  const approved = !!approvedText && approvedText === text;

  return (
    <Card className={SM_CARD_PAD}>
      <h2 className={SM_SECTION_HEAD}>Waiver of Liability</h2>
      <p className={SM_NOTE}>
        The text riders must scroll through and sign before entering. Use {'{{SHOW_NAME}}'},{' '}
        {'{{SHOW_DATES}}'}, and {'{{ORGANIZER_NAME}}'} as placeholders — they&rsquo;re filled in
        automatically. Pre-filled with a default draft below — edit it, replace it with your own, or
        leave it as-is. This is not legal advice — have your waiver reviewed by an attorney before
        relying on it.
      </p>

      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-[8px] bg-[#F6F8F6] p-3">
        <span className="text-[13px] font-semibold text-[#3D4A44]">
          Attached document (e.g. the full USEF form)
        </span>
        {waiverDocumentUrl && waiverDocumentName ? (
          <>
            <a
              href={waiverDocumentUrl}
              target="_blank"
              rel="noreferrer"
              className="text-forest text-[13px] font-semibold underline underline-offset-2"
            >
              {waiverDocumentName}
            </a>
            <GhostButton
              disabled={remove.isPending}
              onClick={() => {
                remove.mutate(showId);
              }}
            >
              <XIcon className="size-3.5" aria-hidden />
              {remove.isPending ? 'Removing…' : 'Remove'}
            </GhostButton>
          </>
        ) : (
          <span className="text-[13px] text-[#7A8781] italic">None uploaded yet</span>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,.docx,.txt,image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload.mutate({ showId, file });
            e.target.value = '';
          }}
        />
        <GhostButton
          className="ml-auto"
          disabled={upload.isPending}
          onClick={() => {
            fileInputRef.current?.click();
          }}
        >
          <UploadIcon className="size-3.5" aria-hidden />
          {upload.isPending ? 'Uploading…' : waiverDocumentUrl ? 'Replace file' : 'Upload file'}
        </GhostButton>
      </div>
      <p className={SM_NOTE + ' mb-4'}>
        Can&rsquo;t paste a long formatted document (like a USEF form) into the text box below and
        keep it readable? Upload a PDF, Word (.docx), or .txt file instead — its text fills the
        box below automatically, and riders will also see a link to the original file alongside
        the typed text when they sign. A scanned or photographed document has no text to pull
        from, so it will attach but won&rsquo;t fill the box.
      </p>

      <div className={`mb-3 text-sm ${approved ? 'text-[#2E7048]' : 'text-status-danger'}`}>
        {approved ? 'Approved' : 'Not yet approved — required before Go Live'}
      </div>

      <Textarea
        value={text}
        rows={8}
        spellCheck={false}
        className="text-ink-deep focus-visible:border-gold w-full resize-y rounded-[6px] border border-[#AEB8B3] bg-white px-3.5 py-3 font-sans text-[13px] leading-[1.6] outline-none"
        onChange={(e) => {
          setText(e.target.value);
        }}
      />

      <div className="mt-3.5 flex flex-wrap items-center gap-3">
        <PrimaryButton
          className="rounded-[9px]"
          disabled={saving}
          onClick={() => {
            save({ showId, waiverText: text });
          }}
        >
          {saving ? 'Saving…' : 'Save waiver text'}
        </PrimaryButton>
        <GhostButton
          disabled={approving}
          onClick={() => {
            approve({ showId, waiverText: text });
          }}
        >
          {approving ? 'Approving…' : 'Approve this waiver'}
        </GhostButton>
        {approved && (
          <span className="inline-flex items-center gap-[7px] text-[13.5px] font-semibold text-[#1A5B3C]">
            <IconCheck size={15} strokeWidth={2.6} />
            Saved
          </span>
        )}
      </div>
    </Card>
  );
}
