'use client';

import { useEffect, useRef, useState } from 'react';
import { useSignWaiver } from '@/modules/riders/hooks/use-waiver-mutations';
import type { WaiverSignatureRow } from '@/modules/riders/types';
import { formatDateShort } from '@/shared/lib/format/date';
import { Button } from '@/shared/ui/shadcn/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/shadcn/card';
import { Input } from '@/shared/ui/shadcn/input';
import { Label } from '@/shared/ui/shadcn/label';

const SCROLL_BOTTOM_THRESHOLD_PX = 10;

export function WaiverForm({
  showId,
  waiverText,
  existingSignature,
  waiverDocumentUrl,
  waiverDocumentName,
  todayDate,
}: {
  showId: string;
  waiverText: string;
  existingSignature: WaiverSignatureRow | null;
  waiverDocumentUrl?: string | null;
  waiverDocumentName?: string | null;
  /** Today's date in the show's time zone — what the server will date the
   * signature with. Shown read-only; the rider never types a date. */
  todayDate: string;
}) {
  const textRef = useRef<HTMLDivElement>(null);
  const [scrolledToBottom, setScrolledToBottom] = useState(!!existingSignature);
  const [fullName, setFullName] = useState(existingSignature?.full_name ?? '');
  const signatureDate = existingSignature?.signature_date ?? todayDate;
  const documentIsPdf = /\.pdf$/i.test(waiverDocumentName ?? '');
  const [agreed, setAgreed] = useState(!!existingSignature);
  const signWaiver = useSignWaiver();
  const signed = !!existingSignature || signWaiver.isSuccess;

  const checkScrolled = () => {
    const el = textRef.current;
    if (!el || scrolledToBottom) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - SCROLL_BOTTOM_THRESHOLD_PX) {
      setScrolledToBottom(true);
    }
  };

  useEffect(() => {
    checkScrolled();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once on mount, same as legacy's one-shot check
  }, []);

  const canSign = scrolledToBottom && fullName.trim().length > 0 && agreed;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Release of liability, waiver of claims, and assumption of risk</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-fa-muted text-xs">
          Read the release below, then sign it here on the site — type your full legal name and tick
          &ldquo;I agree&rdquo;. Nothing to print, scan or upload.
        </p>
        {waiverDocumentUrl && waiverDocumentName && documentIsPdf && (
          <iframe
            src={waiverDocumentUrl}
            title={waiverDocumentName}
            className="border-line h-[420px] w-full rounded-lg border bg-white"
          />
        )}
        {waiverDocumentUrl && waiverDocumentName && (
          <a
            href={waiverDocumentUrl}
            target="_blank"
            rel="noreferrer"
            className="text-forest inline-block text-xs font-semibold underline underline-offset-2"
          >
            📄 {documentIsPdf ? 'Open in a new tab' : 'View full document'}: {waiverDocumentName}
          </a>
        )}
        <div
          ref={textRef}
          onScroll={checkScrolled}
          className="border-line text-fa-muted max-h-56 overflow-y-auto rounded-lg border p-3 text-xs leading-relaxed whitespace-pre-wrap"
        >
          {waiverText}
        </div>
        {!scrolledToBottom && (
          <p className="text-destructive text-xs">Scroll to the bottom to continue.</p>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="waiver-signature">Type your full legal name to sign</Label>
            <Input
              id="waiver-signature"
              value={fullName}
              disabled={signed}
              onChange={(event) => {
                setFullName(event.target.value);
              }}
              placeholder="Click here to type your full legal name…"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="waiver-date">Date</Label>
            <div
              id="waiver-date"
              className="border-line text-forest flex h-9 items-center rounded-lg border bg-white/60 px-3 text-sm"
            >
              {formatDateShort(signatureDate)}
            </div>
            <p className="text-fa-muted text-[11px]">Filled in automatically when you sign.</p>
          </div>
        </div>

        <label className="text-forest flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={agreed}
            disabled={signed || !scrolledToBottom}
            onChange={(event) => {
              setAgreed(event.target.checked);
            }}
            className="mt-0.5"
          />
          I agree — I have read the release above and I am signing it electronically.
        </label>

        {signed ? (
          <p className="text-sm font-medium text-green-700">
            ✓ Signed by {existingSignature?.full_name ?? fullName.trim()} on{' '}
            {formatDateShort(signatureDate)}
          </p>
        ) : (
          <Button
            type="button"
            disabled={!canSign || signWaiver.isPending}
            onClick={() => {
              signWaiver.mutate({ showId, fullName: fullName.trim() });
            }}
          >
            {signWaiver.isPending ? 'Signing…' : 'Sign waiver'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
