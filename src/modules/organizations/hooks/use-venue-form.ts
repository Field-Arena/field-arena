'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MAX_RINGS } from '@/modules/organizations/constants';
import { venueDetailsSchema, type VenueDetailsInput } from '@/modules/organizations/schemas';
import { useCreateVenue, useUpdateVenue } from '@/modules/organizations/hooks/use-venue-mutations';
import type { VenueListItem, VenueRing, VenueStable } from '@/modules/organizations/types';

function detailsDefaults(venue?: VenueListItem): VenueDetailsInput {
  return {
    name: venue?.name ?? '',
    address: venue?.address ?? '',
    website: venue?.website ?? '',
    phone: venue?.phone ?? '',
    contact: venue?.contact ?? '',
  };
}

export function useVenueForm(venue?: VenueListItem) {
  const [open, setOpen] = useState(false);
  const [rings, setRings] = useState<VenueRing[]>(venue?.rings ?? []);
  const [stables, setStables] = useState<VenueStable[]>(venue?.stables ?? []);
  const [configuringStable, setConfiguringStable] = useState<number | null>(null);
  const isEdit = !!venue;

  const form = useForm<VenueDetailsInput>({
    resolver: zodResolver(venueDetailsSchema),
    defaultValues: detailsDefaults(venue),
  });

  const create = useCreateVenue({
    onSuccess: () => {
      setOpen(false);
    },
  });
  const update = useUpdateVenue({
    onSuccess: () => {
      setOpen(false);
    },
  });
  const isPending = create.isPending || update.isPending;

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      form.reset(detailsDefaults(venue));
      setRings(venue?.rings ?? []);
      setStables(venue?.stables ?? []);
    }
  }

  function setRingCount(raw: string) {
    const count = Math.max(0, Math.min(MAX_RINGS, Number(raw) || 0));
    const next = Array.from(
      { length: count },
      (_, i) => rings[i] ?? { name: `Ring ${String(i + 1)}`, size: 'standard' as const },
    );
    setRings(next);
  }

  function renameRing(i: number, name: string) {
    setRings(rings.map((r, idx) => (idx === i ? { ...r, name } : r)));
  }

  function resizeRing(i: number, size: VenueRing['size']) {
    setRings(rings.map((r, idx) => (idx === i ? { ...r, size } : r)));
  }

  function addStable() {
    setStables([
      ...stables,
      { name: `Stable ${String(stables.length + 1)}`, rowCount: 1, stalls: [] },
    ]);
  }

  function removeStable(i: number) {
    setStables(stables.filter((_, idx) => idx !== i));
  }

  function renameStable(i: number, name: string) {
    setStables(stables.map((s, idx) => (idx === i ? { ...s, name } : s)));
  }

  function setStableRows(i: number, rowCount: number) {
    setStables(stables.map((s, idx) => (idx === i ? { ...s, rowCount } : s)));
  }

  function setActiveStable(next: VenueStable) {
    if (configuringStable == null) return;
    setStables(stables.map((s, idx) => (idx === configuringStable ? next : s)));
  }

  function submit(values: VenueDetailsInput) {
    if (isEdit) update.mutate({ ...values, rings, stables, id: venue.id });
    else create.mutate({ ...values, rings, stables });
  }

  const activeStable = configuringStable != null ? (stables[configuringStable] ?? null) : null;

  return {
    open,
    onOpenChange,
    isEdit,
    form,
    rings,
    stables,
    configuringStable,
    setConfiguringStable,
    activeStable,
    setActiveStable,
    isPending,
    setRingCount,
    renameRing,
    resizeRing,
    addStable,
    removeStable,
    renameStable,
    setStableRows,
    submit,
  };
}
