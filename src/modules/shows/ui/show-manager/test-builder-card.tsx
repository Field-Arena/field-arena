'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Card } from '@/shared/ui/organizer/card';
import { PrimaryButton, GhostButton } from '@/shared/ui/organizer/buttons';
import { Button } from '@/shared/ui/shadcn/button';
import { Input } from '@/shared/ui/shadcn/input';
import { Label } from '@/shared/ui/shadcn/label';
import { blockNonDecimalKeys } from '@/shared/lib/format/number-input';
import {
  useSaveTestTemplate,
  useDeleteTestTemplate,
  useAssignTestToClass,
  useUnassignTestFromClass,
} from '@/modules/shows/hooks/use-test-builder-mutations';
import { saveTestTemplateSchema } from '@/modules/shows/schemas';
import type { SaveTestTemplateInput } from '@/modules/shows/schemas';
import type {
  AssignedClassOption,
  TestBuilderClassOption,
  TestCatalogEntry,
  TestTemplateRow,
} from '@/modules/shows/types';
import {
  SM_CARD_PAD,
  SM_SECTION_HEAD,
  SM_NOTE,
  SM_LABEL,
  SM_INPUT,
  SM_SELECT,
  SM_ROW_INPUT,
} from '@/modules/shows/ui/show-manager/tokens';
import { SectionFooter } from '@/modules/shows/ui/show-manager/section-footer';
import { TestPicker } from '@/modules/shows/ui/show-manager/test-picker';
import {
  RefreshClassesDialog,
  type RefreshOffer,
} from '@/modules/shows/ui/show-manager/refresh-classes-dialog';
import { DiscardDraftDialog } from '@/modules/shows/ui/show-manager/discard-draft-dialog';
import { testPickerKey, type TestPickerOption } from '@/modules/shows/utils/test-picker-options';

/* ── Draft state model (typed against the score-sheet input shapes) ────────── */

interface DraftInstruction {
  id: string;
  marker: string;
  instruction: string;
  gait: string;
  direction: string;
}

interface DraftItem {
  id: string;
  label: string;
  directive: string;
  maxScore: number;
  coef: number;
  required: boolean;
  instructions: DraftInstruction[];
}

interface DraftSection {
  id: string;
  name: string;
  type: string;
  subtotal: boolean;
  items: DraftItem[];
}

interface DraftPenalty {
  id: string;
  name: string;
  penaltyType: string;
  value: string;
  repeat: boolean;
  elimination: boolean;
}

interface DraftScoringConfig {
  scoreType: string;
  applyCoefficients: boolean;
  finalDisplay: string;
  formula: string;
}

interface Draft {
  id?: string;
  /** Set when the draft is a copy of an official catalog test. Saving it
   * always inserts a new org template — scoring_catalog is never written. */
  sourceCatalogId?: string;
  name: string;
  level: string;
  sourceLabel?: string;
  discipline: string;
  sheetType: string;
  governingBody: string;
  versionYear: string;
  arenaSize: string;
  rideTime: string;
  scoringMethod: string;
  maxPoints: string;
  sections: DraftSection[];
  penalties: DraftPenalty[];
  scoringConfig: DraftScoringConfig;
}

/** Metadata keys that map straight onto a plain text input. */
type MetaKey =
  | 'name'
  | 'level'
  | 'discipline'
  | 'sheetType'
  | 'governingBody'
  | 'versionYear'
  | 'arenaSize'
  | 'rideTime'
  | 'scoringMethod'
  | 'maxPoints';

const SECTION_TYPES = [
  { value: 'scored', label: 'Scored movements' },
  { value: 'collective', label: 'Collective marks' },
  { value: 'technical', label: 'Technical' },
  { value: 'artistic', label: 'Artistic' },
  { value: 'conformation', label: 'Conformation' },
  { value: 'rider', label: 'Rider' },
  { value: 'penalties', label: 'Penalties' },
] as const;

const PENALTY_TYPES = [
  { value: 'fixed', label: 'Fixed' },
  { value: 'progressive', label: 'Progressive' },
  { value: 'one_time', label: 'One-time' },
  { value: 'section', label: 'Section' },
  { value: 'overall', label: 'Overall' },
  { value: 'elimination', label: 'Elimination' },
  { value: 'disqualification', label: 'Disqualification' },
] as const;

const DISCIPLINE_OPTIONS = [
  'Dressage',
  'Eventing',
  'Hunter',
  'Jumper',
  'Western',
  'Equitation',
  'Other',
] as const;

const SCORE_TYPE_OPTIONS = ['0-10', '0-100', 'points'] as const;
const FINAL_DISPLAY_OPTIONS = ['percentage', 'points', 'average'] as const;
const FORMULA_OPTIONS = ['earned_over_possible', 'sum', 'average'] as const;

