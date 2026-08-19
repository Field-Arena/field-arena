'use client';

import { useState } from 'react';
import { useCreateHorse, useDeleteHorse, useUpdateHorse } from '@/modules/riders/hooks/use-horse-mutations';
import { HorseDocumentUpload } from '@/modules/riders/ui/horse-document-upload';
import type { DocumentRequirement, HorseWithDocumentUrls } from '@/modules/riders/types';
import { Button } from '@/shared/ui/shadcn/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/shadcn/card';
import { Input } from '@/shared/ui/shadcn/input';
import { Label } from '@/shared/ui/shadcn/label';

/**
 * Horse list — add, edit, remove, and per-requirement document upload.
 * Mirrors legacy's #dtab-horse dashboard tab (rider.html), minus the "Upload
 * later" onboarding framing: there is no multi-step wizard here to defer
 * past yet, so every horse card always shows its full document checklist.
 *
 * A horse's registered `name` is never editable here — no input for it
 * exists anywhere in this file, matching the DB trigger
 * (assert_horse_name_immutable) that would reject the write anyway.
 */
export function HorseManager({
  horses,
  documentRequirements,
}: {
  horses: HorseWithDocumentUrls[];
  documentRequirements: DocumentRequirement[];
}) {
  const [newHorseName, setNewHorseName] = useState('');
  const createHorse = useCreateHorse({
    onSuccess: () => {
      setNewHorseName('');
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your horses</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {horses.length === 0 && (
          <p className="text-sm text-fa-muted">No horses on your account yet — add one below.</p>
        )}

        {horses.map((horse) => (
          <HorseCard key={horse.id} horse={horse} documentRequirements={documentRequirements} />
        ))}

        <form
          className="flex items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!newHorseName.trim()) return;
            createHorse.mutate({ name: newHorseName.trim() });
          }}
        >
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="new-horse-name">Add a horse</Label>
            <Input
              id="new-horse-name"
              placeholder="e.g. Midnight Runner"
              value={newHorseName}
              onChange={(event) => {
                setNewHorseName(event.target.value);
              }}
            />
            <p className="text-xs text-fa-muted">
              Registered name — this can&apos;t be changed once added.
            </p>
          </div>
          <Button type="submit" disabled={createHorse.isPending || !newHorseName.trim()}>
            {createHorse.isPending ? 'Adding…' : 'Add horse'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function HorseCard({
  horse,
  documentRequirements,
}: {
  horse: HorseWithDocumentUrls;
  documentRequirements: DocumentRequirement[];
}) {
  const updateHorse = useUpdateHorse();
  const deleteHorse = useDeleteHorse();
  const uploadsByRequirement = new Map(horse.documentUploads.map((u) => [u.requirementId, u]));

  return (
    <div className="space-y-3 rounded-lg border border-line p-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-forest">{horse.name}</div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={deleteHorse.isPending}
          onClick={() => {
            if (!confirm(`Remove ${horse.name} from your account? This can't be undone.`)) return;
            deleteHorse.mutate({ id: horse.id });
          }}
        >
          Remove horse
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor={`stable-${horse.id}`}>Stable name</Label>
          <Input
            id={`stable-${horse.id}`}
            defaultValue={horse.stable ?? ''}
            onBlur={(event) => {
              updateHorse.mutate({ id: horse.id, stable: event.target.value });
            }}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`trainer-${horse.id}`}>Trainer name</Label>
          <Input
            id={`trainer-${horse.id}`}
            defaultValue={horse.trainer ?? ''}
            onBlur={(event) => {
              updateHorse.mutate({ id: horse.id, trainer: event.target.value });
            }}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`trainer-phone-${horse.id}`}>Trainer phone</Label>
          <Input
            id={`trainer-phone-${horse.id}`}
            type="tel"
            defaultValue={horse.trainer_phone ?? ''}
            onBlur={(event) => {
              updateHorse.mutate({ id: horse.id, trainerPhone: event.target.value });
            }}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-forest">
        <input
          type="checkbox"
          defaultChecked={horse.is_stallion ?? false}
          onChange={(event) => {
            updateHorse.mutate({ id: horse.id, isStallion: event.target.checked });
          }}
        />
        Is your horse a stallion?
      </label>

      {documentRequirements.length > 0 && (
        <div className="space-y-2">
          {documentRequirements.map((req) => (
            <HorseDocumentUpload
              key={req.id}
              horseId={horse.id}
              requirement={req}
              existing={uploadsByRequirement.get(req.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
