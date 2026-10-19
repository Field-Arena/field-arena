'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  saveTestTemplate,
  deleteTestTemplate,
  assignTestTemplateToClass,
  unassignTestFromClass,
  refreshClassesFromTemplate,
} from '@/modules/shows/data/mutations';
import type {
  SaveTestTemplateInput,
  AssignTestTemplateToClassInput,
  UnassignTestFromClassInput,
  RefreshClassesFromTemplateInput,
} from '@/modules/shows/schemas';
import type { RefreshClassesFromTemplateResult } from '@/modules/shows/types';
import { readableError } from '@/shared/lib/error-message';

function message(error: unknown, fallback: string): string {
  return readableError(error, fallback);
}

export function useSaveTestTemplate(options?: { onSuccess?: (id: string) => void }) {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: SaveTestTemplateInput) => saveTestTemplate(input),
    onSuccess: ({ id }, variables) => {
      toast.success(variables.id ? 'Test saved' : 'Test created');
      router.refresh();
      options?.onSuccess?.(id);
    },
    onError: (error) => {
      toast.error(message(error, 'Could not save this test'));
    },
  });
}

export function useDeleteTestTemplate() {
  const router = useRouter();

  return useMutation({
    mutationFn: (id: string) => deleteTestTemplate(id),
    onSuccess: () => {
      toast.success('Test deleted');
      router.refresh();
    },
    onError: (error) => {
      toast.error(message(error, 'Could not delete this test'));
    },
  });
}

export function useAssignTestToClass() {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: AssignTestTemplateToClassInput) => assignTestTemplateToClass(input),
    onSuccess: () => {
      toast.success('Test assigned to class — scoring is ready for it now');
      router.refresh();
    },
    onError: (error) => {
      toast.error(message(error, 'Could not assign this test to that class'));
    },
  });
}

export function useUnassignTestFromClass() {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: UnassignTestFromClassInput) => unassignTestFromClass(input),
    onSuccess: () => {
      toast.success('Test removed from that class');
      router.refresh();
    },
    onError: (error) => {
      toast.error(message(error, 'Could not remove this test from that class'));
    },
  });
}

function classCount(n: number): string {
  return `${String(n)} ${n === 1 ? 'class' : 'classes'}`;
}

export function useRefreshClassesFromTemplate(options?: {
  onSuccess?: (result: RefreshClassesFromTemplateResult) => void;
}) {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: RefreshClassesFromTemplateInput) => refreshClassesFromTemplate(input),
    onSuccess: (result) => {
      const { updated, skipped } = result;
      if (updated.length > 0) {
        toast.success(`Updated ${classCount(updated.length)} to the edited test`);
      } else if (skipped.length > 0) {
        toast.info('No classes updated — every class using this test has started scoring');
      } else {
        toast.info('No classes are using this test anymore');
      }
      router.refresh();
      options?.onSuccess?.(result);
    },
    onError: (error) => {
      toast.error(message(error, 'Could not update the classes using this test'));
    },
  });
}
