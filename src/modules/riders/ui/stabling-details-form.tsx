'use client';

import { useEffect, useMemo } from 'react';
import { useEntryCartStore } from '@/modules/riders/store';
import { cartNeedsStablingDetails } from '@/modules/riders/utils/cart-needs-stabling-details';
import type { AddOnWithRemaining, HorseWithDocumentUrls } from '@/modules/riders/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/shadcn/card';
import { Input } from '@/shared/ui/shadcn/input';
import { Textarea } from '@/shared/ui/shadcn/textarea';
import { Label } from '@/shared/ui/shadcn/label';

export function StablingDetailsForm({
  addOns,
  horses,
  knownTrainerNames,
}: {
  addOns: AddOnWithRemaining[];
  horses: HorseWithDocumentUrls[];
  knownTrainerNames: string[];
}) {
  const addOnQuantities = useEntryCartStore((state) => state.addOnQuantities);
  const stablingDetails = useEntryCartStore((state) => state.stablingDetails);
  const setStablingDetails = useEntryCartStore((state) => state.setStablingDetails);

  const needed = cartNeedsStablingDetails(addOnQuantities, addOns);

  const prefill = useMemo(() => {
    const withTrainer = horses.find((h) => h.trainer?.trim());
    if (withTrainer?.trainer) return withTrainer.trainer;
    const withStable = horses.find((h) => h.stable?.trim());
    return withStable?.stable ?? '';
  }, [horses]);

  useEffect(() => {
    if (needed && !stablingDetails.trainerName && prefill) {
      setStablingDetails({ trainerName: prefill });
    }
  }, [needed, prefill, stablingDetails.trainerName, setStablingDetails]);

  if (!needed) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stabling details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-fa-muted text-xs">
          Tell the show secretary who you&apos;re stabling with so horses can be placed together.
        </p>
        <div>
          <Label htmlFor="stabling-trainer">Trainer / barn name</Label>
          <Input
            id="stabling-trainer"
            value={stablingDetails.trainerName}
            onChange={(event) => {
              setStablingDetails({ trainerName: event.target.value });
            }}
            placeholder="e.g. Blue Ridge Dressage"
          />
        </div>
        <div>
          <Label htmlFor="stabling-with">Stable with (optional)</Label>
          <Input
            id="stabling-with"
            list="known-trainer-names"
            value={stablingDetails.stableWith}
            onChange={(event) => {
              setStablingDetails({ stableWith: event.target.value });
            }}
            placeholder="Another trainer or barn you're traveling with"
          />
          <datalist id="known-trainer-names">
            {knownTrainerNames.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </div>
        <div>
          <Label htmlFor="stabling-notes">Notes (optional)</Label>
          <Textarea
            id="stabling-notes"
            rows={2}
            value={stablingDetails.notes}
            onChange={(event) => {
              setStablingDetails({ notes: event.target.value });
            }}
            placeholder="e.g. Stallion, needs end stall"
          />
        </div>
      </CardContent>
    </Card>
  );
}
