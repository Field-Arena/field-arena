'use client';

import { useId, useState } from 'react';
import { useSignRequiredDocument } from '@/modules/riders/hooks/use-waiver-mutations';
import { signableRequirementText } from '@/modules/riders/utils/is-signable-requirement';
import type { DocumentRequirement, HorseDocumentUploadWithUrl } from '@/modules/riders/types';
import { formatDateShort } from '@/shared/lib/format/date';
import { Button } from '@/shared/ui/shadcn/button';
import { Input } from '@/shared/ui/shadcn/input';
import { Label } from '@/shared/ui/shadcn/label';

/** An organizer-required document that is an agreement: the rider reads it
 * and signs it here (typed full name + "I agree") instead of uploading a
 * signed copy. The server dates it and files a PDF record of the signature
 * for each of the rider's horses. */
export function RequiredDocumentSign({
  showId,
  showName,
  requirement,
  existing,
  riderName,
  horseCount,
}: {
  showId: string;
  showName: string;
  requirement: DocumentRequirement;
  existing?: HorseDocumentUploadWithUrl;
  riderName: string;
  horseCount: number;
}) {
  const fieldId = useId();
  const [fullName, setFullName] = useState(riderName);
  const [agreed, setAgreed] = useState(false);
  const sign = useSignRequiredDocument();

  if (existing) {
    const signedOnSite = existing.method === 'e-sign';
    return (
      <div className="border-line rounded-lg border px-3 py-2">
        <div className="text-forest text-sm font-medium">{requirement.label}</div>
        <div className="text-xs text-green-700">
          {signedOnSite
            ? `✓ Signed by ${existing.signedName ?? 'you'}${existing.signedAt ? ` on ${formatDateShort(existing.signedAt.slice(0, 10))}` : ''}`
            : '✓ On file'}
          {existing.url && (
            <>
              {' · '}
              <a
                href={existing.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-forest font-medium underline underline-offset-2"
              >
                View
              </a>
            </>
          )}
        </div>
      </div>
    );
  }

  const canSign = fullName.trim().length > 0 && agreed && !sign.isPending;

  return (
    <div className="border-line space-y-2 rounded-lg border px-3 py-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-forest text-sm font-medium">{requirement.label}</div>
        <span className="text-xs text-amber-700">Not signed yet — sign here, no upload needed</span>
      </div>
      <div className="border-line text-fa-muted max-h-40 overflow-y-auto rounded-md border bg-white p-2.5 text-xs leading-relaxed whitespace-pre-wrap">
        {signableRequirementText(requirement, showName)}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${fieldId}-name`} className="text-xs">
          Type your full legal name to sign
        </Label>
        <Input
          id={`${fieldId}-name`}
          value={fullName}
          placeholder="Click here to type your full legal name…"
          onChange={(event) => {
            setFullName(event.target.value);
          }}
        />
      </div>
      <label className="text-forest flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(event) => {
            setAgreed(event.target.checked);
          }}
          className="mt-0.5"
        />
        I agree
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          size="sm"
          disabled={!canSign}
          onClick={() => {
            sign.mutate({
              showId,
              requirementId: requirement.id,
              fullName: fullName.trim(),
              agreed: true,
            });
          }}
        >
          {sign.isPending ? 'Signing…' : `Sign ${requirement.label}`}
        </Button>
        <span className="text-fa-muted text-[11px]">
          Today&apos;s date is added automatically
          {horseCount > 1
            ? ` · one signature covers all ${horseCount.toString()} of your horses`
            : ''}
          .
        </span>
      </div>
    </div>
  );
}
