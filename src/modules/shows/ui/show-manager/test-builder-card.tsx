'use client';

import { useState } from 'react';
import { Card } from '@/shared/ui/organizer/card';
import { PrimaryButton, GhostButton } from '@/shared/ui/organizer/buttons';
import { useSaveTestTemplate, useDeleteTestTemplate } from '../../hooks/use-test-builder-mutations';
import { TB_STARTER_TESTS } from '../../constants';
import type { TestTemplateRow, TestTemplateMovement, TestTemplateCollective } from '../../data/setup-queries';
import { SM_CARD_PAD, SM_SECTION_HEAD, SM_NOTE, SM_LABEL, SM_INPUT, SM_ROW_INPUT } from './tokens';

interface Draft {
  id?: string;
  name: string;
  level: string;
  sourceLabel?: string;
  movements: TestTemplateMovement[];
  collectives: TestTemplateCollective[];
}

const EMPTY_DRAFT: Draft = { name: '', level: '', movements: [], collectives: [] };

function nextMovementNum(movements: TestTemplateMovement[]): number {
  return movements.reduce((max, m) => Math.max(max, m.num), 0) + 1;
}

/**
 * "Test Builder" — an organization's own dressage test library, ported from
 * showstaff.html's Test Builder tab. Real movements/collective marks saved to
 * test_templates, reusable across shows. Assigning a built test to a specific
 * class (the legacy "Use for a class" hand-off into class_tests) isn't wired
 * yet — this covers authoring the library itself.
 */
