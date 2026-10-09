'use client';

import { useEffect } from 'react';
import { useEntryCartStore } from '@/modules/riders/store';
import type { ClassWithCapacity, HorseWithDocumentUrls } from '@/modules/riders/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/shadcn/card';
import { Button } from '@/shared/ui/shadcn/button';

export function ClassHorseAssignment({
  classes,
  horses,
}: {
  classes: ClassWithCapacity[];
  horses: HorseWithDocumentUrls[];
}) {
  const selectedClassIds = useEntryCartStore((state) => state.selectedClassIds);
  const classHorseAssignments = useEntryCartStore((state) => state.classHorseAssignments);
  const setClassHorse = useEntryCartStore((state) => state.setClassHorse);
  const addClassHorseSlot = useEntryCartStore((state) => state.addClassHorseSlot);
  const removeClassHorseSlot = useEntryCartStore((state) => state.removeClassHorseSlot);
  const fillEmptyHorseSlots = useEntryCartStore((state) => state.fillEmptyHorseSlots);

  /* A rider with exactly one horse rides it in every class — fill it in for
   * any class picked before that horse was added, so there is nothing to
   * choose here. */
  const onlyHorseId = horses.length === 1 ? (horses[0]?.id ?? null) : null;
  useEffect(() => {
    if (onlyHorseId) fillEmptyHorseSlots(onlyHorseId);
  }, [onlyHorseId, selectedClassIds, fillEmptyHorseSlots]);

  const selected = classes.filter((cls) => selectedClassIds.has(cls.id));
  if (selected.length === 0) return null;

  const onlyHorse = horses.length === 1 ? horses[0] : undefined;
  if (onlyHorse) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your horse</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-forest text-sm">
            ✓ You&apos;re riding <b>{onlyHorse.name}</b> in every class you picked. Add another
            horse above if you want to ride a different one.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assign a horse to each class</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {horses.length === 0 && (
          <p className="text-fa-muted text-sm">Add a horse above first, then assign it here.</p>
        )}
        {selected.map((cls) => {
          const slots = classHorseAssignments[cls.id] ?? [null];
          return (
            <div key={cls.id}>
              <div className="text-forest mb-1.5 text-sm font-medium">
                {(cls.display_name?.trim() ?? '') || cls.label}
              </div>
              <div className="space-y-1.5">
                {slots.map((horseId, index) => (
                  <div key={`${cls.id}-${index.toString()}`} className="flex items-center gap-2">
                    <select
                      value={horseId ?? ''}
                      onChange={(event) => {
                        setClassHorse(cls.id, index, event.target.value || null);
                      }}
                      className="border-input h-8 flex-1 rounded-lg border bg-transparent px-2.5 text-sm"
                    >
                      <option value="">Select a horse…</option>
                      {horses.map((horse) => (
                        <option key={horse.id} value={horse.id}>
                          {horse.name}
                        </option>
                      ))}
                    </select>
                    {slots.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          removeClassHorseSlot(cls.id, index);
                        }}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="ghost"
                className="text-forest h-auto rounded-none px-0 py-0 text-xs font-medium underline-offset-2 hover:bg-transparent hover:underline"
                onClick={() => {
                  addClassHorseSlot(cls.id);
                }}
              >
                + Enter this class on another horse too
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
