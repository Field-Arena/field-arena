'use client';

import { LEGACY_COLOR } from '@/modules/riders/ui/legacy-theme';
import type { DocumentRequirement, HorseWithDocumentUrls } from '@/modules/riders/types';

/* Legacy's renderDocReminderBanner (rider.html:2694) — counts one "missing"
 * per (horse, requirement) pair with no upload, across every horse on the
 * account, not just "does at least one horse have a gap." Hidden entirely
 * once nothing is missing. */
export function DocumentReminderBanner({
  horses,
  documentRequirements,
  onGoToHorseTab,
}: {
  horses: HorseWithDocumentUrls[];
  documentRequirements: DocumentRequirement[];
  onGoToHorseTab: () => void;
}) {
  let missing = 0;
  for (const horse of horses) {
    const uploadedRequirementIds = new Set(horse.documentUploads.map((u) => u.requirementId));
    for (const req of documentRequirements) {
      if (!uploadedRequirementIds.has(req.id)) missing += 1;
    }
  }

  if (missing === 0) return null;

  return (
    <div
      style={{
        background: LEGACY_COLOR.amberBg,
        border: `1px solid ${LEGACY_COLOR.amber}`,
        color: LEGACY_COLOR.amber,
        borderRadius: 10,
        padding: '12px 16px',
        margin: '0 0 16px',
        fontSize: 13.5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        flexWrap: 'wrap',
      }}
    >
      <span>
        📋 You still have <b>{missing}</b> document{missing === 1 ? '' : 's'} outstanding for your
        horse{horses.length === 1 ? '' : 's'} — upload before the show.
      </span>
      <button
        type="button"
        onClick={onGoToHorseTab}
        style={{
          fontFamily: 'inherit',
          fontWeight: 600,
          cursor: 'pointer',
          borderRadius: 8,
          border: `1px solid ${LEGACY_COLOR.border}`,
          background: LEGACY_COLOR.white,
          color: LEGACY_COLOR.hunterDeep,
          padding: '6px 12px',
          fontSize: 12.5,
        }}
      >
        Go to Horse tab →
      </button>
    </div>
  );
}
