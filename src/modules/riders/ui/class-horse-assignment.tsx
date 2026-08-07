'use client';

import { useEntryCartStore } from '../store';
import type { ClassWithCapacity, HorseWithDocumentUrls } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/shadcn/card';
import { Button } from '@/shared/ui/shadcn/button';

/**
 * Assigns a horse to each currently-selected class — one row per horse slot,
 * so the same class can be entered twice on two different horses (add another
 * slot rather than being limited to one horse per class). Mirrors legacy's
 * realClassHorseAssignRowHtml / realAddClassHorseSlot / realRemoveClassHorseSlot
 * (rider.html).
 *
 * Reads selection from useEntryCartStore rather than props, so it always
 * reflects whatever ClassPicker currently has selected without prop-drilling
 * between the two sibling components.
 */
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

  const selected = classes.filter((cls) => selectedClassIds.has(cls.id));
  if (selected.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assign a horse to each class</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {horses.length === 0 && (
          <p className="text-sm text-fa-muted">Add a horse above first, then assign it here.</p>
        )}
        {selected.map((cls) => {
          const slots = classHorseAssignments[cls.id] ?? [null];
          return (
            <div key={cls.id}>
              <div className="mb-1.5 text-sm font-medium text-forest">
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
                      className="h-8 flex-1 rounded-lg border border-input bg-transparent px-2.5 text-sm"
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
              <button
                type="button"
                className="mt-1.5 text-xs font-medium text-forest underline-offset-2 hover:underline"
                onClick={() => {
                  addClassHorseSlot(cls.id);
                }}
              >
                + Enter this class on another horse too
              </button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
