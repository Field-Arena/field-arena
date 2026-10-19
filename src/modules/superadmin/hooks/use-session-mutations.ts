'use client';

import { useTransition } from 'react';
import { unstable_rethrow } from 'next/navigation';
import { toast } from 'sonner';
import {
  enterAsOrganizer,
  exitOrganizerView,
  setPreviewShow,
  setRailRole,
} from '../data/session-mutations';
import { readableError } from '@/shared/lib/error-message';

/* The "view as" Server Actions all end in `redirect()`. Running them inside a
 * transition keeps `isPending` true until the destination has rendered; the
 * redirect reaches the client as a rejected promise, so it is re-thrown for
 * Next's RedirectBoundary and only genuine failures surface as a toast. */
function useRedirectingAction<TArgs extends unknown[]>(
  action: (...args: TArgs) => Promise<void>,
  errorFallback: string,
) {
  const [isPending, startTransition] = useTransition();

  function run(...args: TArgs): void {
    startTransition(async () => {
      try {
        await action(...args);
      } catch (error) {
        unstable_rethrow(error);
        toast.error(readableError(error, errorFallback));
      }
    });
  }

  return { isPending, run };
}

export function useEnterAsOrganizer() {
  const { isPending, run } = useRedirectingAction(
    enterAsOrganizer,
    'Could not enter this workspace',
  );
  return { isPending, enter: run };
}

export function useExitOrganizerView() {
  const { isPending, run } = useRedirectingAction(
    exitOrganizerView,
    'Could not leave the organizer view',
  );
  return { isPending, exit: run };
}

export function useSetRailRole() {
  const { isPending, run } = useRedirectingAction(setRailRole, 'Could not switch role');
  return { isPending, setRole: run };
}

export function useSetPreviewShow() {
  const { isPending, run } = useRedirectingAction(setPreviewShow, 'Could not open this preview');
  return { isPending, preview: run };
}
