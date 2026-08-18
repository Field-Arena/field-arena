'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { readableError } from '@/shared/lib/error-message';
import { addManualHorse, verifyHorseDocument, remindHorseDocuments } from '@/modules/shows/data/horses-mutations';
import type {
  AddManualHorseInput,
  VerifyHorseDocumentInput,
  RemindHorseDocumentsInput,
} from '@/modules/shows/schemas';

/** Mutation hooks for the Horses screen. Add/verify revalidate server-side; router.refresh() pulls the re-rendered rows back into this view. */

export function useAddManualHorse(options?: { onSuccess?: () => void }) {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: AddManualHorseInput) => addManualHorse(input),
    onSuccess: () => {
      toast.success('Horse added');
      router.refresh();
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(readableError(error, 'Could not add this horse'));
    },
  });
}

export function useVerifyHorseDocument() {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: VerifyHorseDocumentInput) => verifyHorseDocument(input),
    onSuccess: () => {
      router.refresh();
    },
    onError: (error) => {
      toast.error(readableError(error, 'Could not update verification'));
    },
  });
}

/** No router.refresh() — sending a reminder doesn't change anything this screen reads. */
export function useRemindHorseDocuments() {
  return useMutation({
    mutationFn: (input: RemindHorseDocumentsInput) => remindHorseDocuments(input),
    onSuccess: () => {
      toast.success('Reminder sent');
    },
    onError: (error) => {
      toast.error(readableError(error, 'Could not send the reminder'));
    },
  });
}
