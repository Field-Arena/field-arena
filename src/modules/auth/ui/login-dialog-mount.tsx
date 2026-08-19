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
  const openDialog = useLoginDialogStore((state) => state.openDialog);
  const openWithNotice = useLoginDialogStore((state) => state.openWithNotice);

  useEffect(() => {
    if (message) openWithNotice(message);
    else if (wantsSignIn) openDialog();
  }, [message, wantsSignIn, openDialog, openWithNotice]);

  return null;
}
