'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { readableError } from '@/shared/lib/error-message';
import {
  createHorse,
  deleteHorse,
  deleteHorseDocument,
  updateHorse,
  uploadHorseDocument,
} from '@/modules/riders/data/mutations';
import type { HorseCreateInput, HorseDeleteInput, HorseUpdateInput } from '@/modules/riders/schemas';

export function useCreateHorse(options?: { onSuccess?: () => void }) {
  return useMutation({
    mutationFn: (input: HorseCreateInput) => createHorse(input),
    onSuccess: () => {
      toast.success('Horse added.');
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(readableError(error, 'Could not add this horse'));
    },
  });
}

export function useUpdateHorse() {
  return useMutation({
    mutationFn: (input: HorseUpdateInput) => updateHorse(input),
    onError: (error) => {
      toast.error(readableError(error, 'Could not save this horse'));
    },
  });
}

export function useDeleteHorse(options?: { onSuccess?: () => void }) {
  return useMutation({
    mutationFn: (input: HorseDeleteInput) => deleteHorse(input),
    onSuccess: () => {
      toast.success('Horse removed.');
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(readableError(error, 'Could not remove this horse'));
    },
  });
}

export function useUploadHorseDocument(options?: { onSuccess?: () => void }) {
  return useMutation({
    mutationFn: (formData: FormData) => uploadHorseDocument(formData),
    onSuccess: () => {
      toast.success('Document uploaded.');
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(readableError(error, 'Could not upload this document'));
    },
  });
}

export function useDeleteHorseDocument() {
  return useMutation({
    mutationFn: (input: { horseId: string; requirementId: string }) => deleteHorseDocument(input),
    onSuccess: () => {
      toast.success('Document removed.');
    },
    onError: (error) => {
      toast.error(readableError(error, 'Could not remove this document'));
    },
  });
}