export function TestBuilderCard({ orgId, templates }: { orgId: string; templates: TestTemplateRow[] }) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const save = useSaveTestTemplate({
    onSuccess: () => {
      setDraft(null);
    },
  });
  const del = useDeleteTestTemplate();

  function openNew() {
    setDraft({ ...EMPTY_DRAFT });
  }

  function openStarter(key: string) {
    const starter = TB_STARTER_TESTS.find((t) => t.key === key);
    if (!starter) return;
    setDraft({
      name: starter.name,
      level: starter.level,
      sourceLabel: `Cloned from ${starter.name}`,
      movements: starter.movements.map((m) => ({ ...m })),
      collectives: starter.collectives.map((c) => ({ ...c })),
    });
  }

  function openEdit(t: TestTemplateRow) {
    setDraft({
      id: t.id,
      name: t.name,
      level: t.level ?? '',
      movements: t.movements.map((m) => ({ ...m })),
      collectives: t.collectives.map((c) => ({ ...c })),
    });
  }

  function duplicate(t: TestTemplateRow) {
    save.mutate({
      orgId,
      name: `${t.name} (copy)`,
      level: t.level ?? undefined,
      movements: t.movements,
      collectives: t.collectives,
    });
  }

  function submitDraft() {
    if (!draft) return;
    const name = draft.name.trim();
    if (!name) return;
    save.mutate({
      id: draft.id,
      orgId,
      name,
      level: draft.level.trim() || undefined,
      sourceLabel: draft.sourceLabel,
      movements: draft.movements,
      collectives: draft.collectives,
    });
  }

  if (draft) {
    return (
      <Card className={SM_CARD_PAD}>
        <h2 className={SM_SECTION_HEAD}>{draft.id ? 'Edit test' : 'New test'}</h2>

        <div className="mb-4 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div>
            <label className={SM_LABEL}>Test name</label>
            <input
              value={draft.name}
              className={SM_INPUT}
              onChange={(e) => {
                setDraft({ ...draft, name: e.target.value });
              }}
            />
          </div>
          <div>
            <label className={SM_LABEL}>Level</label>
            <input
              value={draft.level}
              placeholder="e.g. Training Level"
              className={SM_INPUT}
              onChange={(e) => {
                setDraft({ ...draft, level: e.target.value });
              }}
            />
          </div>
        </div>

        <label className={SM_LABEL}>Movements</label>
        <div className="mb-3 flex flex-col gap-2">
          {draft.movements.map((m, i) => (
            <div key={i} className="grid grid-cols-[52px_minmax(0,1fr)_70px_auto] items-center gap-2.5">
              <input
                type="number"
                min={1}
                value={m.num}
                className={SM_ROW_INPUT}
                onChange={(e) => {
                  const num = Number.parseInt(e.target.value, 10);
                  const next = [...draft.movements];
                  next[i] = { ...m, num: Number.isFinite(num) ? num : m.num };
                  setDraft({ ...draft, movements: next });
                }}
              />
              <input
                value={m.text}
                placeholder="Movement description"
                className={SM_ROW_INPUT}
                onChange={(e) => {
                  const next = [...draft.movements];
                  next[i] = { ...m, text: e.target.value };
                  setDraft({ ...draft, movements: next });
                }}
              />
              <input
                type="number"
                min={1}
                max={10}
                value={m.coef}
                title="Coefficient"
                className={SM_ROW_INPUT}
                onChange={(e) => {
                  const coef = Number.parseInt(e.target.value, 10);
                  const next = [...draft.movements];
                  next[i] = { ...m, coef: Number.isFinite(coef) ? coef : m.coef };
                  setDraft({ ...draft, movements: next });
                }}
              />
              <button
                type="button"
                onClick={() => {
                  setDraft({ ...draft, movements: draft.movements.filter((_, j) => j !== i) });
                }}
                className="bg-transparent p-0 text-[13px] font-semibold text-[#5A6B63] transition-colors hover:text-status-danger"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <GhostButton
          className="mb-5"
          onClick={() => {
            setDraft({
              ...draft,
              movements: [...draft.movements, { num: nextMovementNum(draft.movements), text: '', coef: 1 }],
            });
          }}
        >
          + Add movement
        </GhostButton>

        <label className={SM_LABEL}>Collective marks</label>
        <div className="mb-3 flex flex-col gap-2">
          {draft.collectives.map((c, i) => (
            <div key={i} className="grid grid-cols-[minmax(0,1fr)_70px_auto] items-center gap-2.5">
              <input
                value={c.label}
                placeholder="e.g. Gaits (freedom and regularity)"
                className={SM_ROW_INPUT}
                onChange={(e) => {
                  const next = [...draft.collectives];
                  next[i] = { ...c, label: e.target.value };
                  setDraft({ ...draft, collectives: next });
                }}
              />
              <input
                type="number"
                min={1}
                max={10}
                value={c.coef}
                title="Coefficient"
                className={SM_ROW_INPUT}
                onChange={(e) => {
                  const coef = Number.parseInt(e.target.value, 10);
                  const next = [...draft.collectives];
                  next[i] = { ...c, coef: Number.isFinite(coef) ? coef : c.coef };
                  setDraft({ ...draft, collectives: next });
                }}
              />
              <button
                type="button"
                onClick={() => {
                  setDraft({ ...draft, collectives: draft.collectives.filter((_, j) => j !== i) });
                }}
                className="bg-transparent p-0 text-[13px] font-semibold text-[#5A6B63] transition-colors hover:text-status-danger"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <GhostButton
          className="mb-6"
          onClick={() => {
            setDraft({
              ...draft,
              collectives: [
                ...draft.collectives,
                { key: `mark-${String(draft.collectives.length + 1)}`, label: '', coef: 1 },
              ],
            });
          }}
        >
          + Add collective mark
        </GhostButton>

        <div className="flex flex-wrap gap-2.5">
          <PrimaryButton disabled={save.isPending || !draft.name.trim()} onClick={submitDraft}>
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
    <Card className={SM_CARD_PAD}>
      <h2 className={SM_SECTION_HEAD}>Test Builder</h2>
      <p className={SM_NOTE}>
        Your organization&apos;s own dressage tests — movements and collective marks you author
        once and reuse across shows.
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
        <p className="text-[13px] italic text-[#98A29D]">
          No tests in your library yet — start from a blank test or clone one of the starters above.
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {templates.map((t) => (
            <div
              key={t.id}
              className="flex flex-wrap items-center gap-3.5 rounded-[10px] border border-[#E9EDEB] px-4 py-3"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] font-semibold text-ink-deep">{t.name}</span>
                <span className="text-[12px] text-[#98A29D]">
                  {t.level ?? 'No level set'} · {String(t.movements.length)} movements ·{' '}
                  {String(t.collectives.length)} collective marks
                </span>
              </span>
              <button
                type="button"
                onClick={() => {
                  openEdit(t);
                }}
                className="text-[13px] font-semibold text-forest hover:underline"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => {
                  duplicate(t);
                }}
                className="text-[13px] font-semibold text-[#5A6B63] hover:text-forest"
              >
                Duplicate
              </button>
              <button
                type="button"
                onClick={() => {
                  del.mutate(t.id);
                }}
                className="text-[13px] font-semibold text-[#5A6B63] hover:text-status-danger"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
