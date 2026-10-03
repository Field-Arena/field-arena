'use client';

import type { ReactNode } from 'react';
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
import { useVenueForm } from '@/modules/organizations/hooks/use-venue-form';
import { StableConfigDialog } from '@/modules/organizations/ui/stable-config-dialog';
import { VenueDetailsFields } from '@/modules/organizations/ui/venue-details-fields';
import { VenueRingEditor } from '@/modules/organizations/ui/venue-ring-editor';
import { VenueStableList } from '@/modules/organizations/ui/venue-stable-list';
import type { VenueListItem } from '@/modules/organizations/types';

export function VenueFormDialog({ venue, trigger }: { venue?: VenueListItem; trigger: ReactNode }) {
  const {
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
  } = useVenueForm(venue);
  const { errors } = form.formState;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
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
              void form.handleSubmit(submit)(event);
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
                  onOpenChange(false);
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
        onChange={setActiveStable}
      />
    </>
  );
}
