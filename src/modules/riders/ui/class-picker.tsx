'use client';

import { useEntryCartStore } from '@/modules/riders/store';
import { classSubtitle } from '@/modules/riders/utils/class-subtitle';
import type { ClassWithCapacity, QualTypeRow } from '@/modules/riders/types';
import { Badge } from '@/shared/ui/shadcn/badge';
import { Button } from '@/shared/ui/shadcn/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/shadcn/card';

export function ClassPicker({
  classes,
  qualTypes,
}: {
  classes: ClassWithCapacity[];
  qualTypes: QualTypeRow[];
}) {
  const selectedClassIds = useEntryCartStore((state) => state.selectedClassIds);
  const qualSelections = useEntryCartStore((state) => state.qualSelections);
  const toggleClass = useEntryCartStore((state) => state.toggleClass);
  const toggleQualification = useEntryCartStore((state) => state.toggleQualification);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Choose your classes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {classes.length === 0 && <p className="text-fa-muted text-sm">No classes published yet.</p>}
        {classes.map((cls) => {
          const isSelected = selectedClassIds.has(cls.id);
          const isFull = cls.cap != null && cls.entryCount >= cls.cap && !isSelected;
          const selectedQualIds = qualSelections[cls.id] ?? new Set<string>();
          const subtitle = classSubtitle({
            label: cls.label,
            displayName: cls.display_name,
            testOptions: cls.test_options,
          });
          return (
            <div key={cls.id} className="border-line rounded-lg border">
              <Button
                type="button"
                variant="ghost"
                disabled={isFull}
                onClick={() => {
                  toggleClass(cls.id);
                }}
                className="flex h-auto w-full items-center justify-between gap-3 rounded-none px-3 py-2 text-left hover:bg-transparent disabled:cursor-not-allowed disabled:opacity-60"
              >
                <div>
                  <div className="text-forest text-sm font-medium">
                    {(cls.display_name?.trim() ?? '') || cls.label}
                    {cls.division ? ` (${cls.division})` : ''}
                  </div>
                  {subtitle && <div className="text-fa-muted text-xs italic">{subtitle}</div>}
                  <div className="text-fa-muted text-xs">
                    {[cls.date, cls.time, cls.arena].filter(Boolean).join(' · ')}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isFull && <Badge variant="destructive">Full</Badge>}
                  {isSelected && <Badge>Selected</Badge>}
                  <span className="text-forest text-sm font-semibold">
                    {cls.fee != null ? `$${cls.fee.toFixed(2)}` : '—'}
                  </span>
                </div>
              </Button>

              {isSelected && qualTypes.length > 0 && (
                <div className="border-line flex flex-wrap gap-x-4 gap-y-1 border-t px-3 py-2">
                  {qualTypes.map((qual) => (
                    <label
                      key={qual.id}
                      className="text-forest flex cursor-pointer items-center gap-1.5 text-xs font-medium"
                    >
                      <input
                        type="checkbox"
                        checked={selectedQualIds.has(qual.id)}
                        onChange={() => {
                          toggleQualification(cls.id, qual.id);
                        }}
                      />
                      {qual.name}
                      {qual.price != null && (
                        <span className="text-fa-muted">(+${qual.price.toFixed(2)})</span>
                      )}
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
