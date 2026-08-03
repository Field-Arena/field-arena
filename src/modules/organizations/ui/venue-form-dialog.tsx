'use client';

import { useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2Icon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/shadcn/dialog';
import { Button } from '@/shared/ui/shadcn/button';
import { Input } from '@/shared/ui/shadcn/input';
import { Label } from '@/shared/ui/shadcn/label';
import { RING_SIZES, MAX_RINGS } from '../constants';
import { venueDetailsSchema, type VenueDetailsInput } from '../schemas';
import { useCreateVenue, useUpdateVenue } from '../hooks/use-venue-mutations';
import { StableConfigDialog } from './stable-config-dialog';
import { VT_LABEL, VT_INPUT, VT_ROW_INPUT, VT_NOTE, VT_SECTION_LABEL } from './venue-tokens';
import type { VenueListItem, VenueRing, VenueStable } from '../types';

function detailsDefaults(venue?: VenueListItem): VenueDetailsInput {
  return {
    name: venue?.name ?? '',
    address: venue?.address ?? '',
    website: venue?.website ?? '',
    phone: venue?.phone ?? '',
    contact: venue?.contact ?? '',
  };
}

/**
 * Add/edit for one venue in the org's reusable library — showstaff.html's
 * locationEditorHtml (~line 5296), one dialog for name/address/contact plus
 * a saved ring layout and a saved stable/stall layout, all persisted
 * together on Save (see the createVenue/updateVenue doc comments for why
 * there is no separate save path for rings/stables).
 *
 * The ring editor is a deliberate copy of Show Manager's VenueCard
 * (modules/shows/ui/show-manager/venue-card.tsx) — same "Number of
 * rings/arenas" count field resizing a row list of name+size inputs, same
 * row layout and tokens (see venue-tokens.ts's doc comment for why those are
 * a local copy rather than an import). This dialog also manages rings and
 * stables as plain component state rather than react-hook-form fields, the
 * same way VenueCard manages its own ring rows with `useState` — the form
 * only wraps name/address/website/phone/contact (see venueDetailsSchema).
 */
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
      (_, i) => rings[i] ?? { name: `Ring ${String(i + 1)}`, size: 'standard' as const }
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
    setStables([...stables, { name: `Stable ${String(stables.length + 1)}`, rowCount: 1, stalls: [] }]);
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

        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-hunter-deep">
              {isEdit ? 'Edit location' : 'Add new location'}
            </DialogTitle>
            <DialogDescription>
              Build a venue once — name, address, contact info, and how many rings/arenas it has —
              then pick it up on any show in Setup&rsquo;s Competition Locations card instead of
              rebuilding it every time.
            </DialogDescription>
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
            className="space-y-4"
            noValidate
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="vf-name">
                  Location name <span className="text-status-danger">*</span>
                </Label>
                <Input id="vf-name" placeholder="e.g. Wills Park Equestrian" {...form.register('name')} />
                {errors.name && (
                  <p role="alert" className="text-[13px] text-status-danger">
                    {errors.name.message}
                  </p>
                )}
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="vf-address">Address</Label>
                <Input id="vf-address" {...form.register('address')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vf-website">Website</Label>
                <Input id="vf-website" type="url" {...form.register('website')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vf-phone">Phone</Label>
                <Input id="vf-phone" type="tel" {...form.register('phone')} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="vf-contact">Contact</Label>
                <Input id="vf-contact" {...form.register('contact')} />
              </div>
            </div>

            <div>
              <label className={VT_SECTION_LABEL}>Rings / arenas at this location</label>
              <div className="mb-2.5 max-w-[160px]">
                <label htmlFor="vf-ring-count" className={VT_LABEL}>
                  Number of rings/arenas
                </label>
                <input
                  id="vf-ring-count"
                  type="number"
                  min={0}
                  max={MAX_RINGS}
                  value={rings.length}
                  className={VT_INPUT}
                  onChange={(e) => {
                    setRingCount(e.target.value);
                  }}
                />
              </div>

              {rings.length === 0 ? (
                <p className="mb-1 text-[13px] italic text-[#7A8781]">No rings yet — add at least one</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {rings.map((ring, i) => (
                    <div key={i} className="grid grid-cols-[22px_minmax(0,1fr)_170px] items-center gap-2.5">
                      <span className="text-[13px] font-bold text-forest">{i + 1}</span>
                      <input
                        value={ring.name}
                        placeholder="e.g. Ring 1, Warm-up Ring"
                        className={VT_ROW_INPUT}
                        onChange={(e) => {
                          renameRing(i, e.target.value);
                        }}
                      />
                      <select
                        value={ring.size}
                        className={VT_ROW_INPUT + ' appearance-none'}
                        onChange={(e) => {
                          resizeRing(i, e.target.value as VenueRing['size']);
                        }}
                      >
                        {RING_SIZES.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-[#E9EDEB] pt-4">
              <label className={VT_SECTION_LABEL}>Stables at this location</label>
              <p className={VT_NOTE}>
                Build the real stall layout once here — name each stall, mark any out of service —
                and every show at this venue picks it up ready to go, with the same stall names on
                the printed signage every time.
              </p>

              {stables.length === 0 ? (
                <p className="mb-2.5 text-[13px] italic text-[#7A8781]">No stables yet — add at least one</p>
              ) : (
                <div className="mb-2.5 flex flex-col gap-2">
                  {stables.map((stable, i) => {
                    const stallCount = stable.stalls.length;
                    const closedCount = stable.stalls.filter((s) => s.closed).length;
                    return (
                      <div key={i} className="rounded-[10px] border border-[#EDF0EE] p-3">
                        <div className="mb-2 flex items-center gap-2">
                          <input
                            value={stable.name}
                            aria-label="Stable name"
                            placeholder="e.g. Stable A, North Barn"
                            className={VT_ROW_INPUT + ' flex-1'}
                            onChange={(e) => {
                              renameStable(i, e.target.value);
                            }}
                          />
                          <label className="flex items-center gap-1.5 whitespace-nowrap text-[11px] text-[#7A8781]">
                            Rows
                            <input
                              type="number"
                              min={1}
                              value={stable.rowCount}
                              className="w-[52px] rounded-lg border border-[#D9E1DD] px-2 py-1.5 text-[12.5px]"
                              onChange={(e) => {
                                setStableRows(i, parseInt(e.target.value, 10) || 1);
                              }}
                            />
                          </label>
                          <button
                            type="button"
                            className="whitespace-nowrap text-[12.5px] font-semibold text-status-danger hover:underline"
                            onClick={() => {
                              removeStable(i);
                            }}
                          >
                            Remove
                          </button>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2.5">
                          <span className="text-[12.5px] text-[#6E7C76]">
                            {stallCount
                              ? `${String(stallCount)} stall${stallCount === 1 ? '' : 's'} built${closedCount ? ` · ${String(closedCount)} out of service` : ''}`
                              : 'No stalls built yet'}
                          </span>
                          <button
                            type="button"
                            className="rounded-[9px] border border-[#D9E1DD] bg-white px-3 py-1.5 text-[12.5px] font-semibold text-[#0D2C23] transition-colors hover:border-gold"
                            onClick={() => {
                              setConfiguringStable(i);
                            }}
                          >
                            {stallCount ? 'Configure stalls →' : 'Build stalls →'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <button
                type="button"
                className="rounded-[10px] border border-[#D9E1DD] bg-white px-[15px] py-2.5 text-[13px] font-semibold text-[#0D2C23] transition-colors hover:border-gold"
                onClick={addStable}
              >
                + Add stable
              </button>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2Icon className="animate-spin" aria-hidden />}
                {isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Save location'}
              </Button>
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
