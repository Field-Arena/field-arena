'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/shadcn/select';
import { Label } from '@/shared/ui/shadcn/label';
import {
  CATALOG_DISCIPLINES,
  CATALOG_SCORE_TYPES,
  CATALOG_FAMILY_META,
  SHEET_FAMILIES,
} from '@/modules/superadmin/constants';
import { LABEL, SECTION, H2 } from '@/modules/superadmin/ui/sheet-detail-styles';
import { Field } from '@/modules/superadmin/ui/sheet-detail-field';

type SheetFamily = (typeof SHEET_FAMILIES)[number];

export function SheetDetailsForm({
  title,
  onTitleChange,
  level,
  onLevelChange,
  discipline,
  onDisciplineChange,
  scoreType,
  onScoreTypeChange,
  family,
  onFamilyChange,
}: {
  title: string;
  onTitleChange: (value: string) => void;
  level: string;
  onLevelChange: (value: string) => void;
  discipline: string;
  onDisciplineChange: (value: string) => void;
  scoreType: string;
  onScoreTypeChange: (value: string) => void;
  family: SheetFamily;
  onFamilyChange: (value: SheetFamily) => void;
}) {
  const textFields: {
    key: string;
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
  }[] = [
    { key: 'title', label: 'Title', value: title, onChange: onTitleChange },
    {
      key: 'level',
      label: 'Level',
      value: level,
      onChange: onLevelChange,
      placeholder: 'e.g. First',
    },
  ];

  const selectFields: {
    key: string;
    id: string;
    label: string;
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
  }[] = [
    {
      key: 'discipline',
      id: 'sd-disc',
      label: 'Discipline',
      value: discipline,
      onChange: onDisciplineChange,
      options: CATALOG_DISCIPLINES.map((d) => ({ value: d, label: d })),
    },
    {
      key: 'score',
      id: 'sd-score',
      label: 'Score type',
      value: scoreType,
      onChange: onScoreTypeChange,
      options: CATALOG_SCORE_TYPES.map((s) => ({ value: s, label: s })),
    },
    {
      key: 'family',
      id: 'sd-family',
      label: 'Scoring family',
      value: family,
      onChange: (v) => {
        onFamilyChange(v as SheetFamily);
      },
      options: SHEET_FAMILIES.map((f) => ({ value: f, label: CATALOG_FAMILY_META[f]?.label ?? f })),
    },
  ];

  return (
    <section className={SECTION}>
      <h2 className={`${H2} mb-[18px]`}>Sheet details</h2>
      <div className="grid [grid-template-columns:repeat(auto-fit,minmax(230px,1fr))] gap-[18px]">
        {textFields.map((f) => (
          <Field
            key={f.key}
            label={f.label}
            value={f.value}
            onChange={f.onChange}
            placeholder={f.placeholder}
          />
        ))}
        {selectFields.map((s) => (
          <div key={s.key}>
            <Label htmlFor={s.id} className={LABEL}>
              {s.label}
            </Label>
            <Select value={s.value} onValueChange={s.onChange}>
              <SelectTrigger id={s.id} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {s.options.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
    </section>
  );
}
