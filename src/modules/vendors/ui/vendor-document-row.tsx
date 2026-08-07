'use client';

import { useRef } from 'react';
import {
  useUploadVendorDocument,
  useRemoveVendorDocument,
} from '../hooks/use-vendor-mutations';
import type { VendorDocumentRequirement, VendorDocumentUpload } from '../data/queries';

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
          <button
            type="button"
            className="btn-link"
            disabled={removeMutation.isPending}
            onClick={() => {
              removeMutation.mutate({ bookingId, requirementId: requirement.id });
            }}
          >
            Delete
          </button>
        </>
      ) : (
        <>
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
          <button
            type="button"
            className="btn-link"
            disabled={uploadMutation.isPending}
            onClick={() => { inputRef.current?.click(); }}
          >
            {uploadMutation.isPending ? 'Uploading…' : '↑ Upload'}
          </button>
        </>
      )}
    </div>
  );
}
