'use client';

import { useEffect, useRef, useState } from 'react';
import { useSignWaiver } from '@/modules/riders/hooks/use-waiver-mutations';
import type { WaiverSignatureRow } from '@/modules/riders/types';
import { Button } from '@/shared/ui/shadcn/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/shadcn/card';
import { Input } from '@/shared/ui/shadcn/input';
import { Label } from '@/shared/ui/shadcn/label';

const SCROLL_BOTTOM_THRESHOLD_PX = 10;

export function WaiverForm({
  showId,
  waiverText,
  existingSignature,
}: {
  showId: string;
  waiverText: string;
  existingSignature: WaiverSignatureRow | null;
}) {
  const textRef = useRef<HTMLDivElement>(null);
  const [scrolledToBottom, setScrolledToBottom] = useState(!!existingSignature);
  const [fullName, setFullName] = useState(existingSignature?.full_name ?? '');
  const [signatureDate, setSignatureDate] = useState(
    existingSignature?.signature_date ?? new Date().toISOString().slice(0, 10),
  );
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

  const canSign =
    scrolledToBottom && fullName.trim().length > 0 && signatureDate.trim().length > 0 && agreed;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Release of liability, waiver of claims, and assumption of risk</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
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
              placeholder="e.g. Jordan A. Rider"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="waiver-date">Date</Label>
            <Input
              id="waiver-date"
              type="date"
              value={signatureDate}
              disabled={signed}
              onChange={(event) => {
                setSignatureDate(event.target.value);
              }}
            />
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
          I have read and agree to the terms above.
        </label>

        {signed ? (
          <p className="text-sm font-medium text-green-700">✓ Signed</p>
        ) : (
          <Button
            type="button"
            disabled={!canSign || signWaiver.isPending}
            onClick={() => {
              signWaiver.mutate({ showId, fullName: fullName.trim(), signatureDate });
            }}
          >
            {signWaiver.isPending ? 'Signing…' : 'Sign waiver'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
