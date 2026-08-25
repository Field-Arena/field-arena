'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/shadcn/card';
import { Button } from '@/shared/ui/shadcn/button';

export function RiderDemoDetailsStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="[animation:fa-in_.22s_ease-out_both] space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Rider details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <div>
            <div className="text-fa-muted text-xs font-bold tracking-[.1em] uppercase">
              Category
            </div>
            <div className="text-forest mt-1">Adult Amateur</div>
          </div>
          <div>
            <div className="text-fa-muted text-xs font-bold tracking-[.1em] uppercase">
              Date of birth
            </div>
            <div className="text-forest mt-1">1994-03-12</div>
          </div>
          <div>
            <div className="text-fa-muted text-xs font-bold tracking-[.1em] uppercase">
              Credentials
            </div>
            <div className="text-forest mt-1">USEF 5551234</div>
          </div>
          <div>
            <div className="text-fa-muted text-xs font-bold tracking-[.1em] uppercase">
              Emergency contact
            </div>
            <div className="text-forest mt-1">Jordan Clarke · (555) 010-2938</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Horses</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <div className="border-line flex items-center justify-between rounded-lg border px-3 py-2">
            <div>
              <div className="text-forest font-medium">Willow</div>
              <div className="text-fa-muted text-xs">Warmblood · Coggins on file</div>
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
