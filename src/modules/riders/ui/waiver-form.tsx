'use client';

import { useWaiverForm } from '@/modules/riders/hooks/use-waiver-form';
import type { WaiverSignatureRow } from '@/modules/riders/types';
import { Button } from '@/shared/ui/shadcn/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/shadcn/card';
import { Input } from '@/shared/ui/shadcn/input';
import { Label } from '@/shared/ui/shadcn/label';

export function WaiverForm({
  showId,
  waiverText,
  existingSignature,
}: {
  showId: string;
  waiverText: string;
  existingSignature: WaiverSignatureRow | null;
}) {
  const {
    textRef,
    scrolledToBottom,
    checkScrolled,
    fullName,
    setFullName,
    signatureDate,
    setSignatureDate,
    agreed,
    setAgreed,
    signed,
    canSign,
    isPending,
    sign,
  } = useWaiverForm({ showId, existingSignature });

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

        <Label htmlFor="waiver-agree" className="text-forest items-start gap-2 text-sm font-normal">
          <input
            id="waiver-agree"
            type="checkbox"
            checked={agreed}
            disabled={signed || !scrolledToBottom}
            onChange={(event) => {
              setAgreed(event.target.checked);
            }}
            className="mt-0.5"
          />
          I have read and agree to the terms above.
        </Label>

        {signed ? (
          <p className="text-sm font-medium text-green-700">✓ Signed</p>
        ) : (
          <Button type="button" disabled={!canSign || isPending} onClick={sign}>
            {isPending ? 'Signing…' : 'Sign waiver'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
