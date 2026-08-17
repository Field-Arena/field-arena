'use client';

import { CATALOG_DISCIPLINES, CATALOG_SCORE_TYPES, CATALOG_FAMILY_META, SHEET_FAMILIES } from '../constants';
import { INPUT, LABEL, SECTION, H2 } from './sheet-detail-styles';

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
  return (
    <section className={SECTION}>
      <h2 className={`${H2} mb-[18px]`}>Sheet details</h2>
      <div className="grid gap-[18px] [grid-template-columns:repeat(auto-fit,minmax(230px,1fr))]">
        <Field label="Title" value={title} onChange={onTitleChange} />
        <Field label="Level" value={level} onChange={onLevelChange} placeholder="e.g. First" />
        <div>
          <label htmlFor="sd-disc" className={LABEL}>
            Discipline
          </label>
          <select
            id="sd-disc"
            value={discipline}
            onChange={(e) => {
              onDisciplineChange(e.target.value);
            }}
            className={INPUT}
          >
            {CATALOG_DISCIPLINES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="sd-score" className={LABEL}>
            Score type
          </label>
          <select
            id="sd-score"
            value={scoreType}
            onChange={(e) => {
              onScoreTypeChange(e.target.value);
            }}
            className={INPUT}
          >
            {CATALOG_SCORE_TYPES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="sd-family" className={LABEL}>
            Scoring family
          </label>
          <select
            id="sd-family"
            value={family}
            onChange={(e) => {
              onFamilyChange(e.target.value as SheetFamily);
            }}
            className={INPUT}
          >
            {SHEET_FAMILIES.map((f) => (
              <option key={f} value={f}>
                {CATALOG_FAMILY_META[f]?.label ?? f}
              </option>
            ))}
          </select>
        </div>
      </div>
    </section>
  );
}

export function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const id = `sd-${label.toLowerCase().replace(/[^a-z]+/g, '-')}`;
  return (
    <div>
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      <input
        id={id}
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        className={INPUT}
      />
    </div>
  );
}
