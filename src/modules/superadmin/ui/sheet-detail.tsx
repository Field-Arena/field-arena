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
import { CATALOG_FAMILY_META, SHEET_FAMILIES } from '@/modules/superadmin/constants';
import type { ScoringSheet } from '@/modules/superadmin/types';
import {
  readSheetDef,
  emptySheetDef,
  type SheetDefShape,
} from '@/modules/superadmin/utils/read-sheet-def';
import {
  useUpdateScoringSheet,
  useDeleteScoringSheet,
} from '@/modules/superadmin/hooks/use-catalog-mutations';
import { SECTION, H2 } from '@/modules/superadmin/ui/sheet-detail-styles';
import { SheetDetailsForm } from '@/modules/superadmin/ui/sheet-details-form';
import { SheetMovementsEditor } from '@/modules/superadmin/ui/sheet-movements-editor';
import { SheetCollectivesEditor } from '@/modules/superadmin/ui/sheet-collectives-editor';
import { SheetFreestyleEditor } from '@/modules/superadmin/ui/sheet-freestyle-editor';
import { SheetWeightedEditor } from '@/modules/superadmin/ui/sheet-weighted-editor';
import { SheetPlacingEditor } from '@/modules/superadmin/ui/sheet-placing-editor';
import { SheetJudgePreview } from '@/modules/superadmin/ui/sheet-judge-preview';

const SAVE =
  'rounded-[9px] bg-[#146A47] px-[22px] py-3 text-[13.5px] font-bold text-white transition hover:bg-[#146A47] hover:text-[#101828] disabled:opacity-60';
/* Provenance is a curation state, not "does a PDF exist": a sheet can have its
 * file attached and still be an unverified auto-classified stub. Legacy
 * srcPill()'s four states, kept verbatim. */
export const SOURCE_LABEL: Record<string, string> = {
  stub: 'Stub — not yet verified',
  manual: 'Verified · manual',
  parsed: 'Auto-extracted · checks pass',
  typical: 'Typical default',
};

const FAM_FALLBACK = {
  label: 'Unassigned',
  blurb: 'Scoring family not yet confirmed',
  bg: '#EEF1F4',
  fg: '#8A94A3',
  bd: '#E7EAEE',
};

type SheetFamily = (typeof SHEET_FAMILIES)[number];
type SheetSource = 'manual' | 'parsed' | 'typical' | null;

