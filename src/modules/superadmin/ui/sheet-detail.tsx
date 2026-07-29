'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, Loader2Icon, Trash2Icon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/shadcn/dialog';
import { Button } from '@/shared/ui/shadcn/button';
import {
  CATALOG_FAMILY_META,
  CATALOG_SCORE_TYPES,
  CATALOG_DISCIPLINES,
  SHEET_FAMILIES,
} from '../constants';
import type { ScoringSheet } from '../data/queries';
import type { CollectiveItem, MovementItem } from '../schemas';
import { useUpdateScoringSheet, useDeleteScoringSheet } from '../hooks/use-catalog-mutations';

const INPUT =
  'w-full rounded-lg border border-[#D7CFBB] bg-white px-3.5 py-3 text-[14px] text-[#16261F] focus-visible:border-gold focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-gold/[.15]';
const SMALL_INPUT =
  'rounded-[7px] border border-[#E7E0D0] bg-[#FBFAF7] px-2.5 py-2 text-[13.5px] text-[#16261F] focus-visible:border-gold focus-visible:outline-none';
const LABEL = 'mb-2 block text-[10.5px] font-bold uppercase tracking-[0.13em] text-[#7A6A5C]';
const SECTION = 'rounded-[14px] border border-[#E7E0D0] bg-[#F6F0E2] px-[26px] pb-[26px] pt-6';
const H2 = 'font-[family-name:var(--font-nr)] text-[20px] font-semibold text-[#16261F]';
const SAVE =
  'rounded-[9px] bg-hunter-deep px-[22px] py-3 text-[13.5px] font-bold text-paper transition hover:bg-gold hover:text-hunter-deep disabled:opacity-60';
const FAM_FALLBACK = {
  label: 'Unassigned',
  blurb: 'Scoring family not yet confirmed',
  bg: '#F1F3F2',
  fg: '#7A8781',
  bd: '#E2E8E4',
};

type SheetFamily = (typeof SHEET_FAMILIES)[number];

interface DefShape {
  arena: string;
  rideTime: string;
  maxPoints: string;
  intro: string;
  errorScheduleText: string;
  movements: MovementItem[];
  collectives: CollectiveItem[];
}

function readDef(raw: unknown): DefShape {
  const d = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const str = (v: unknown) => {
    if (typeof v === 'string') return v;
    if (typeof v === 'number' || typeof v === 'boolean') return String(v);
    return '';
  };
  const movements: MovementItem[] = Array.isArray(d.movements)
    ? d.movements.map((m, i) => {
        const mv = (m ?? {}) as Record<string, unknown>;
        return {
          n: typeof mv.n === 'number' ? mv.n : i + 1,
          text: str(mv.text),
          coef: typeof mv.coef === 'number' ? mv.coef : 1,
        };
      })
    : [];
  const collectives: CollectiveItem[] = Array.isArray(d.collectives)
    ? d.collectives.map((c) => {
        const cm = (c ?? {}) as Record<string, unknown>;
        return {
          name: str(cm.name ?? cm.label),
          coef: typeof cm.coef === 'number' ? cm.coef : 1,
        };
      })
    : [];
  return {
    arena: str(d.arena),
    rideTime: str(d.rideTime),
    maxPoints: d.maxPoints == null ? '' : str(d.maxPoints),
    intro: str(d.intro),
    errorScheduleText: str(d.errorScheduleText),
    movements,
    collectives,
  };
}

/**
 * The catalog sheet detail/editor — Sheet Details plus, for movement sheets, the
 * header fields, movements, and collective marks. Everything saves through
 * updateScoringSheet in one go; the def is rebuilt from the edited fields.
 */
