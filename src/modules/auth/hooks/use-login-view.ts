'use client';

import { useState } from 'react';
import type { LoginView } from '@/modules/auth/types';

/** Owns which login panel is showing and its transient error/notice state. */
export function useLoginViewState() {
  const [view, setView] = useState<LoginView>('login');
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [code, setCode] = useState('');

  function show(next: LoginView) {
    setView(next);
    setFormError(null);
    setNotice(null);
    setResetSent(false);
  }

  return {
    view,
    setView,
    show,
    formError,
    setFormError,
    notice,
    setNotice,
    resetSent,
    setResetSent,
    code,
    setCode,
  };
}
