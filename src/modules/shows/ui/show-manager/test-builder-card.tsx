'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Card } from '@/shared/ui/organizer/card';
import { PrimaryButton, GhostButton } from '@/shared/ui/organizer/buttons';
import { Button } from '@/shared/ui/shadcn/button';
import { Input } from '@/shared/ui/shadcn/input';
import {
  useSaveTestTemplate,
  useDeleteTestTemplate,
  useAssignTestToClass,
} from '@/modules/shows/hooks/use-test-builder-mutations';
import { saveTestTemplateSchema } from '@/modules/shows/schemas';
import type { SaveTestTemplateInput } from '@/modules/shows/schemas';
import { TB_STARTER_TESTS } from '@/modules/shows/constants';
import type { TestTemplateRow, TestBuilderClassOption } from '@/modules/shows/data/setup-queries';
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

const TEXT_META: { key: MetaKey; label: string; placeholder: string }[] = [
  { key: 'sheetType', label: 'Sheet type', placeholder: 'e.g. Dressage test' },
  { key: 'governingBody', label: 'Governing body', placeholder: 'e.g. USEF' },
  { key: 'versionYear', label: 'Version year', placeholder: 'e.g. 2023' },
  { key: 'arenaSize', label: 'Arena size', placeholder: 'e.g. 20m × 60m' },
  { key: 'rideTime', label: 'Ride time', placeholder: 'e.g. 5:00' },
  { key: 'scoringMethod', label: 'Scoring method', placeholder: 'e.g. Percentage' },
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
  classes,
}: {
  orgId: string;
  templates: TestTemplateRow[];
  classes: TestBuilderClassOption[];
}) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [openInstr, setOpenInstr] = useState<Record<string, boolean>>({});
  const [pickedClass, setPickedClass] = useState<Record<string, string>>({});
  const save = useSaveTestTemplate({
    onSuccess: () => {
      setDraft(null);
    },
  });
  const del = useDeleteTestTemplate();
  const assignToClass = useAssignTestToClass();

  function openNew() {
    setDraft({
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

  function openStarter(key: string) {
    const starter = TB_STARTER_TESTS.find((t) => t.key === key);
    if (!starter) return;

    const sections: DraftSection[] = [
      {
        id: crypto.randomUUID(),
        name: 'Movements',
        type: 'scored',
        subtotal: true,
        items: starter.movements.map((m) => ({
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
        items: starter.collectives.map((c) => ({
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

    setDraft({
      name: starter.name,
      level: starter.level,
      sourceLabel: `Cloned from ${starter.name}`,
      discipline: 'Dressage',
      sheetType: '',
      governingBody: '',
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
    setDraft(draftFromTemplate(t));
  }

  function duplicate(t: TestTemplateRow) {
    const base = draftFromTemplate(t);
    save.mutate(buildPayload(orgId, { ...base, id: undefined, name: `${t.name} (copy)` }));
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
    save.mutate(input);
  }

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

    const metaText = (key: MetaKey, label: string, placeholder: string) => (
      <div key={key}>
        <label className={SM_LABEL}>{label}</label>
        <Input
          value={d[key]}
          placeholder={placeholder}
          className={`h-auto ${SM_INPUT}`}
          onChange={(e) => {
            setMeta(key, e.target.value);
          }}
        />
      </div>
    );

    return (
      <Card className={SM_CARD_PAD}>
        <h2 className={SM_SECTION_HEAD}>{d.id ? 'Edit test' : 'New test'}</h2>

        {/* Test metadata */}
        <div className="mb-6 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className={SM_LABEL}>Test name</label>
            <Input
              value={d.name}
              placeholder="e.g. Training Level Test 1"
              className={`h-auto ${SM_INPUT}`}
              onChange={(e) => {
                setMeta('name', e.target.value);
              }}
            />
          </div>
          <div>
            <label className={SM_LABEL}>Level</label>
            <Input
              value={d.level}
              placeholder="e.g. Training Level"
              className={`h-auto ${SM_INPUT}`}
              onChange={(e) => {
                setMeta('level', e.target.value);
              }}
            />
          </div>
          <div>
            <label className={SM_LABEL}>Discipline</label>
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
          {TEXT_META.map((f) => metaText(f.key, f.label, f.placeholder))}
          <div>
            <label className={SM_LABEL}>Max points</label>
            <Input
              type="number"
              min={0}
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
        <label className={SM_LABEL}>Sections</label>
        <div className="mb-3 flex flex-col gap-4">
          {d.sections.map((s) => (
            <div key={s.id} className="rounded-[12px] border border-[#E9EDEB] bg-[#FBFCFB] p-4">
              <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_180px_auto]">
                <Input
                  value={s.name}
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
                  <label className="flex items-center gap-2 text-[13px] font-semibold text-[#5A6B63]">
                    <input
                      type="checkbox"
                      checked={s.subtotal}
                      className="h-4 w-4 accent-[#1A5B3C]"
                      onChange={(e) => {
                        patchSection(s.id, { subtotal: e.target.checked });
                      }}
                    />
                    Subtotal
                  </label>
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
                        placeholder="e.g. Enter working trot, halt at X"
                        className={`h-auto ${SM_ROW_INPUT}`}
                        onChange={(e) => {
                          patchItem(s.id, it.id, { label: e.target.value });
                        }}
                      />
                      <Input
                        type="number"
                        min={0}
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
                        value={it.coef}
                        title="Coefficient"
                        className={`h-auto ${SM_ROW_INPUT}`}
                        onChange={(e) => {
                          const n = Number.parseFloat(e.target.value);
                          patchItem(s.id, it.id, { coef: Number.isFinite(n) ? n : it.coef });
                        }}
                      />
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 text-[13px] font-semibold text-[#5A6B63]">
                          <input
                            type="checkbox"
                            checked={it.required}
                            className="h-4 w-4 accent-[#1A5B3C]"
                            onChange={(e) => {
                              patchItem(s.id, it.id, { required: e.target.checked });
                            }}
                          />
                          Req.
                        </label>
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
                              placeholder="Marker"
                              className={`h-auto ${SM_ROW_INPUT}`}
                              onChange={(e) => {
                                patchInstruction(s.id, it.id, ins.id, { marker: e.target.value });
                              }}
                            />
                            <Input
                              value={ins.instruction}
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
                              placeholder="Gait"
                              className={`h-auto ${SM_ROW_INPUT}`}
                              onChange={(e) => {
                                patchInstruction(s.id, it.id, ins.id, { gait: e.target.value });
                              }}
                            />
                            <Input
                              value={ins.direction}
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
        <label className={SM_LABEL}>Penalties</label>
        <div className="mb-3 flex flex-col gap-2.5">
          {d.penalties.map((p) => (
            <div
              key={p.id}
              className="grid grid-cols-1 gap-2.5 sm:grid-cols-[minmax(0,1fr)_150px_120px_auto] sm:items-center"
            >
              <Input
                value={p.name}
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
                placeholder="e.g. 2"
                className={`h-auto ${SM_ROW_INPUT}`}
                onChange={(e) => {
                  patchPenalty(p.id, { value: e.target.value });
                }}
              />
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-[13px] font-semibold text-[#5A6B63]">
                  <input
                    type="checkbox"
                    checked={p.repeat}
                    className="h-4 w-4 accent-[#1A5B3C]"
                    onChange={(e) => {
                      patchPenalty(p.id, { repeat: e.target.checked });
                    }}
                  />
                  Repeat
                </label>
                <label className="flex items-center gap-2 text-[13px] font-semibold text-[#5A6B63]">
                  <input
                    type="checkbox"
                    checked={p.elimination}
                    className="h-4 w-4 accent-[#1A5B3C]"
                    onChange={(e) => {
                      patchPenalty(p.id, { elimination: e.target.checked });
                    }}
                  />
                  Elim.
                </label>
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
        <label className={SM_LABEL}>Scoring</label>
        <div className="mb-6 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className={SM_LABEL}>Score type</label>
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
            <label className={SM_LABEL}>Final display</label>
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
            <label className={SM_LABEL}>Formula</label>
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
          <label className="mt-6 flex items-center gap-2 text-[13px] font-semibold text-[#5A6B63]">
            <input
              type="checkbox"
              checked={d.scoringConfig.applyCoefficients}
              className="h-4 w-4 accent-[#1A5B3C]"
              onChange={(e) => {
                patchScoring({ applyCoefficients: e.target.checked });
              }}
            />
            Apply coefficients
          </label>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <PrimaryButton disabled={save.isPending || !d.name.trim()} onClick={submitDraft}>
            Save test
          </PrimaryButton>
          <GhostButton
            onClick={() => {
              setDraft(null);
            }}
          >
            Cancel
          </GhostButton>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className={SM_CARD_PAD}>
        <h2 className={SM_SECTION_HEAD}>Test Builder</h2>
        <p className={SM_NOTE}>
          Your organization&apos;s own score sheets — sections, scored items, penalties and scoring
          rules you author once and reuse across shows.
        </p>

        <div className="mb-4 flex flex-wrap gap-2.5">
          <PrimaryButton onClick={openNew}>+ New Test</PrimaryButton>
          {TB_STARTER_TESTS.map((t) => (
            <GhostButton
              key={t.key}
              onClick={() => {
                openStarter(t.key);
              }}
            >
              Clone &ldquo;{t.name}&rdquo;
            </GhostButton>
          ))}
        </div>

        {templates.length === 0 ? (
          <p className="text-[13px] text-[#98A29D] italic">
            No tests in your library yet — start from a blank test or clone one of the starters
            above.
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

      <SectionFooter currentTab="Test Builder" />
    </>
  );
}