// maxLength mirrors each field's .max() in saveTestTemplateSchema.
const TEXT_META: { key: MetaKey; label: string; placeholder: string; maxLength: number }[] = [
  { key: 'sheetType', label: 'Sheet type', placeholder: 'e.g. Dressage test', maxLength: 60 },
  { key: 'governingBody', label: 'Governing body', placeholder: 'e.g. USEF', maxLength: 80 },
  { key: 'versionYear', label: 'Version year', placeholder: 'e.g. 2023', maxLength: 16 },
  { key: 'arenaSize', label: 'Arena size', placeholder: 'e.g. 20m × 60m', maxLength: 40 },
  { key: 'rideTime', label: 'Ride time', placeholder: 'e.g. 5:00', maxLength: 40 },
  {
    key: 'scoringMethod',
    label: 'Scoring method',
    placeholder: 'e.g. Percentage',
    maxLength: 60,
  },
];

const DEFAULT_SCORING: DraftScoringConfig = {
  scoreType: '0-10',
  applyCoefficients: true,
  finalDisplay: 'percentage',
  formula: 'earned_over_possible',
};

function newInstruction(): DraftInstruction {
  return { id: crypto.randomUUID(), marker: '', instruction: '', gait: '', direction: '' };
}

function newItem(): DraftItem {
  return {
    id: crypto.randomUUID(),
    label: '',
    directive: '',
    maxScore: 10,
    coef: 1,
    required: true,
    instructions: [],
  };
}

function newSection(type: string, name: string): DraftSection {
  return { id: crypto.randomUUID(), name, type, subtotal: true, items: [newItem()] };
}

function newPenalty(): DraftPenalty {
  return {
    id: crypto.randomUUID(),
    name: '',
    penaltyType: 'fixed',
    value: '',
    repeat: false,
    elimination: false,
  };
}

/** Load a template's structured sections, seeding from legacy movements/collectives
 *  when the structured sections are empty so nothing is lost on edit/duplicate. */
function loadSections(t: TestTemplateRow): DraftSection[] {
  if (t.sections.length > 0) {
    return t.sections.map((s) => ({
      id: crypto.randomUUID(),
      name: s.name,
      type: s.type,
      subtotal: s.subtotal,
      items: s.items.map((it) => ({
        id: crypto.randomUUID(),
        label: it.label,
        directive: it.directive,
        maxScore: it.maxScore,
        coef: it.coef,
        required: it.required,
        instructions: it.instructions.map((ins) => ({
          id: crypto.randomUUID(),
          marker: ins.marker,
          instruction: ins.instruction,
          gait: ins.gait,
          direction: ins.direction,
        })),
      })),
    }));
  }

  const sections: DraftSection[] = [
    {
      id: crypto.randomUUID(),
      name: 'Movements',
      type: 'scored',
      subtotal: true,
      items: t.movements.map((m) => ({
        id: crypto.randomUUID(),
        label: m.text,
        directive: '',
        maxScore: 10,
        coef: m.coef,
        required: true,
        instructions: [],
      })),
    },
  ];

  if (t.collectives.length > 0) {
    sections.push({
      id: crypto.randomUUID(),
      name: 'Collective marks',
      type: 'collective',
      subtotal: true,
      items: t.collectives.map((c) => ({
        id: crypto.randomUUID(),
        label: c.label,
        directive: '',
        maxScore: 10,
        coef: c.coef,
        required: true,
        instructions: [],
      })),
    });
  }

  return sections;
}

function draftFromTemplate(t: TestTemplateRow): Draft {
  return {
    id: t.id,
    name: t.name,
    level: t.level ?? '',
    discipline: t.discipline ?? '',
    sheetType: t.sheetType ?? '',
    governingBody: t.governingBody ?? '',
    versionYear: t.versionYear ?? '',
    arenaSize: t.arenaSize ?? '',
    rideTime: t.rideTime ?? '',
    scoringMethod: t.scoringMethod ?? '',
    maxPoints: t.maxPoints == null ? '' : String(t.maxPoints),
    sections: loadSections(t),
    penalties: t.penalties.map((p) => ({
      id: crypto.randomUUID(),
      name: p.name,
      penaltyType: p.penaltyType,
      value: p.value,
      repeat: p.repeat,
      elimination: p.elimination,
    })),
    scoringConfig: t.scoringConfig ? { ...t.scoringConfig } : { ...DEFAULT_SCORING },
  };
}

