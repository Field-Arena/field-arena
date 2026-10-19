'use client';

import { useRef } from 'react';
import {
  useUploadVendorDocument,
  useRemoveVendorDocument,
} from '@/modules/vendors/hooks/use-vendor-mutations';
import { FA_BTN_DANGER, FA_BTN_SMALL, Pill } from '@/shared/ui/organizer/fa-page';
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
    <li className="flex flex-wrap items-center gap-3 border-t border-[#EDF0EE] py-2.5 first:border-t-0">
      <span className="min-w-0 flex-1 text-[14px] font-semibold text-[#0D2C23]">
        {requirement.label}
      </span>
      {upload ? (
        <>
          <Pill tone="green">Uploaded</Pill>
          {upload.verified && <Pill tone="blue">Verified</Pill>}
          <button
            type="button"
            className={FA_BTN_DANGER}
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
            aria-label={`Upload ${requirement.label}`}
            className="sr-only"
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
            className={FA_BTN_SMALL}
            disabled={uploadMutation.isPending}
            onClick={() => {
              inputRef.current?.click();
            }}
          >
            {uploadMutation.isPending ? 'Uploading…' : '↑ Upload'}
          </button>
        </>
      )}
    </li>
  );
}
