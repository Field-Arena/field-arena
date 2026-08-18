'use client';

import { CATALOG_DISCIPLINES, CATALOG_SCORE_TYPES, CATALOG_FAMILY_META, SHEET_FAMILIES } from '@/modules/superadmin/constants';
import { INPUT, LABEL, SECTION, H2 } from '@/modules/superadmin/ui/sheet-detail-styles';
import { Field } from '@/modules/superadmin/ui/sheet-detail-field';

type SheetFamily = (typeof SHEET_FAMILIES)[number];

/**
 * The sheet's metadata fields — title, level, discipline, score type, and
 * scoring family. Extracted from SheetDetail so the editor's sections stay
 * independently readable; state is still owned by the parent (SheetDetail
 * assembles the full save payload from every section's fields).
 */
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
    { key: 'level', label: 'Level', value: level, onChange: onLevelChange, placeholder: 'e.g. First' },
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
      <div className="grid gap-[18px] [grid-template-columns:repeat(auto-fit,minmax(230px,1fr))]">
        {textFields.map((f) => (
          <Field key={f.key} label={f.label} value={f.value} onChange={f.onChange} placeholder={f.placeholder} />
        ))}
        {selectFields.map((s) => (
          <div key={s.key}>
            <label htmlFor={s.id} className={LABEL}>
              {s.label}
            </label>
            <select
              id={s.id}
              value={s.value}
              onChange={(e) => {
                s.onChange(e.target.value);
              }}
              className={INPUT}
            >
              {s.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </section>
  );
}
