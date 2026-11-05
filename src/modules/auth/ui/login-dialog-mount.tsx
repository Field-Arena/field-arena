'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLoginDialogStore } from '@/modules/auth/store';

const NOTICES: Record<string, string> = {
  pending_invite:
    'Your email is confirmed, but this account is not set up on Field & Arena yet. Ask your organizer or a platform admin to invite you, then sign in.',
};

export function LoginDialogMount() {
  const params = useSearchParams();
  const key = params.get('notice');
  const message = key ? NOTICES[key] : undefined;
  const wantsSignIn = params.get('signin') === '1';
  const next = params.get('next');
  const openDialog = useLoginDialogStore((state) => state.openDialog);
  const openWithNotice = useLoginDialogStore((state) => state.openWithNotice);
  const setNext = useLoginDialogStore((state) => state.setNext);

  // The server validates `next` again before redirecting to it.
  useEffect(() => {
    setNext(next);
  }, [next, setNext]);

  useEffect(() => {
    if (message) openWithNotice(message);
    else if (wantsSignIn) openDialog();
  }, [message, wantsSignIn, openDialog, openWithNotice]);

  return null;
}
