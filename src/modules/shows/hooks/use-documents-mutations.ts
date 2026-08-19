'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createClient } from '@/shared/lib/supabase/client';
import { readableError } from '@/shared/lib/error-message';
import {
  createDocumentUploadUrl,
  registerShowDocument,
  removeShowDocument,
  updateDocumentEvents,
} from '@/modules/shows/data/mutations';
import type { RemoveShowDocumentInput, UpdateDocumentEventsInput } from '@/modules/shows/schemas';

const message = readableError;

export function useUploadShowDocument() {
  const router = useRouter();

  return useMutation({
    mutationFn: async ({ showId, file }: { showId: string; file: File }) => {
      const { path, token } = await createDocumentUploadUrl({ showId, name: file.name });

      const supabase = createClient();
      const { error } = await supabase.storage
        .from('documents')
        .uploadToSignedUrl(path, token, file, {
          contentType: file.type || 'application/pdf',
        });
      if (error) throw new Error(error.message);

      return registerShowDocument({ showId, name: file.name, path });
    },
    onSuccess: () => {
      toast.success('File uploaded');
      router.refresh();
    },
    onError: (error) => {
      toast.error(message(error, 'Could not upload this file'));
    },
  });
}

export function useRemoveShowDocument() {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: RemoveShowDocumentInput) => removeShowDocument(input),
    onSuccess: () => {
      toast.success('File removed');
      router.refresh();
    },
    onError: (error) => {
      toast.error(message(error, 'Could not remove this file'));
    },
  });
}

export function useUpdateDocumentEvents() {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: UpdateDocumentEventsInput) => updateDocumentEvents(input),
    onSuccess: () => {
      router.refresh();
    },
    onError: (error) => {
      toast.error(message(error, 'Could not update which classes this is attached to'));
    },
  });
}
