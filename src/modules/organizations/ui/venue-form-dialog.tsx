'use client';

import { useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2Icon } from 'lucide-react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/shadcn/dialog';
import { GhostButton, GoldButton } from '@/shared/ui/organizer/buttons';
import { IconX } from '@/shared/ui/organizer/icons';
import {
  ModalEyebrow,
  modalBodyClass,
  modalContentClass,
  modalFooterClass,
} from '@/shared/ui/organizer/modal-kit';
import { cn } from '@/shared/lib/utils';
import { MAX_RINGS } from '@/modules/organizations/constants';
import { venueDetailsSchema, type VenueDetailsInput } from '@/modules/organizations/schemas';
import { useCreateVenue, useUpdateVenue } from '@/modules/organizations/hooks/use-venue-mutations';
import { StableConfigDialog } from '@/modules/organizations/ui/stable-config-dialog';
import { VenueDetailsFields } from '@/modules/organizations/ui/venue-details-fields';
import { VenueRingEditor } from '@/modules/organizations/ui/venue-ring-editor';
import { VenueStableList } from '@/modules/organizations/ui/venue-stable-list';
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

export function VenueFormDialog({ venue, trigger }: { venue?: VenueListItem; trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [rings, setRings] = useState<VenueRing[]>(venue?.rings ?? []);
  const [stables, setStables] = useState<VenueStable[]>(venue?.stables ?? []);
  const [configuringStable, setConfiguringStable] = useState<number | null>(null);
  const isEdit = !!venue;

  const form = useForm<VenueDetailsInput>({
    resolver: zodResolver(venueDetailsSchema),
    defaultValues: detailsDefaults(venue),
  });
  const { errors } = form.formState;

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

  function resetDraft() {
    form.reset(detailsDefaults(venue));
    setRings(venue?.rings ?? []);
    setStables(venue?.stables ?? []);
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

  const activeStable = configuringStable != null ? (stables[configuringStable] ?? null) : null;

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (next) resetDraft();
        }}
      >
        <DialogTrigger asChild>{trigger}</DialogTrigger>

        <DialogContent
          className={cn(modalContentClass, 'flex max-h-[85vh] flex-col sm:max-w-[640px]')}
          showCloseButton={false}
        >
          <DialogHeader className={modalBodyClass + ' flex-none gap-1.5 pb-0'}>
            <ModalEyebrow>Venues</ModalEyebrow>
            <DialogTitle className="font-serif text-2xl font-semibold text-[#0D2C23]">
              {isEdit ? 'Edit location' : 'Add new location'}
            </DialogTitle>
            <DialogDescription>
              Build a venue once — name, address, contact info, and how many rings/arenas it has —
              then pick it up on any show in Setup&rsquo;s Competition Locations card instead of
              rebuilding it every time.
            </DialogDescription>
            <DialogClose className="absolute top-4 right-4 flex size-7 items-center justify-center rounded-full bg-[#E6F1EA] text-[#1A5B3C] transition-colors hover:bg-[#D5E8DC]">
              <IconX size={13} />
              <span className="sr-only">Close</span>
            </DialogClose>
          </DialogHeader>

          <form
            onSubmit={(event) => {
              void form.handleSubmit((values) => {
                if (isEdit) {
                  update.mutate({ ...values, rings, stables, id: venue.id });
                } else {
                  create.mutate({ ...values, rings, stables });
                }
              })(event);
            }}
            className="flex min-h-0 flex-1 flex-col"
            noValidate
          >
            <div className={modalBodyClass + ' min-h-0 flex-1 overflow-y-auto'}>
              <VenueDetailsFields register={form.register} errors={errors} />

              <VenueRingEditor
                rings={rings}
                onSetCount={setRingCount}
                onRename={renameRing}
                onResize={resizeRing}
              />

              <VenueStableList
                stables={stables}
                onRename={renameStable}
                onSetRows={setStableRows}
                onRemove={removeStable}
                onAdd={addStable}
                onConfigure={setConfiguringStable}
              />
            </div>

            <DialogFooter className={modalFooterClass}>
              <GhostButton
                type="button"
                onClick={() => {
                  setOpen(false);
                }}
              >
                Cancel
              </GhostButton>
              <GoldButton type="submit" disabled={isPending}>
                {isPending && <Loader2Icon className="size-4 animate-spin" aria-hidden />}
                {isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Save location'}
              </GoldButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <StableConfigDialog
        stable={activeStable}
        open={configuringStable != null}
        onOpenChange={(next) => {
          if (!next) setConfiguringStable(null);
        }}
        onChange={(next) => {
          if (configuringStable == null) return;
          setStables(stables.map((s, idx) => (idx === configuringStable ? next : s)));
        }}
      />
    </>
  );
}
