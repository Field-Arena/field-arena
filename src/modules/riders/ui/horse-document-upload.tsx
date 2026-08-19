'use client';

import { useRef, useState } from 'react';
import {
  useDeleteHorseDocument,
  useUploadHorseDocument,
} from '@/modules/riders/hooks/use-horse-mutations';
import type { DocumentRequirement, HorseDocumentUploadWithUrl } from '@/modules/riders/types';
import { Button } from '@/shared/ui/shadcn/button';
import { Input } from '@/shared/ui/shadcn/input';

export function HorseDocumentUpload({
  horseId,
  requirement,
  existing,
}: {
  horseId: string;
  requirement: DocumentRequirement;
  existing?: HorseDocumentUploadWithUrl;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [expirationDate, setExpirationDate] = useState(existing?.expirationDate ?? '');
  const upload = useUploadHorseDocument();
  const remove = useDeleteHorseDocument();

  return (
    <div className="border-line rounded-lg border px-3 py-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-forest text-sm font-medium">{requirement.label}</div>
          {existing ? (
            <div className="text-fa-muted text-xs">
              Uploaded
              {existing.url && (
                <>
                  {' · '}
                  <a
                    href={existing.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium underline underline-offset-2"
                  >
                    View
                  </a>
                </>
              )}
            </div>
          ) : (
            <div className="text-xs text-amber-700">Not uploaded yet</div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {existing && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={remove.isPending}
              onClick={() => {
                remove.mutate({ horseId, requirementId: requirement.id });
              }}
            >
              Delete
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={upload.isPending}
            onClick={() => fileInputRef.current?.click()}
          >
            {existing ? 'Replace' : 'Upload'}
          </Button>
        </div>
      </div>

      {requirement.requiresExpiration && (
        <div className="mt-2">
          <Input
            type="date"
            value={expirationDate}
            onChange={(event) => {
              setExpirationDate(event.target.value);
            }}
            className="max-w-[180px]"
          />
        </div>
      )}

      <Input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (!file) return;
          const formData = new FormData();
          formData.set('file', file);
          formData.set('horseId', horseId);
          formData.set('requirementId', requirement.id);
          formData.set('label', requirement.label);
          if (requirement.requiresExpiration && expirationDate) {
            formData.set('expirationDate', expirationDate);
          }
          upload.mutate(formData);
        }}
      />
    </div>
  );
}
