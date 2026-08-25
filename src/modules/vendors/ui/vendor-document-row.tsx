'use client';

import { useRef } from 'react';
import { Button } from '@/shared/ui/shadcn/button';
import { Input } from '@/shared/ui/shadcn/input';
import {
  useUploadVendorDocument,
  useRemoveVendorDocument,
} from '@/modules/vendors/hooks/use-vendor-mutations';
import type { VendorDocumentRequirement, VendorDocumentUpload } from '@/modules/vendors/types';

export function VendorDocumentRow({
  bookingId,
  requirement,
  upload,
}: {
  bookingId: string;
  requirement: VendorDocumentRequirement;
  upload: VendorDocumentUpload | undefined;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadVendorDocument();
  const removeMutation = useRemoveVendorDocument();

  return (
    <div className="doc-row">
      <span className="doc-name">{requirement.label}</span>
      {upload ? (
        <>
          <span className="doc-meta">Uploaded{upload.verified ? ' · Verified' : ''}</span>
          <Button
            type="button"
            variant="ghost"
            className="btn-link h-auto rounded-none bg-transparent px-0 py-0 text-base font-normal hover:bg-transparent"
            disabled={removeMutation.isPending}
            onClick={() => {
              removeMutation.mutate({ bookingId, requirementId: requirement.id });
            }}
          >
            Delete
          </Button>
        </>
      ) : (
        <>
          <Input
            ref={inputRef}
            type="file"
            className="inline-flex h-auto max-w-[180px] border-none bg-transparent p-0 text-xs"
            disabled={uploadMutation.isPending}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (!file) return;
              uploadMutation.mutate({
                bookingId,
                requirementId: requirement.id,
                label: requirement.label,
                file,
              });
            }}
          />
          <Button
            type="button"
            variant="ghost"
            className="btn-link h-auto rounded-none bg-transparent px-0 py-0 text-base font-normal hover:bg-transparent"
            disabled={uploadMutation.isPending}
            onClick={() => {
              inputRef.current?.click();
            }}
          >
            {uploadMutation.isPending ? 'Uploading…' : '↑ Upload'}
          </Button>
        </>
      )}
    </div>
  );
}