export function SheetDetail({ sheet }: { sheet: ScoringSheet }) {
  const router = useRouter();
  const initial = readSheetDef(sheet.def);

  const [title, setTitle] = useState(sheet.title);
  const [level, setLevel] = useState(sheet.level ?? '');
  const [discipline, setDiscipline] = useState(sheet.discipline ?? 'Dressage');
  const [scoreType, setScoreType] = useState(sheet.governing_body ?? 'Independent');
  const [family, setFamily] = useState<SheetFamily>(
    (sheet.family as SheetFamily | null) ?? 'unassigned',
  );
  const [def, setDef] = useState<SheetDefShape>(initial);
  const [source, setSource] = useState<SheetSource>((sheet.source as SheetSource | null) ?? null);
  const [previewing, setPreviewing] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const update = useUpdateScoringSheet();
  const remove = useDeleteScoringSheet({
    onSuccess: () => {
      router.push('/dashboard/superadmin/catalog');
    },
  });

  const fam = CATALOG_FAMILY_META[family] ?? FAM_FALLBACK;
  const isMovement = family === 'movement';

  /* Switching scoring family clears the criteria, exactly as legacy catFam()
   * did. A movement sheet's movements and collectives are meaningless to the
   * freestyle or placing renderer — carrying them across would persist
   * orphaned data under a family that never reads it. The header fields are
   * part of the same def, so they reset with it. */
  function changeFamily(next: SheetFamily) {
    if (next === family) return;
    setFamily(next);
    setDef(emptySheetDef());
  }

  function save() {
    const maxPointsNum = def.maxPoints.trim() ? Number(def.maxPoints) : undefined;
    update.mutate({
      id: sheet.id,
      title,
      level,
      discipline,
      family,
      governingBody: scoreType,
      source,
      def: {
        // Movement masthead
        intro: def.intro || undefined,
        purpose: def.purpose || undefined,
        arena: def.arena || undefined,
        rideTime: def.rideTime || undefined,
        maxPoints: Number.isFinite(maxPointsNum) ? maxPointsNum : undefined,
        errorScheduleText: def.errorScheduleText || undefined,
        footNote: def.footNote || undefined,
        movements: def.movements,
        collectives: def.collectives,
        // Freestyle
        technical: def.technical,
        artistic: def.artistic,
        // Weighted / 100
        categories: def.categories,
        // Placing
        method: def.method || undefined,
        criteria: def.criteria || undefined,
      },
    });
  }

  if (previewing) {
    return (
      <SheetJudgePreview
        title={title || 'Untitled sheet'}
        def={def}
        onBack={() => {
          setPreviewing(false);
        }}
      />
    );
  }

  return (
    <div className="mx-auto max-w-[1000px] space-y-5">
      <Link
        href="/dashboard/superadmin/catalog"
        prefetch={false}
        className="inline-flex items-center gap-2 text-[13px] font-bold text-[#101828] transition-colors hover:text-[#146A47]"
      >
        <ArrowLeftIcon className="size-[14px]" aria-hidden />
        Scoring Catalog
      </Link>

      <div>
        <div className="mb-2 flex flex-wrap items-center gap-3">
          <h1 className="font-[family-name:var(--font-nr)] text-[31px] leading-[1.06] font-semibold tracking-[-.022em] text-[#101828]">
            {title || 'Untitled sheet'}
          </h1>
          <span className="inline-flex h-6 items-center rounded-md border border-dashed border-[#F6DCB8] px-2.5 text-[11.5px] font-semibold text-[#B45309]">
            {SOURCE_LABEL[source ?? 'stub']}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span
            className="inline-flex h-6 items-center rounded-md border px-2.5 text-[11.5px] font-bold"
            style={{ background: fam.bg, borderColor: fam.bd, color: fam.fg }}
          >
            {fam.label}
          </span>
          <span className="text-[14px] text-[#8A94A3]">{fam.blurb}</span>
        </div>
      </div>

      <SheetDetailsForm
        title={title}
        onTitleChange={setTitle}
        level={level}
        onLevelChange={setLevel}
        discipline={discipline}
        onDisciplineChange={setDiscipline}
        scoreType={scoreType}
        onScoreTypeChange={setScoreType}
        family={family}
        onFamilyChange={changeFamily}
        source={source}
        onSourceChange={setSource}
        sourceFile={sheet.source_file}
      />

      {family === 'movement' && (
        <>
          <SheetMovementsEditor def={def} setDef={setDef} />
          <SheetCollectivesEditor def={def} setDef={setDef} />
        </>
      )}
      {family === 'freestyle' && <SheetFreestyleEditor def={def} setDef={setDef} />}
      {family === 'weighted' && <SheetWeightedEditor def={def} setDef={setDef} />}
      {family === 'placing' && <SheetPlacingEditor def={def} setDef={setDef} />}
      {family === 'unassigned' && (
        <section className={SECTION}>
          <h2 className={`${H2} mb-1.5`}>Pick a scoring family</h2>
          <p className="text-[14px] leading-[1.6] text-[#8A94A3]">
            The scoring family drives what the scoreboard reads and which criteria editor appears
            here. Set one above — movement, freestyle, weighted or placing — to start scaffolding
            this sheet.
          </p>
        </section>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          disabled={update.isPending}
          className={`h-auto hover:bg-transparent ${SAVE}`}
          onClick={save}
        >
          {update.isPending ? 'Saving…' : 'Save sheet'}
        </Button>
        {/* The only way to check a transcribed sheet actually scores the way
            the paper one does, before a show publishes against it. */}
        {isMovement && def.movements.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setPreviewing(true);
            }}
            className="h-auto rounded-[9px] border border-[#D0D5DD] bg-white px-[18px] py-3 text-[13.5px] font-semibold text-[#101828] transition-colors hover:border-[#D6DBE1] hover:bg-[#FBFCFD]"
          >
            ▶ Preview as judge
          </Button>
        )}
        <Link
          href="/dashboard/superadmin/catalog"
          prefetch={false}
          className="rounded-[9px] border border-[#D0D5DD] bg-white px-[18px] py-3 text-[13.5px] font-semibold text-[#101828] transition-colors hover:border-[#D6DBE1]"
        >
          Cancel
        </Link>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setConfirmOpen(true);
          }}
          className="ml-auto inline-flex h-auto items-center gap-2 rounded-[9px] border border-[#FBCFC9] px-4 py-3 text-[13px] font-bold text-[#B42318] transition-colors hover:border-[#B42318] hover:bg-[#FEF3F2]"
        >
          <Trash2Icon className="size-[15px]" aria-hidden />
          Delete sheet
        </Button>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-[#101828]">
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
