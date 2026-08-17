'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { setClassPanel } from '../data/mutations';
import type { SetClassPanelInput } from '../schemas';

/**
 * Saves the head-judge / scribe panel for a set of classes — used by the
 * Setup → Venue "Assign Judges" dialog. The success toast and navigation stay
 * with the caller so it can close its own dialog.
 */
export function useSetClassPanel() {
  return useMutation({
    mutationFn: (input: SetClassPanelInput) => setClassPanel(input),
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : 'Could not save the panel'),
  });
}
