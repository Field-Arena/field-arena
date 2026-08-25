'use client';

import { useEffect, useRef, useState } from 'react';
import { useSignWaiver } from '@/modules/riders/hooks/use-waiver-mutations';
import type { WaiverSignatureRow } from '@/modules/riders/types';

const SCROLL_BOTTOM_THRESHOLD_PX = 10;

export function useWaiverForm({
  showId,
  existingSignature,
}: {
  showId: string;
  existingSignature: WaiverSignatureRow | null;
}) {
  const textRef = useRef<HTMLDivElement>(null);
  const [scrolledToBottom, setScrolledToBottom] = useState(!!existingSignature);
  const [fullName, setFullName] = useState(existingSignature?.full_name ?? '');
  const [signatureDate, setSignatureDate] = useState(
    existingSignature?.signature_date ?? new Date().toISOString().slice(0, 10),
  );
  const [agreed, setAgreed] = useState(!!existingSignature);
  const signWaiver = useSignWaiver();
  const signed = !!existingSignature || signWaiver.isSuccess;

  const checkScrolled = () => {
    const el = textRef.current;
    if (!el || scrolledToBottom) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - SCROLL_BOTTOM_THRESHOLD_PX) {
      setScrolledToBottom(true);
    }
  };

  useEffect(() => {
    checkScrolled();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canSign =
    scrolledToBottom && fullName.trim().length > 0 && signatureDate.trim().length > 0 && agreed;

  return {
    textRef,
    scrolledToBottom,
    checkScrolled,
    fullName,
    setFullName,
    signatureDate,
    setSignatureDate,
    agreed,
    setAgreed,
    signed,
    canSign,
    isPending: signWaiver.isPending,
    sign: () => {
      signWaiver.mutate({ showId, fullName: fullName.trim(), signatureDate });
    },
  };
}
