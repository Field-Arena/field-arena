'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/shadcn/card';
import { Button } from '@/shared/ui/shadcn/button';

/**
 * Demo-only stand-in for the real `RiderDetailsForm` + `WaiverForm` +
 * `HorseManager` — all three call real mutations on submit
 * (useUpdateRiderProfile / useSignWaiver / document uploads), which the
 * SuperAdmin "Demo" button must never trigger. Read-only display of the same
 * seed identity used throughout this walkthrough, waiver shown pre-signed —
 * same step-3 shape as legacy's demo ("Horse info, required documents, and
 * the waiver of liability").
 */
export function RiderDemoDetailsStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="space-y-6 [animation:fa-in_.22s_ease-out_both]">
      <Card>
        <CardHeader>
          <CardTitle>Rider details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <div>
            <div className="text-xs font-bold uppercase tracking-[.1em] text-fa-muted">Category</div>
            <div className="mt-1 text-forest">Adult Amateur</div>
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-[.1em] text-fa-muted">
              Date of birth
            </div>
            <div className="mt-1 text-forest">1994-03-12</div>
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-[.1em] text-fa-muted">
              Credentials
            </div>
            <div className="mt-1 text-forest">USEF 5551234</div>
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-[.1em] text-fa-muted">
              Emergency contact
            </div>
            <div className="mt-1 text-forest">Jordan Clarke · (555) 010-2938</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Horses</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <div className="flex items-center justify-between rounded-lg border border-line px-3 py-2">
            <div>
              <div className="font-medium text-forest">Willow</div>
              <div className="text-xs text-fa-muted">Warmblood · Coggins on file</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Release of liability, waiver of claims, and assumption of risk</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm font-medium text-green-700">✓ Signed — Amanda Clarke</p>
        </CardContent>
      </Card>

      <Button type="button" onClick={onNext}>
        Continue
      </Button>
    </div>
  );
}
