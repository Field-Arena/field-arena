'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { readableError } from '@/shared/lib/error-message';
import {
  addCatalogGroup,
  addCustomClass,
  addQualTypePreset,
  createTocClass,
  removeCatalogGroup,
  updateTicketWindow,
} from '@/modules/shows/data/mutations';
import type {
  AddCatalogGroupInput,
  AddCustomClassInput,
  AddQualTypePresetInput,
  CreateTocClassInput,
  UpdateTicketWindowInput,
} from '@/modules/shows/schemas';

const message = readableError;

export function useUpdateTicketWindow() {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: UpdateTicketWindowInput) => updateTicketWindow(input),
    onSuccess: () => {
      toast.success('Ticket sales window saved');
      router.refresh();
    },
    onError: (error) => {
      toast.error(message(error, 'Could not save the ticket sales window'));
    },
  });
}

export function useAddCatalogGroup() {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: AddCatalogGroupInput) => addCatalogGroup(input),
    onSuccess: ({ added }, { group }) => {
      toast.success(
        added === 0
          ? `${group} was already on this show`
          : `${group} added — ${String(added)} ${added === 1 ? 'class' : 'classes'}`,
      );
      router.refresh();
    },
    onError: (error) => {
      toast.error(message(error, 'Could not add these classes'));
    },
  });
}

export function useRemoveCatalogGroup() {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: { showId: string; group: string }) => removeCatalogGroup(input),
    onSuccess: (_data, { group }) => {
      toast.success(`${group} removed`);
      router.refresh();
    },
    onError: (error) => {
      toast.error(message(error, 'Could not remove these classes'));
    },
  });
}

export function useAddCustomClass(options?: { onSuccess?: () => void }) {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: AddCustomClassInput) => addCustomClass(input),
    onSuccess: () => {
      toast.success('Class added');
      router.refresh();
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(message(error, 'Could not add the class'));
    },
  });
}

export function useCreateTocClass(options?: { onSuccess?: () => void }) {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: CreateTocClassInput) => createTocClass(input),
    onSuccess: () => {
      toast.success('Test of Choice created');
      router.refresh();
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(message(error, 'Could not create the Test of Choice'));
    },
  });
}

export function useAddQualTypePreset() {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: AddQualTypePresetInput) => addQualTypePreset(input),
    onSuccess: (_data, { body }) => {
      toast.success(`${body} qualifying fee added — enable it on Event Sales to put it on sale`);
      router.refresh();
    },
    onError: (error) => {
      toast.error(message(error, 'Could not add the qualifying type'));
    },
  });
}
