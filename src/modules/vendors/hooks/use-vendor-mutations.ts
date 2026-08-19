'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { readableError } from '@/shared/lib/error-message';
import { createClient } from '@/shared/lib/supabase/client';
import {
  applyToVendorShow,
  signVendorAgreement,
  createVendorDocumentUploadUrl,
  registerVendorDocument,
  removeVendorDocument,
} from '@/modules/vendors/data/mutations';
import type { ApplyToShowInput, SignVendorAgreementInput } from '@/modules/vendors/schemas';
import { VENDOR_DOCS_BUCKET } from '@/modules/vendors/constants';

export function useApplyToVendorShow() {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: ApplyToShowInput) => applyToVendorShow(input),
    onSuccess: () => {
      toast.success('Application submitted — the organizer will review it.');
      router.refresh();
    },
    onError: (error) => {
      toast.error(readableError(error, 'Could not submit your application'));
    },
  });
}

export function useSignVendorAgreement() {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: SignVendorAgreementInput) => signVendorAgreement(input),
    onSuccess: () => {
      toast.success('Agreement signed');
      router.refresh();
    },
    onError: (error) => {
      toast.error(readableError(error, 'Could not sign the agreement'));
    },
  });
}

export function useUploadVendorDocument() {
  const router = useRouter();

  return useMutation({
    mutationFn: async ({
      bookingId,
      requirementId,
      label,
      file,
    }: {
      bookingId: string;
      requirementId: string;
      label: string;
      file: File;
    }) => {
      const { path, token } = await createVendorDocumentUploadUrl({
        bookingId,
        requirementId,
        name: file.name,
      });

      const supabase = createClient();
      const { error } = await supabase.storage
        .from(VENDOR_DOCS_BUCKET)
        .uploadToSignedUrl(path, token, file, {
          contentType: file.type || 'application/octet-stream',
        });
      if (error) throw new Error(error.message);

      return registerVendorDocument({ bookingId, requirementId, label, path });
    },
    onSuccess: () => {
      toast.success('Document uploaded');
      router.refresh();
    },
    onError: (error) => {
      toast.error(readableError(error, 'Could not upload this document'));
    },
  });
}

export function useRemoveVendorDocument() {
  const router = useRouter();

  return useMutation({
    mutationFn: removeVendorDocument,
    onSuccess: () => {
      toast.success('Document removed');
      router.refresh();
    },
    onError: (error) => {
      toast.error(readableError(error, 'Could not remove this document'));
    },
  });
}
