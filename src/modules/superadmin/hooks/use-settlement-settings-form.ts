'use client';

import { useState } from 'react';
import { useUpdateSettlement } from '@/modules/superadmin/hooks/use-settlement-mutations';

/** Owns the payout cadence / holdback draft state, its validity, and the save mutation. */
export function useSettlementSettingsForm({
  orgId,
  payoutCadence,
  holdbackPercent,
}: {
  orgId: string;
  payoutCadence: string;
  holdbackPercent: number | null;
}) {
  const [cadence, setCadence] = useState(payoutCadence);
  const [holdback, setHoldback] = useState(holdbackPercent === null ? '' : String(holdbackPercent));
  const { mutate, isPending } = useUpdateSettlement();

  const trimmed = holdback.trim();
  const parsed = trimmed === '' ? null : Number(trimmed);
  const invalid = parsed !== null && (!Number.isFinite(parsed) || parsed < 0 || parsed > 100);
  const dirty =
    cadence !== payoutCadence ||
    (parsed ?? null) !== (holdbackPercent === 0 ? null : holdbackPercent);

  function save() {
    mutate({
      id: orgId,
      payoutCadence: cadence as 'daily' | 'weekly',
      holdbackPercent: parsed,
    });
  }

  return {
    cadence,
    setCadence,
    holdback,
    setHoldback,
    invalid,
    dirty,
    isPending,
    save,
  };
}
