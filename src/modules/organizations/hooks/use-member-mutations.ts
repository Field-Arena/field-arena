'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { readableError } from '@/shared/lib/error-message';
import {
  addMembersToShow,
  createMember,
  deleteMember,
  importMembers,
  updateMember,
} from '@/modules/organizations/data/mutations';
import type {
  AddMembersToShowInput,
  CreateMemberInput,
  ImportMembersInput,
  UpdateMemberInput,
} from '@/modules/organizations/schemas';

const message = readableError;

interface Options {
  onSuccess?: () => void;
}

export function useCreateMember(options?: Options) {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: CreateMemberInput) => createMember(input),
    onSuccess: () => {
      toast.success('Added to your database');
      router.refresh();
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(message(error, 'Could not add this person'));
    },
  });
}

export function useUpdateMember(options?: Options) {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: UpdateMemberInput) => updateMember(input),
    onSuccess: () => {
      toast.success('Saved');
      router.refresh();
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(message(error, 'Could not save those changes'));
    },
  });
}

export function useDeleteMember(options?: Options) {
  const router = useRouter();

  return useMutation({
    mutationFn: (id: string) => deleteMember({ id }),
    onSuccess: () => {
      toast.success('Removed from your database');
      router.refresh();
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(message(error, 'Could not remove this person'));
    },
  });
}

export function useImportMembers(options?: Options) {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: ImportMembersInput) => importMembers(input),
    onSuccess: ({ added, skipped }) => {
      toast.success(
        skipped > 0
          ? `${String(added)} added, ${String(skipped)} already in your database`
          : `${String(added)} added`,
      );
      router.refresh();
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(message(error, 'Could not import that list'));
    },
  });
}

export function useAddMembersToShow(options?: Options) {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: AddMembersToShowInput) => addMembersToShow(input),
    onSuccess: ({ added, skipped, ridersSkipped }) => {
      const notes: string[] = [];
      if (skipped > 0) notes.push(`${String(skipped)} already on the show`);

      if (ridersSkipped > 0) {
        notes.push(
          `${String(ridersSkipped)} rider${ridersSkipped === 1 ? '' : 's'} skipped — riders join by entering the show themselves`,
        );
      }

      toast.success(
        notes.length > 0
          ? `${String(added)} added · ${notes.join(' · ')}`
          : `${String(added)} added`,
      );
      router.refresh();
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(message(error, 'Could not add them to that show'));
    },
  });
}
