'use client';

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

  const selected = classes.filter((cls) => selectedClassIds.has(cls.id));
  if (selected.length === 0) return null;

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