export function SheetDetail({ sheet }: { sheet: ScoringSheet }) {
  const router = useRouter();
  const initial = readDef(sheet.def);

  const [title, setTitle] = useState(sheet.title);
  const [level, setLevel] = useState(sheet.level ?? '');
  const [discipline, setDiscipline] = useState(sheet.discipline ?? 'Dressage');
  const [scoreType, setScoreType] = useState(sheet.governing_body ?? 'Independent');
  const [family, setFamily] = useState<SheetFamily>((sheet.family as SheetFamily | null) ?? 'unassigned');
  const [def, setDef] = useState<DefShape>(initial);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const update = useUpdateScoringSheet();
  const remove = useDeleteScoringSheet({
    onSuccess: () => {
      router.push('/dashboard/superadmin/catalog');
    },
  });

  const fam = CATALOG_FAMILY_META[family] ?? FAM_FALLBACK;
  const isMovement = family === 'movement';

  function save() {
    const maxPointsNum = def.maxPoints.trim() ? Number(def.maxPoints) : undefined;
    update.mutate({
      id: sheet.id,
      title,
      level,
      discipline,
      family,
      governingBody: scoreType,
      def: {
        arena: def.arena || undefined,
        rideTime: def.rideTime || undefined,
        maxPoints: Number.isFinite(maxPointsNum) ? maxPointsNum : undefined,
        intro: def.intro || undefined,
        errorScheduleText: def.errorScheduleText || undefined,
        movements: def.movements,
        collectives: def.collectives,
      },
    });
  }

  return (
    <div className="mx-auto max-w-[1000px] space-y-5">
      <Link
        href="/dashboard/superadmin/catalog"
        className="inline-flex items-center gap-2 text-[13px] font-bold text-hunter-deep transition-colors hover:text-gold"
      >
        <ArrowLeftIcon className="size-[14px]" aria-hidden />
        Scoring Catalog
      </Link>

      <div>
        <div className="mb-2 flex flex-wrap items-center gap-3">
          <h1 className="font-[family-name:var(--font-nr)] text-[31px] font-semibold leading-[1.06] tracking-[-.022em] text-[#16261F]">
            {title || 'Untitled sheet'}
          </h1>
          <span className="inline-flex h-6 items-center rounded-md border border-dashed border-[#C9B98A] px-2.5 text-[11.5px] font-semibold text-[#7A6A3C]">
            {sheet.source_file ? 'Official' : 'Stub'}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span
            className="inline-flex h-6 items-center rounded-md border px-2.5 text-[11.5px] font-bold"
            style={{ background: fam.bg, borderColor: fam.bd, color: fam.fg }}
          >
            {fam.label}
          </span>
          <span className="text-[14px] text-fa-muted-2">{fam.blurb}</span>
        </div>
      </div>

      {/* Sheet details */}
      <section className={SECTION}>
        <h2 className={`${H2} mb-[18px]`}>Sheet details</h2>
        <div className="grid gap-[18px] [grid-template-columns:repeat(auto-fit,minmax(230px,1fr))]">
          <Field label="Title" value={title} onChange={setTitle} />
          <Field label="Level" value={level} onChange={setLevel} placeholder="e.g. First" />
          <div>
            <label htmlFor="sd-disc" className={LABEL}>
              Discipline
            </label>
            <select
              id="sd-disc"
              value={discipline}
              onChange={(e) => {
                setDiscipline(e.target.value);
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
                setScoreType(e.target.value);
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
                setFamily(e.target.value as SheetFamily);
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

      {isMovement ? (
        <>
          {/* Sheet header */}
          <section className={SECTION}>
            <h2 className={`${H2} mb-1.5`}>Sheet header</h2>
            <p className="mb-[18px] text-[12.5px] text-[#8A8275]">Masthead fields the judge sees.</p>
            <div className="grid gap-[18px] [grid-template-columns:repeat(auto-fit,minmax(230px,1fr))]">
              <Field label="Introduce (new movements)" value={def.intro} onChange={(v) => { setDef((d) => ({ ...d, intro: v })); }} />
              <Field label="Arena" value={def.arena} onChange={(v) => { setDef((d) => ({ ...d, arena: v })); }} placeholder="20x40 or 20x60" />
              <Field label="Average ride time" value={def.rideTime} onChange={(v) => { setDef((d) => ({ ...d, rideTime: v })); }} placeholder="5:00" />
              <Field label="Max points" value={def.maxPoints} onChange={(v) => { setDef((d) => ({ ...d, maxPoints: v })); }} placeholder="220" />
              <Field label="Error-of-course schedule" value={def.errorScheduleText} onChange={(v) => { setDef((d) => ({ ...d, errorScheduleText: v })); }} placeholder="1st = 2 pts · 2nd = elimination" />
            </div>
          </section>

          {/* Movements */}
          <section className={SECTION}>
            <h2 className={`${H2} mb-1.5`}>Movements</h2>
            <p className="mb-4 text-[12.5px] leading-[1.55] text-[#8A8275]">
              Each numbered movement: the test text as printed and its coefficient. % = (subtotal −
              errors) ÷ max.
            </p>
            <div className="mb-3.5 flex flex-col gap-2.5">
              {def.movements.length === 0 && (
                <p className="text-[13px] text-[#8A8275]">Nothing here yet.</p>
              )}
              {def.movements.map((mv, i) => (
                <div key={i} className="flex items-center gap-3 rounded-[10px] border border-[#E7E0D0] bg-white px-3.5 py-3">
                  <span className="flex-none text-[13px] font-bold text-[#16261F]">{mv.n}</span>
                  <input
                    value={mv.text}
                    placeholder="Test text as printed"
                    onChange={(e) => {
                      setDef((d) => ({
                        ...d,
                        movements: d.movements.map((m, j) => (j === i ? { ...m, text: e.target.value } : m)),
                      }));
                    }}
                    className={`${SMALL_INPUT} min-w-0 flex-1`}
                  />
                  <input
                    value={String(mv.coef)}
                    placeholder="Coef"
                    onChange={(e) => {
                      const c = Number(e.target.value);
                      setDef((d) => ({
                        ...d,
                        movements: d.movements.map((m, j) => (j === i ? { ...m, coef: Number.isFinite(c) ? c : 0 } : m)),
                      }));
                    }}
                    className={`${SMALL_INPUT} w-[78px] flex-none`}
                  />
                  <RowRemove
                    label="Remove movement"
                    onClick={() => {
                      setDef((d) => ({
                        ...d,
                        movements: d.movements.filter((_, j) => j !== i).map((m, j) => ({ ...m, n: j + 1 })),
                      }));
                    }}
                  />
                </div>
              ))}
            </div>
            <AddRow
              label="+ Add movement"
              onClick={() => {
                setDef((d) => ({ ...d, movements: [...d.movements, { n: d.movements.length + 1, text: '', coef: 1 }] }));
              }}
            />
          </section>

          {/* Collective marks */}
          <section className={SECTION}>
            <h2 className={`${H2} mb-4`}>Collective marks</h2>
            <div className="mb-3.5 flex flex-col gap-2.5">
              {def.collectives.length === 0 && (
                <p className="text-[13px] text-[#8A8275]">Nothing here yet.</p>
              )}
              {def.collectives.map((cm, i) => (
                <div key={i} className="flex items-center gap-3 rounded-[10px] border border-[#E7E0D0] bg-white px-3.5 py-3">
                  <input
                    value={cm.name}
                    placeholder="e.g. Gaits"
                    onChange={(e) => {
                      setDef((d) => ({
                        ...d,
                        collectives: d.collectives.map((c, j) => (j === i ? { ...c, name: e.target.value } : c)),
                      }));
                    }}
                    className={`${SMALL_INPUT} min-w-0 flex-1`}
                  />
                  <input
                    value={String(cm.coef)}
                    placeholder="Coef"
                    onChange={(e) => {
                      const c = Number(e.target.value);
                      setDef((d) => ({
                        ...d,
                        collectives: d.collectives.map((cc, j) => (j === i ? { ...cc, coef: Number.isFinite(c) ? c : 0 } : cc)),
                      }));
                    }}
                    className={`${SMALL_INPUT} w-[78px] flex-none`}
                  />
                  <RowRemove
                    label="Remove collective"
                    onClick={() => {
                      setDef((d) => ({ ...d, collectives: d.collectives.filter((_, j) => j !== i) }));
                    }}
                  />
                </div>
              ))}
            </div>
            <AddRow
              label="+ Add collective"
              onClick={() => {
                setDef((d) => ({ ...d, collectives: [...d.collectives, { name: '', coef: 1 }] }));
              }}
            />
          </section>
        </>
      ) : (
        <section className={SECTION}>
          <h2 className={`${H2} mb-1.5`}>Pick a scoring family</h2>
          <p className="text-[14px] leading-[1.6] text-[#8A8275]">
            The detailed criteria editor is built for movement sheets. Set this sheet to{' '}
            <strong className="text-[#16261F]">Movement test</strong> above to scaffold movements and
            collective marks, or keep the metadata and add the {fam.label.toLowerCase()} criteria
            later.
          </p>
        </section>
      )}

      <div className="flex items-center gap-3">
        <button type="button" disabled={update.isPending} className={SAVE} onClick={save}>
          {update.isPending ? 'Saving…' : 'Save sheet'}
        </button>
        <Link
          href="/dashboard/superadmin/catalog"
          className="rounded-[9px] border border-[#C4D3CB] bg-white px-[18px] py-3 text-[13.5px] font-semibold text-hunter-deep transition-colors hover:border-gold"
        >
          Cancel
        </Link>
        <button
          type="button"
          onClick={() => {
            setConfirmOpen(true);
          }}
          className="ml-auto inline-flex items-center gap-2 rounded-[9px] border border-[#E4CFC9] px-4 py-3 text-[13px] font-bold text-[#B4432F] transition-colors hover:border-[#B4432F] hover:bg-[#FCF1EF]"
        >
          <Trash2Icon className="size-[15px]" aria-hidden />
          Delete sheet
        </button>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-hunter-deep">
              Delete {sheet.title}?
            </DialogTitle>
            <DialogDescription>
              This removes the sheet from the platform catalog. Shows that already copied it into a
              class keep their own copy.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setConfirmOpen(false);
              }}
            >
              Keep
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={remove.isPending}
              onClick={() => {
                remove.mutate(sheet.id);
              }}
            >
              {remove.isPending && <Loader2Icon className="animate-spin" aria-hidden />}
              {remove.isPending ? 'Deleting…' : 'Delete sheet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({
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

function RowRemove({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid size-[30px] flex-none place-items-center rounded-[7px] border border-transparent text-[#B4432F] transition-colors hover:border-[#F0D3CE] hover:bg-[#FCF1EF]"
    >
      <Trash2Icon className="size-[14px]" aria-hidden />
    </button>
  );
}

function AddRow({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-[#C4D3CB] bg-white px-3.5 py-2.5 text-[13px] font-semibold text-hunter-deep transition-colors hover:border-gold"
    >
      {label}
    </button>
  );
}
