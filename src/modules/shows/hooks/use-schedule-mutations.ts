'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { readableError } from '@/shared/lib/error-message';
import {
  moveClassToRingDay,
  reorderRide,
  scratchEntry,
  setClassDuration,
  updateScheduleRules,
} from '../data/mutations';
import type {
  MoveClassToRingDayInput,
  ReorderRideInput,
  ScratchEntryInput,
  SetClassDurationInput,
  UpdateScheduleRulesInput,
} from '../schemas';

/**
 * Master Schedule's in-place edits.
 *
 * Every one of these changes an input the schedule is built from, so the page
 * refresh that follows is what rebuilds it — there is no stored schedule to
 * invalidate.
 */

const message = readableError;

export function useUpdateScheduleRules() {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: UpdateScheduleRulesInput) => updateScheduleRules(input),
    onSuccess: () => {
      router.refresh();
    },
    onError: (error) => {
      toast.error(message(error, 'Could not save that rule'));
    },
  });
}

export function useSetClassDuration() {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: SetClassDurationInput) => setClassDuration(input),
    onSuccess: () => {
      toast.success('Ride time updated — schedule rebuilt');
      router.refresh();
    },
    onError: (error) => {
      toast.error(message(error, 'Could not change the ride time'));
    },
  });
}

export function useMoveClassToRingDay() {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: MoveClassToRingDayInput) => moveClassToRingDay(input),
    onSuccess: () => {
      toast.success('Class moved — schedule rebuilt');
      router.refresh();
    },
    onError: (error) => {
      toast.error(message(error, 'Could not move the class'));
    },
  });
}

export function useScratchEntry() {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: ScratchEntryInput) => scratchEntry(input),
    onSuccess: () => {
      toast.success('Scratched — they stay on the schedule, marked as scratched');
      router.refresh();
    },
    onError: (error) => {
      toast.error(message(error, 'Could not scratch this rider'));
    },
  });
}

export function useReorderRide() {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: ReorderRideInput) => reorderRide(input),
    onSuccess: () => {
      router.refresh();
    },
    onError: (error) => {
      toast.error(message(error, 'Could not reorder that ride'));
    },
  });
}
