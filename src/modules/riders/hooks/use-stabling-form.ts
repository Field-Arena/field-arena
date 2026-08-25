'use client';

import { useState } from 'react';
import { useSaveStablingDates } from '@/modules/riders/hooks/use-stabling-mutations';
import type { OrderRow } from '@/modules/riders/types';

export function useStablingForm(order: OrderRow | null) {
  const [arrivalDate, setArrivalDate] = useState(order?.arrival_date ?? '');
  const [departureDate, setDepartureDate] = useState(order?.departure_date ?? '');
  const saveStabling = useSaveStablingDates();

  function submit() {
    if (!order) return;
    saveStabling.mutate({ orderId: order.id, arrivalDate, departureDate });
  }

  return {
    arrivalDate,
    setArrivalDate,
    departureDate,
    setDepartureDate,
    submit,
    isPending: saveStabling.isPending,
    isSuccess: saveStabling.isSuccess,
    canSubmit: Boolean(order) && arrivalDate !== '' && departureDate !== '',
  };
}
