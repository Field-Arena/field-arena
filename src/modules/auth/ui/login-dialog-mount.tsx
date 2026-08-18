'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLoginDialogStore } from '@/modules/auth/store';

/**
 * Opens the login dialog from the URL — `?notice=` with a message, or a bare
 * `?signin=1` to just open it.
 *
 * `?notice=` is how a just-verified but un-provisioned sign-up lands:
 * verifyEmailCode signs it out and redirects here, and the message shows inside
 * the dialog rather than on the standalone /login page. `?signin=1` is where
 * logout lands (see useSignOut) so signing back in reuses the same dialog the
 * whole app signs in with, not the /login page. Read once on mount, like the
 * demo dialog's `?demo=1` deep link.
 */
const NOTICES: Record<string, string> = {
  pending_invite:
    'Your email is confirmed, but this account is not set up on Field & Arena yet. Ask your organizer or a platform admin to invite you, then sign in.',
};

export function LoginDialogMount() {
  const params = useSearchParams();
  const key = params.get('notice');
  const message = key ? NOTICES[key] : undefined;
  const wantsSignIn = params.get('signin') === '1';
  const openDialog = useLoginDialogStore((state) => state.openDialog);
  const openWithNotice = useLoginDialogStore((state) => state.openWithNotice);

  useEffect(() => {
    if (message) openWithNotice(message);
    else if (wantsSignIn) openDialog();
  }, [message, wantsSignIn, openDialog, openWithNotice]);

  return null;
}
