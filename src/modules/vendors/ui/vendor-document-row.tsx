'use client';

import { useRef } from 'react';
import { Button } from '@/shared/ui/shadcn/button';
import {
  useUploadVendorDocument,
  useRemoveVendorDocument,
} from '@/modules/vendors/hooks/use-vendor-mutations';
import type { VendorDocumentRequirement, VendorDocumentUpload } from '@/modules/vendors/types';

/**
 * One row of a booking's document checklist — ported from vendor.html's
 * documentsView(): a file input + "Upload" when nothing is on file yet, or
 * "View"/"Delete" once something is.
 */
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
          {/* Raw native file input, deliberately not the shadcn Input wrapper —
              that component restyles the ::file-selector-button pseudo-element
              (drops the browser's native "Choose File" chrome for a flat
              text button), which would be a real visual change here, not a
              pixel-identical one. Same reasoning as leaving checkbox/radio
              inputs raw. */}
          <input
            ref={inputRef}
            type="file"
            style={{ display: 'inline-block', maxWidth: 180, fontSize: 12 }}
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
            onClick={() => { inputRef.current?.click(); }}
          >
            {uploadMutation.isPending ? 'Uploading…' : '↑ Upload'}
          </Button>
        </>
      )}
    </div>
  );
}
