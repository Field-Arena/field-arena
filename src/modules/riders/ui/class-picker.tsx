'use client';

import { ENTRY_DIVISION_OPTIONS } from '@/modules/riders/constants';
import { useEntryCartStore } from '@/modules/riders/store';
import { classSubtitle } from '@/modules/riders/utils/class-subtitle';
import { anyClassFlaggedQualifying, isClassRated } from '@/modules/riders/utils/class-rated-status';
import { entryDivisionFromCategory } from '@/modules/riders/utils/entry-division-from-category';
import type {
  ClassWithCapacity,
  EntryDivisionCode,
  HorseWithDocumentUrls,
  QualTypeRow,
} from '@/modules/riders/types';
import { cn } from '@/shared/lib/utils';
import { RatedBadge } from '@/modules/riders/ui/rated-badge';
import { Badge } from '@/shared/ui/shadcn/badge';
import { Button } from '@/shared/ui/shadcn/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/shadcn/card';

const DIVISION_CODES: readonly string[] = ENTRY_DIVISION_OPTIONS.map((option) => option.code);

function asDivisionCode(value: string): EntryDivisionCode | null {
  return DIVISION_CODES.includes(value) ? (value as EntryDivisionCode) : null;
}

export function ClassPicker({
  classes,
  qualTypes,
  horses,
  showType,
  riderCategory,
}: {
  classes: ClassWithCapacity[];
  qualTypes: QualTypeRow[];
  horses: HorseWithDocumentUrls[];
  showType: string | null;
  riderCategory: string | null;
}) {
  const selectedClassIds = useEntryCartStore((state) => state.selectedClassIds);
  const qualSelections = useEntryCartStore((state) => state.qualSelections);
  const testChoices = useEntryCartStore((state) => state.testChoices);
  const divisionChoices = useEntryCartStore((state) => state.divisionChoices);
  const toggleClass = useEntryCartStore((state) => state.toggleClass);
  const toggleQualification = useEntryCartStore((state) => state.toggleQualification);
  const setTestChoice = useEntryCartStore((state) => state.setTestChoice);
  const setDivision = useEntryCartStore((state) => state.setDivision);

  const anyClassFlagged = anyClassFlaggedQualifying(classes);
  const onlyHorseId = horses.length === 1 ? (horses[0]?.id ?? null) : null;
  const defaultDivision = entryDivisionFromCategory(riderCategory);
  const selectedCount = selectedClassIds.size;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Choose your classes</CardTitle>
        <p className="text-fa-muted text-xs">
          Press <b>Enter this event</b> on each class you want to ride.{' '}
          <span className="font-semibold text-[#7A5B0E]">Rated</span> = an official, qualifying
          score. <span className="font-semibold">Not rated</span> = schooling. The same level can be
          offered both ways at different prices.
        </p>
        {selectedCount > 0 && (
          <p className="text-xs font-semibold text-green-700">
            ✓ {selectedCount.toString()} class{selectedCount === 1 ? '' : 'es'} selected
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {classes.length === 0 && <p className="text-fa-muted text-sm">No classes published yet.</p>}
        {classes.map((cls) => {
          const isSelected = selectedClassIds.has(cls.id);
          const isFull = cls.cap != null && cls.entryCount >= cls.cap && !isSelected;
          const rated = isClassRated(cls, { showType, anyClassFlagged });
          const selectedQualIds = qualSelections[cls.id] ?? new Set<string>();
          const offeredQualTypes = !anyClassFlagged || cls.qualifying ? qualTypes : [];
          const subtitle = classSubtitle({
            label: cls.label,
            displayName: cls.display_name,
            testOptions: cls.test_options,
          });
          const testOptions = Array.isArray(cls.test_options)
            ? cls.test_options.filter((t): t is string => typeof t === 'string')
            : [];
          return (
            <div
              key={cls.id}
              className={cn(
                'rounded-lg border transition-colors',
                isSelected ? 'border-green-600 bg-green-50/60' : 'border-line bg-white',
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-forest text-sm font-medium">
                      {(cls.display_name?.trim() ?? '') || cls.label}
                      {cls.division ? ` (${cls.division})` : ''}
                    </span>
                    <RatedBadge rated={rated} />
                    {isFull && <Badge variant="destructive">Full</Badge>}
                  </div>
                  {subtitle && <div className="text-fa-muted text-xs italic">{subtitle}</div>}
                  <div className="text-fa-muted text-xs">
                    {[cls.date, cls.time, cls.arena].filter(Boolean).join(' · ')}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-forest text-sm font-semibold">
                    {cls.fee != null ? `$${cls.fee.toFixed(2)}` : '—'}
                  </span>
                  {isSelected ? (
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex h-8 items-center rounded-lg bg-green-700 px-3 text-sm font-semibold text-white">
                        ✓ Entered
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-fa-muted hover:text-destructive"
                        onClick={() => {
                          toggleClass(cls.id);
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      disabled={isFull}
                      className="bg-[#1F3A2E] text-white hover:bg-[#345043]"
                      onClick={() => {
                        toggleClass(cls.id, { horseId: onlyHorseId, division: defaultDivision });
                      }}
                    >
                      {isFull ? 'Class full' : 'Enter this event'}
                    </Button>
                  )}
                </div>
              </div>

              {isSelected && (
                <div className="border-line border-t px-3 py-2">
                  <label
                    htmlFor={`division-${cls.id}`}
                    className="text-forest mb-1 block text-xs font-medium"
                  >
                    Your division for this class <span className="text-destructive">*</span>
                  </label>
                  <select
                    id={`division-${cls.id}`}
                    className="border-line w-full rounded border bg-white px-2 py-1.5 text-sm"
                    value={divisionChoices[cls.id] ?? ''}
                    onChange={(e) => {
                      const code = asDivisionCode(e.target.value);
                      if (code) setDivision(cls.id, code);
                    }}
                  >
                    <option value="" disabled>
                      Select your division…
                    </option>
                    {ENTRY_DIVISION_OPTIONS.map((option) => (
                      <option key={option.code} value={option.code}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {isSelected && testOptions.length > 0 && (
                <div className="border-line border-t px-3 py-2">
                  <label className="text-forest mb-1 block text-xs font-medium">
                    Choose your test <span className="text-destructive">*</span>
                  </label>
                  <select
                    className="border-line w-full rounded border bg-white px-2 py-1.5 text-sm"
                    value={testChoices[cls.id] ?? ''}
                    onChange={(e) => {
                      setTestChoice(cls.id, e.target.value);
                    }}
                  >
                    <option value="" disabled>
                      Select a test…
                    </option>
                    {testOptions.map((test) => (
                      <option key={test} value={test}>
                        {test}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {isSelected && offeredQualTypes.length > 0 && (
                <div className="border-line flex flex-wrap gap-x-4 gap-y-1 border-t px-3 py-2">
                  {offeredQualTypes.map((qual) => (
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