function buildPayload(orgId: string, d: Draft): SaveTestTemplateInput {
  return {
    id: d.id,
    orgId,
    name: d.name.trim(),
    level: d.level.trim() || undefined,
    sourceLabel: d.sourceLabel,
    discipline: d.discipline.trim() || undefined,
    sheetType: d.sheetType.trim() || undefined,
    governingBody: d.governingBody.trim() || undefined,
    versionYear: d.versionYear.trim() || undefined,
    arenaSize: d.arenaSize.trim() || undefined,
    rideTime: d.rideTime.trim() || undefined,
    scoringMethod: d.scoringMethod.trim() || undefined,
    maxPoints: d.maxPoints.trim() === '' ? undefined : Number(d.maxPoints),
    // The server derives movements/collectives from sections — don't send them.
    movements: [],
    collectives: [],
    sections: d.sections,
    penalties: d.penalties,
    scoringConfig: d.scoringConfig,
  };
}

export function TestBuilderCard({
  orgId,
  templates,
  catalog,
  classes,
  assignedByTemplateId,
  showId,
  showUuid,
}: {
  orgId: string;
  templates: TestTemplateRow[];
  catalog: TestCatalogEntry[];
  classes: TestBuilderClassOption[];
  assignedByTemplateId: Record<string, AssignedClassOption[]>;
  /** The show's slug or id from the URL — the footer's "Continue to Results"
   * link needs it, or it pointed at /dashboard/shows//results ("Show not found"). */
  showId: string;
  /** The show's uuid — server actions need it; `showId` may be the URL slug. */
  showUuid: string;
}) {
  const [draft, setDraft] = useState<Draft | null>(null);
  // The draft as it was opened, serialized — the unsaved-changes check
  // compares against it (ids inside a draft are stable once created).
  const [baseline, setBaseline] = useState<string | null>(null);
  const [pendingSwitch, setPendingSwitch] = useState<{ label: string; run: () => void } | null>(
    null,
  );
  const [refreshOffer, setRefreshOffer] = useState<RefreshOffer | null>(null);
  const [openInstr, setOpenInstr] = useState<Record<string, boolean>>({});
  const [pickedClass, setPickedClass] = useState<Record<string, string>>({});
  const save = useSaveTestTemplate({
    onSuccess: () => {
      closeDraft();
    },
  });
  const del = useDeleteTestTemplate();
  const assignToClass = useAssignTestToClass();
  const unassignFromClass = useUnassignTestFromClass();

  const usedByTemplateId = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(assignedByTemplateId).map(([id, list]) => [id, list.length]),
      ),
    [assignedByTemplateId],
  );

  const draftSnapshot = useMemo(() => (draft ? JSON.stringify(draft) : null), [draft]);
  const isDirty = draftSnapshot !== null && draftSnapshot !== baseline;

  function startDraft(next: Draft) {
    setDraft(next);
    setBaseline(JSON.stringify(next));
    setOpenInstr({});
  }

  function closeDraft() {
    setDraft(null);
    setBaseline(null);
  }

  /** Runs `run` now, or after the user confirms discarding unsaved edits. */
  function requestSwitch(label: string, run: () => void) {
    if (isDirty) setPendingSwitch({ label, run });
    else run();
  }

  const selectedKey = draft?.id
    ? testPickerKey('org', draft.id)
    : draft?.sourceCatalogId
      ? testPickerKey('official', draft.sourceCatalogId)
      : null;

  function pickTest(option: TestPickerOption) {
    if (option.key === selectedKey) return;
    if (option.kind === 'org') {
      const t = templates.find((x) => x.id === option.id);
      if (!t) return;
      requestSwitch(`open “${t.name}”`, () => {
        openEdit(t);
      });
    } else {
      requestSwitch(`open a copy of “${option.name}”`, () => {
        openCatalog(option.id);
      });
    }
  }

  function openNew() {
    startDraft({
      name: '',
      level: '',
      discipline: '',
      sheetType: '',
      governingBody: '',
      versionYear: '',
      arenaSize: '',
      rideTime: '',
      scoringMethod: '',
      maxPoints: '',
      sections: [newSection('scored', '')],
      penalties: [],
      scoringConfig: { ...DEFAULT_SCORING },
    });
  }

  function openCatalog(catalogId: string) {
    const entry = catalog.find((c) => c.id === catalogId);
    if (!entry) return;

    const sections: DraftSection[] = [
      {
        id: crypto.randomUUID(),
        name: 'Movements',
        type: 'scored',
        subtotal: true,
        items: entry.movements.map((m) => ({
          id: crypto.randomUUID(),
          label: m.text,
          directive: '',
          maxScore: 10,
          coef: m.coef,
          required: true,
          instructions: [],
        })),
      },
      {
        id: crypto.randomUUID(),
        name: 'Collective marks',
        type: 'collective',
        subtotal: true,
        items: entry.collectives.map((c) => ({
          id: crypto.randomUUID(),
          label: c.label,
          directive: '',
          maxScore: 10,
          coef: c.coef,
          required: true,
          instructions: [],
        })),
      },
    ];

    startDraft({
      sourceCatalogId: entry.id,
      name: entry.title,
      level: entry.level ?? '',
      sourceLabel: `Cloned from official catalog: ${entry.title}`,
      discipline: 'Dressage',
      sheetType: '',
      governingBody: entry.governingBody ?? '',
      versionYear: '',
      arenaSize: '',
      rideTime: '',
      scoringMethod: '',
      maxPoints: '',
      sections,
      penalties: [],
      scoringConfig: { ...DEFAULT_SCORING },
    });
  }

  function openEdit(t: TestTemplateRow) {
    startDraft(draftFromTemplate(t));
  }

  function duplicate(t: TestTemplateRow) {
    const base = draftFromTemplate(t);
    const existingNames = new Set(templates.map((x) => x.name));
    let name = `${t.name} (copy)`;
    let n = 2;
    // Repeated duplicates of the same test would otherwise all land on the
    // exact same name, e.g. "Training Level Test 1 (copy)" — and the
    // "Currently used by" hint below can only disambiguate assignments made
    // after this point by name for legacy rows, so colliding names still
    // muddy that display. A numbered suffix keeps every duplicate unique.
    while (existingNames.has(name)) {
      name = `${t.name} (copy ${String(n)})`;
      n += 1;
    }
    save.mutate(buildPayload(orgId, { ...base, id: undefined, name }));
  }

  function submitDraft() {
    if (!draft) return;
    const input = buildPayload(orgId, draft);

    const parsed = saveTestTemplateSchema.safeParse(input);
    if (!parsed.success) {
      toast.error(
        parsed.error.issues[0]?.message ?? 'Please check the test details and try again.',
      );
      return;
    }
    // Classes copy a test when it's assigned, so an edit to an existing test
    // only reaches them if we re-copy it — offer that once the save lands.
    const templateId = draft.id;
    const assigned = templateId ? (assignedByTemplateId[templateId] ?? []) : [];
    save.mutate(input, {
      onSuccess: () => {
        if (templateId && assigned.length > 0) {
          setRefreshOffer({ templateId, templateName: input.name, classes: assigned });
        }
      },
    });
  }

  const shell = (content: React.ReactNode) => (
    <>
      <Card className={SM_CARD_PAD}>
        <h2 className={SM_SECTION_HEAD}>Choose a test to edit</h2>
        <p className={SM_NOTE}>
          Pick one of your organization&apos;s tests to edit it, or an official USEF/USDF or FEI
          test to start your own editable copy. Type to filter by name, level or governing body.
        </p>
        <TestPicker
          templates={templates}
          catalog={catalog}
          usedByTemplateId={usedByTemplateId}
          selectedKey={selectedKey}
          onPick={pickTest}
        />
      </Card>
      {content}
      <DiscardDraftDialog
        open={pendingSwitch !== null}
        draftName={draft?.name ?? ''}
        nextLabel={pendingSwitch?.label ?? 'continue'}
        onKeepEditing={() => {
          setPendingSwitch(null);
        }}
        onDiscard={() => {
          const next = pendingSwitch;
          setPendingSwitch(null);
          next?.run();
        }}
      />
      <RefreshClassesDialog
        offer={refreshOffer}
        showId={showUuid}
        onClose={() => {
          setRefreshOffer(null);
        }}
      />
    </>
  );

  if (draft) {
    const d = draft;

    const setMeta = (key: MetaKey, value: string) => {
      setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
    };
    const patchSection = (sid: string, patch: Partial<DraftSection>) => {
      setDraft((prev) =>
        prev
          ? { ...prev, sections: prev.sections.map((s) => (s.id === sid ? { ...s, ...patch } : s)) }
          : prev,
      );
    };
    const patchItem = (sid: string, iid: string, patch: Partial<DraftItem>) => {
      setDraft((prev) =>
        prev
          ? {
              ...prev,
              sections: prev.sections.map((s) =>
                s.id === sid
                  ? { ...s, items: s.items.map((it) => (it.id === iid ? { ...it, ...patch } : it)) }
                  : s,
              ),
            }
          : prev,
      );
    };
    const patchInstruction = (
      sid: string,
      iid: string,
      insId: string,
      patch: Partial<DraftInstruction>,
    ) => {
      setDraft((prev) =>
        prev
          ? {
              ...prev,
              sections: prev.sections.map((s) =>
                s.id === sid
                  ? {
                      ...s,
                      items: s.items.map((it) =>
                        it.id === iid
                          ? {
                              ...it,
                              instructions: it.instructions.map((ins) =>
                                ins.id === insId ? { ...ins, ...patch } : ins,
                              ),
                            }
                          : it,
                      ),
                    }
                  : s,
              ),
            }
          : prev,
      );
    };
    const patchPenalty = (pid: string, patch: Partial<DraftPenalty>) => {
      setDraft((prev) =>
        prev
          ? {
              ...prev,
              penalties: prev.penalties.map((p) => (p.id === pid ? { ...p, ...patch } : p)),
            }
          : prev,
      );
    };
    const patchScoring = (patch: Partial<DraftScoringConfig>) => {
      setDraft((prev) =>
        prev ? { ...prev, scoringConfig: { ...prev.scoringConfig, ...patch } } : prev,
      );
    };

    const metaText = (key: MetaKey, label: string, placeholder: string, maxLength: number) => (
      <div key={key}>
        <Label className={SM_LABEL}>{label}</Label>
        <Input
          value={d[key]}
          maxLength={maxLength}
          placeholder={placeholder}
          className={`h-auto ${SM_INPUT}`}
          onChange={(e) => {
            setMeta(key, e.target.value);
          }}
        />
      </div>
    );

    return shell(
      <Card className={SM_CARD_PAD}>
        <h2 className={SM_SECTION_HEAD}>
          {d.id ? 'Edit test' : d.sourceCatalogId ? 'Your copy of an official test' : 'New test'}
        </h2>

        {d.sourceCatalogId && !d.id && (
          <div
            role="note"
            className="mb-5 rounded-[10px] border border-[#9FD3BA] bg-[#EAF5EF] px-4 py-3 text-[13px] leading-relaxed text-[#0E5537]"
          >
            <strong>Official test — you&apos;re editing your own copy.</strong> The official version
            doesn&apos;t change. Saving adds this copy to your organization&apos;s tests.
          </div>
        )}

        {/* Test metadata */}
        <div className="mb-6 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <Label className={SM_LABEL}>Test name</Label>
            <Input
              value={d.name}
              maxLength={160}
              placeholder="e.g. Training Level Test 1"
              className={`h-auto ${SM_INPUT}`}
              onChange={(e) => {
                setMeta('name', e.target.value);
              }}
            />
          </div>
          <div>
            <Label className={SM_LABEL}>Level</Label>
            <Input
              value={d.level}
              maxLength={80}
              placeholder="e.g. Training Level"
              className={`h-auto ${SM_INPUT}`}
              onChange={(e) => {
                setMeta('level', e.target.value);
              }}
            />
          </div>
          <div>
            <Label className={SM_LABEL}>Discipline</Label>
            <select
              value={d.discipline}
              className={SM_SELECT}
              onChange={(e) => {
                setMeta('discipline', e.target.value);
              }}
            >
              <option value="">Choose a discipline…</option>
              {DISCIPLINE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          {TEXT_META.map((f) => metaText(f.key, f.label, f.placeholder, f.maxLength))}
          <div>
            <Label className={SM_LABEL}>Max points</Label>
            <Input
              type="number"
              min={0}
              max={100000}
              onKeyDown={blockNonDecimalKeys}
              value={d.maxPoints}
              placeholder="e.g. 100"
              className={`h-auto ${SM_INPUT}`}
              onChange={(e) => {
                setMeta('maxPoints', e.target.value);
              }}
            />
          </div>
        </div>

        {/* Sections */}
        <Label className={SM_LABEL}>Sections</Label>
        <div className="mb-3 flex flex-col gap-4">
          {d.sections.map((s) => (
            <div key={s.id} className="rounded-[12px] border border-[#E9EDEB] bg-[#FBFCFB] p-4">
              <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_180px_auto]">
                <Input
                  value={s.name}
                  maxLength={80}
                  placeholder="Section name"
                  className={`h-auto ${SM_ROW_INPUT}`}
                  onChange={(e) => {
                    patchSection(s.id, { name: e.target.value });
                  }}
                />
                <select
                  value={s.type}
                  className={SM_ROW_INPUT}
                  onChange={(e) => {
                    patchSection(s.id, { type: e.target.value });
                  }}
                >
                  {SECTION_TYPES.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-3">
                  <Label className="flex items-center gap-2 text-[13px] font-semibold text-[#5A6B63]">
                    <input
                      type="checkbox"
                      checked={s.subtotal}
                      className="h-4 w-4 accent-[#1A5B3C]"
                      onChange={(e) => {
                        patchSection(s.id, { subtotal: e.target.checked });
                      }}
                    />
                    Subtotal
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setDraft((prev) =>
                        prev
                          ? { ...prev, sections: prev.sections.filter((x) => x.id !== s.id) }
                          : prev,
                      );
                    }}
                    className="hover:text-status-danger h-auto bg-transparent p-0 text-[13px] font-semibold text-[#5A6B63] transition-colors hover:bg-transparent"
                  >
                    Remove
                  </Button>
                </div>
              </div>

              {/* Items */}
              <div className="flex flex-col gap-3">
                {s.items.map((it) => (
                  <div
                    key={it.id}
                    className="rounded-[10px] border border-[#E9EDEB] bg-white p-3.5"
                  >
                    <div className="mb-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-[minmax(0,1fr)_86px_86px_auto] sm:items-center">
                      <Input
                        value={it.label}
                        maxLength={300}
                        placeholder="e.g. Enter working trot, halt at X"
                        className={`h-auto ${SM_ROW_INPUT}`}
                        onChange={(e) => {
                          patchItem(s.id, it.id, { label: e.target.value });
                        }}
                      />
                      <Input
                        type="number"
                        min={0}
                        max={1000}
                        onKeyDown={blockNonDecimalKeys}
                        value={it.maxScore}
                        title="Max score"
                        className={`h-auto ${SM_ROW_INPUT}`}
                        onChange={(e) => {
                          const n = Number.parseFloat(e.target.value);
                          patchItem(s.id, it.id, {
                            maxScore: Number.isFinite(n) ? n : it.maxScore,
                          });
                        }}
                      />
                      <Input
                        type="number"
                        min={1}
                        max={20}
                        onKeyDown={blockNonDecimalKeys}
                        value={it.coef}
                        title="Coefficient"
                        className={`h-auto ${SM_ROW_INPUT}`}
                        onChange={(e) => {
                          const n = Number.parseFloat(e.target.value);
                          patchItem(s.id, it.id, { coef: Number.isFinite(n) ? n : it.coef });
                        }}
                      />
                      <div className="flex items-center gap-3">
                        <Label className="flex items-center gap-2 text-[13px] font-semibold text-[#5A6B63]">
                          <input
                            type="checkbox"
                            checked={it.required}
                            className="h-4 w-4 accent-[#1A5B3C]"
                            onChange={(e) => {
                              patchItem(s.id, it.id, { required: e.target.checked });
                            }}
                          />
                          Req.
                        </Label>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            patchSection(s.id, {
                              items: s.items.filter((x) => x.id !== it.id),
                            });
                          }}
                          className="hover:text-status-danger h-auto bg-transparent p-0 text-[13px] font-semibold text-[#5A6B63] transition-colors hover:bg-transparent"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>

                    <Input
                      value={it.directive}
                      maxLength={600}
                      placeholder="Directive (what the judge is looking for) — optional"
                      className={`mb-2 h-auto ${SM_ROW_INPUT}`}
                      onChange={(e) => {
                        patchItem(s.id, it.id, { directive: e.target.value });
                      }}
                    />

                    <button
                      type="button"
                      onClick={() => {
                        setOpenInstr((prev) => ({ ...prev, [it.id]: !prev[it.id] }));
                      }}
                      className="text-forest text-[12px] font-semibold hover:underline"
                    >
                      {openInstr[it.id] ? '− instructions' : '+ instructions'}
                      {it.instructions.length > 0 ? ` (${String(it.instructions.length)})` : ''}
                    </button>

                    {openInstr[it.id] && (
                      <div className="mt-2.5 flex flex-col gap-2">
                        {it.instructions.map((ins) => (
                          <div
                            key={ins.id}
                            className="grid grid-cols-1 gap-2 sm:grid-cols-[70px_minmax(0,1fr)_110px_110px_auto] sm:items-center"
                          >
                            <Input
                              value={ins.marker}
                              maxLength={24}
                              placeholder="Marker"
                              className={`h-auto ${SM_ROW_INPUT}`}
                              onChange={(e) => {
                                patchInstruction(s.id, it.id, ins.id, { marker: e.target.value });
                              }}
                            />
                            <Input
                              value={ins.instruction}
                              maxLength={300}
                              placeholder="Instruction"
                              className={`h-auto ${SM_ROW_INPUT}`}
                              onChange={(e) => {
                                patchInstruction(s.id, it.id, ins.id, {
                                  instruction: e.target.value,
                                });
                              }}
                            />
                            <Input
                              value={ins.gait}
                              maxLength={80}
                              placeholder="Gait"
                              className={`h-auto ${SM_ROW_INPUT}`}
                              onChange={(e) => {
                                patchInstruction(s.id, it.id, ins.id, { gait: e.target.value });
                              }}
                            />
                            <Input
                              value={ins.direction}
                              maxLength={60}
                              placeholder="Direction"
                              className={`h-auto ${SM_ROW_INPUT}`}
                              onChange={(e) => {
                                patchInstruction(s.id, it.id, ins.id, {
                                  direction: e.target.value,
                                });
                              }}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => {
                                patchItem(s.id, it.id, {
                                  instructions: it.instructions.filter((x) => x.id !== ins.id),
                                });
                              }}
                              className="hover:text-status-danger h-auto bg-transparent p-0 text-[13px] font-semibold text-[#5A6B63] transition-colors hover:bg-transparent"
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                        <GhostButton
                          className="self-start"
                          onClick={() => {
                            patchItem(s.id, it.id, {
                              instructions: [...it.instructions, newInstruction()],
                            });
                          }}
                        >
                          + Add Instruction
                        </GhostButton>
                      </div>
                    )}
                  </div>
                ))}
                <GhostButton
                  className="self-start"
                  onClick={() => {
                    patchSection(s.id, { items: [...s.items, newItem()] });
                  }}
                >
                  + Add Item
                </GhostButton>
              </div>
            </div>
          ))}
        </div>
        <GhostButton
          className="mb-6"
          onClick={() => {
            setDraft((prev) =>
              prev ? { ...prev, sections: [...prev.sections, newSection('scored', '')] } : prev,
            );
          }}
        >
          + Add Section
        </GhostButton>

        {/* Penalties */}
        <Label className={SM_LABEL}>Penalties</Label>
        <div className="mb-3 flex flex-col gap-2.5">
          {d.penalties.map((p) => (
            <div
              key={p.id}
              className="grid grid-cols-1 gap-2.5 sm:grid-cols-[minmax(0,1fr)_150px_120px_auto] sm:items-center"
            >
              <Input
                value={p.name}
                maxLength={120}
                placeholder="Penalty name (e.g. Error of course)"
                className={`h-auto ${SM_ROW_INPUT}`}
                onChange={(e) => {
                  patchPenalty(p.id, { name: e.target.value });
                }}
              />
              <select
                value={p.penaltyType}
                className={SM_ROW_INPUT}
                onChange={(e) => {
                  patchPenalty(p.id, { penaltyType: e.target.value });
                }}
              >
                {PENALTY_TYPES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <Input
                value={p.value}
                maxLength={160}
                placeholder="e.g. 2"
                className={`h-auto ${SM_ROW_INPUT}`}
                onChange={(e) => {
                  patchPenalty(p.id, { value: e.target.value });
                }}
              />
              <div className="flex flex-wrap items-center gap-3">
                <Label className="flex items-center gap-2 text-[13px] font-semibold text-[#5A6B63]">
                  <input
                    type="checkbox"
                    checked={p.repeat}
                    className="h-4 w-4 accent-[#1A5B3C]"
                    onChange={(e) => {
                      patchPenalty(p.id, { repeat: e.target.checked });
                    }}
                  />
                  Repeat
                </Label>
                <Label className="flex items-center gap-2 text-[13px] font-semibold text-[#5A6B63]">
                  <input
                    type="checkbox"
                    checked={p.elimination}
                    className="h-4 w-4 accent-[#1A5B3C]"
                    onChange={(e) => {
                      patchPenalty(p.id, { elimination: e.target.checked });
                    }}
                  />
                  Elim.
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setDraft((prev) =>
                      prev
                        ? { ...prev, penalties: prev.penalties.filter((x) => x.id !== p.id) }
                        : prev,
                    );
                  }}
                  className="hover:text-status-danger h-auto bg-transparent p-0 text-[13px] font-semibold text-[#5A6B63] transition-colors hover:bg-transparent"
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
        <GhostButton
          className="mb-6"
          onClick={() => {
            setDraft((prev) =>
              prev ? { ...prev, penalties: [...prev.penalties, newPenalty()] } : prev,
            );
          }}
        >
          + Add Penalty
        </GhostButton>

        {/* Scoring config */}
        <Label className={SM_LABEL}>Scoring</Label>
        <div className="mb-6 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Label className={SM_LABEL}>Score type</Label>
            <select
              value={d.scoringConfig.scoreType}
              className={SM_SELECT}
              onChange={(e) => {
                patchScoring({ scoreType: e.target.value });
              }}
            >
              {SCORE_TYPE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label className={SM_LABEL}>Final display</Label>
            <select
              value={d.scoringConfig.finalDisplay}
              className={SM_SELECT}
              onChange={(e) => {
                patchScoring({ finalDisplay: e.target.value });
              }}
            >
              {FINAL_DISPLAY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label className={SM_LABEL}>Formula</Label>
            <select
              value={d.scoringConfig.formula}
              className={SM_SELECT}
              onChange={(e) => {
                patchScoring({ formula: e.target.value });
              }}
            >
              {FORMULA_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <Label className="mt-6 flex items-center gap-2 text-[13px] font-semibold text-[#5A6B63]">
            <input
              type="checkbox"
              checked={d.scoringConfig.applyCoefficients}
              className="h-4 w-4 accent-[#1A5B3C]"
              onChange={(e) => {
                patchScoring({ applyCoefficients: e.target.checked });
              }}
            />
            Apply coefficients
          </Label>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <PrimaryButton disabled={save.isPending || !d.name.trim()} onClick={submitDraft}>
            Save test
          </PrimaryButton>
          <GhostButton
            onClick={() => {
              requestSwitch('cancel', closeDraft);
            }}
          >
            Cancel
          </GhostButton>
        </div>
      </Card>,
    );
  }

  return shell(
    <>
      <Card className={SM_CARD_PAD}>
        <h2 className={SM_SECTION_HEAD}>Test Builder</h2>
        <p className={SM_NOTE}>
          Classes added from an official USEF/USDF or FEI test already use that test&apos;s
          scoresheet — nothing to do here. Use Test Builder for custom and independent classes, or
          to replace an official test with your own (an assigned test always wins).
        </p>
        <ol className={`${SM_NOTE} mb-4 list-decimal space-y-1 pl-5`}>
          <li>
            Choose a test above to edit it — pick an official test to start from a copy instead of
            typing it from scratch — or click <strong>+ New Test</strong> to start blank.
          </li>
          <li>
            Fill in the name, level, and discipline, then add each scored item as its own row.
          </li>
          <li>
            Click <strong>Save test</strong> — it&apos;s added to your library below, ready to reuse
            on any show. If classes already use the test, you&apos;ll be asked whether to update
            them too.
          </li>
          <li>
            Pick a class from the dropdown next to a saved test and click <strong>Assign</strong> to
            put it to use. Assigned the wrong one? Click the <strong>×</strong> next to the class
            name under &ldquo;Currently used by&rdquo; to remove it, then assign the right test
            instead.
          </li>
        </ol>

        <div className="mb-4">
          <PrimaryButton onClick={openNew}>+ New Test</PrimaryButton>
        </div>

        {templates.length === 0 ? (
          <p className="text-[13px] text-[#98A29D] italic">
            No tests in your library yet — start from a blank test or choose an official test above
            to copy.
          </p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {templates.map((t) => {
              const meta = [
                t.level ?? 'No level set',
                t.discipline,
                `${String(t.movements.length)} movements`,
                `${String(t.collectives.length)} collective marks`,
                t.maxPoints == null ? null : `${String(t.maxPoints)} pts`,
              ]
                .filter((part): part is string => Boolean(part))
                .join(' · ');

              const assignedTo = assignedByTemplateId[t.id] ?? [];

              return (
                <div
                  key={t.id}
                  className="flex flex-wrap items-center gap-3.5 rounded-[10px] border border-[#E9EDEB] px-4 py-3"
                >
                  <span className="min-w-0 flex-1">
                    <span className="text-ink-deep block text-[13.5px] font-semibold">
                      {t.name}
                    </span>
                    <span className="text-[12px] text-[#98A29D]">{meta}</span>
                    {assignedTo.length > 0 && (
                      <span className="text-forest mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[12px] font-semibold">
                        Currently used by:
                        {assignedTo.map((a) => (
                          <span
                            key={a.classId}
                            className="inline-flex items-center gap-1 rounded-full bg-[#EAF3EC] px-2 py-0.5"
                          >
                            {a.label}
                            <button
                              type="button"
                              title={`Remove this test from ${a.label}`}
                              disabled={
                                unassignFromClass.isPending &&
                                unassignFromClass.variables.classId === a.classId
                              }
                              onClick={() => {
                                unassignFromClass.mutate({ classId: a.classId });
                              }}
                              className="hover:text-status-danger text-forest font-bold disabled:opacity-50"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </span>
                    )}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      openEdit(t);
                    }}
                    className="text-forest h-auto px-0 py-0 text-[13px] font-semibold hover:bg-transparent hover:underline"
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      duplicate(t);
                    }}
                    className="hover:text-forest h-auto px-0 py-0 text-[13px] font-semibold text-[#5A6B63] hover:bg-transparent"
                  >
                    Duplicate
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      del.mutate(t.id);
                    }}
                    className="hover:text-status-danger h-auto px-0 py-0 text-[13px] font-semibold text-[#5A6B63] hover:bg-transparent"
                  >
                    Delete
                  </Button>
                  {classes.length > 0 && (
                    <div className="flex items-center gap-2">
                      <select
                        value={pickedClass[t.id] ?? ''}
                        onChange={(e) => {
                          setPickedClass({ ...pickedClass, [t.id]: e.target.value });
                        }}
                        className={SM_ROW_INPUT}
                      >
                        <option value="">Use for a class…</option>
                        {classes.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={
                          !pickedClass[t.id] ||
                          (assignToClass.isPending && assignToClass.variables.templateId === t.id)
                        }
                        onClick={() => {
                          const classId = pickedClass[t.id];
                          if (!classId) return;
                          assignToClass.mutate({ templateId: t.id, classId });
                        }}
                        className="text-forest h-auto px-0 py-0 text-[13px] font-semibold hover:bg-transparent hover:underline disabled:cursor-not-allowed disabled:text-[#B4BFB9] disabled:no-underline"
                      >
                        {assignToClass.isPending && assignToClass.variables.templateId === t.id
                          ? 'Assigning…'
                          : 'Assign'}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <SectionFooter currentTab="Test Builder" showId={showId} />
    </>,
  );
}
