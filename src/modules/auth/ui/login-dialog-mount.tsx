'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLoginDialogStore } from '../store';

/**
 * Opens the login dialog with a notice when the URL carries `?notice=`.
 *
 * This is how a just-verified but un-provisioned sign-up lands: verifyEmailCode
 * signs it out and redirects here, and the message shows inside the dialog rather
 * than on the standalone /login page. Read once on mount, like the demo dialog's
 * `?demo=1` deep link.
 */
const NOTICES: Record<string, string> = {
  pending_invite:
    'Your email is confirmed, but this account is not set up on Field & Arena yet. Ask your organizer or a platform admin to invite you, then sign in.',
};

export function LoginDialogMount() {
  const params = useSearchParams();
  const key = params.get('notice');
  const message = key ? NOTICES[key] : undefined;
  const openWithNotice = useLoginDialogStore((state) => state.openWithNotice);

  useEffect(() => {
    if (message) openWithNotice(message);
  }, [message, openWithNotice]);

  return null;
}
