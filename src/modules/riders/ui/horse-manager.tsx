'use client';

import { useState } from 'react';
import {
  useCreateHorse,
  useDeleteHorse,
  useUpdateHorse,
} from '@/modules/riders/hooks/use-horse-mutations';
import { HorseDocumentUpload } from '@/modules/riders/ui/horse-document-upload';
import { RequiredDocumentSign } from '@/modules/riders/ui/required-document-sign';
import { isSignableRequirement } from '@/modules/riders/utils/is-signable-requirement';
import type { DocumentRequirement, HorseWithDocumentUrls } from '@/modules/riders/types';
import { Button } from '@/shared/ui/shadcn/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/shadcn/card';
import { Input } from '@/shared/ui/shadcn/input';
import { Label } from '@/shared/ui/shadcn/label';

const TYPE_HERE = 'Click here to type…';

interface DocumentContext {
  showId: string;
  showName: string;
  riderName: string;
  horseCount: number;
}

export function HorseManager({
  horses,
  documentRequirements,
  showId,
  showName,
  riderName,
}: {
  horses: HorseWithDocumentUrls[];
  documentRequirements: DocumentRequirement[];
  showId: string;
  showName: string;
  riderName: string;
}) {
  const documentContext: DocumentContext = {
    showId,
    showName,
    riderName,
    horseCount: horses.length,
  };
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
        <p className="text-fa-muted text-sm">
          {horses.length === 0
            ? 'No horses on your account yet — type your horse’s name below and click “Add horse”.'
            : 'Click “Add horse” each time you want to add another horse.'}
        </p>

        {horses.map((horse) => (
          <HorseCard
            key={horse.id}
            horse={horse}
            documentRequirements={documentRequirements}
            documentContext={documentContext}
          />
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
            <Label htmlFor="new-horse-name">
              {horses.length === 0 ? 'Add a horse' : 'Add another horse'}
            </Label>
            <Input
              id="new-horse-name"
              placeholder="Click here to type the horse’s registered name…"
              value={newHorseName}
              onChange={(event) => {
                setNewHorseName(event.target.value);
              }}
            />
            <p className="text-fa-muted text-xs">
              Registered name — this can&apos;t be changed once added. Click &ldquo;Add horse&rdquo;
              each time you want to add another horse.
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
  documentContext,
}: {
  horse: HorseWithDocumentUrls;
  documentRequirements: DocumentRequirement[];
  documentContext: DocumentContext;
}) {
  const updateHorse = useUpdateHorse();
  const deleteHorse = useDeleteHorse();
  const uploadsByRequirement = new Map(horse.documentUploads.map((u) => [u.requirementId, u]));

  return (
    <div className="border-line space-y-3 rounded-lg border p-3">
      <div className="flex items-center justify-between">
        <div className="text-forest text-sm font-semibold">{horse.name}</div>
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`stable-${horse.id}`}>Home Stable</Label>
          <Input
            id={`stable-${horse.id}`}
            placeholder={TYPE_HERE}
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
            placeholder={TYPE_HERE}
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
            placeholder={TYPE_HERE}
            defaultValue={horse.trainer_phone ?? ''}
            onBlur={(event) => {
              updateHorse.mutate({ id: horse.id, trainerPhone: event.target.value });
            }}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`height-${horse.id}`}>Height (hands)</Label>
          <Input
            id={`height-${horse.id}`}
            placeholder={`${TYPE_HERE} e.g. 15.2`}
            defaultValue={horse.height ?? ''}
            onBlur={(event) => {
              updateHorse.mutate({ id: horse.id, height: event.target.value });
            }}
          />
        </div>
      </div>

      <label className="text-forest flex items-center gap-2 text-sm">
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
          {documentRequirements.map((req) =>
            isSignableRequirement(req) ? (
              <RequiredDocumentSign
                key={req.id}
                showId={documentContext.showId}
                showName={documentContext.showName}
                requirement={req}
                existing={uploadsByRequirement.get(req.id)}
                riderName={documentContext.riderName}
                horseCount={documentContext.horseCount}
              />
            ) : (
              <HorseDocumentUpload
                key={req.id}
                horseId={horse.id}
                requirement={req}
                existing={uploadsByRequirement.get(req.id)}
              />
            ),
          )}
        </div>
      )}
    </div>
  );
}
