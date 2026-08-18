'use client';

import { useState } from 'react';
import { Card } from '@/shared/ui/organizer/card';
import { PrimaryButton, GhostButton } from '@/shared/ui/organizer/buttons';
import { IconCheck } from '@/shared/ui/organizer/icons';
import { useSaveWaiverText, useApproveWaiver } from '@/modules/shows/hooks/use-show-mutations';
import { WAIVER_TEXT_DEFAULT } from '@/modules/shows/schemas';
import { SM_CARD_PAD, SM_SECTION_HEAD, SM_NOTE } from '@/modules/shows/ui/show-manager/tokens';

/**
 * "Waiver of Liability" — the one field setShowPublished already gates
 * Go Live on (waiver_approved_text === waiver_text). Approve sends the
 * textarea's current value, not a re-read of the saved row, so it can never
 * approve something the organizer hasn't actually looked at just now.
 */
export function WaiverCard({
  showId,
  waiverText,
  waiverApprovedText,
}: {
  showId: string;
  waiverText: string | null;
  waiverApprovedText: string | null;
}) {
  const [text, setText] = useState(
    waiverText === null || waiverText === '' ? WAIVER_TEXT_DEFAULT : waiverText,
  );
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

      <div className={`mb-3 text-sm ${approved ? 'text-[#2E7048]' : 'text-status-danger'}`}>
        {approved ? 'Approved' : 'Not yet approved — required before Go Live'}
      </div>

      <textarea
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
