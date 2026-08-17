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
import { CATALOG_FAMILY_META, SHEET_FAMILIES } from '../constants';
import type { ScoringSheet } from '../types';
import { readSheetDef, type SheetDefShape } from '../utils';
import { useUpdateScoringSheet, useDeleteScoringSheet } from '../hooks/use-catalog-mutations';
import { SECTION, H2 } from './sheet-detail-styles';
import { SheetDetailsForm } from './sheet-details-form';
import { SheetMovementsEditor } from './sheet-movements-editor';
import { SheetCollectivesEditor } from './sheet-collectives-editor';

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

/**
 * The catalog sheet detail/editor — Sheet Details plus, for movement sheets, the
 * header fields, movements, and collective marks. Everything saves through
 * updateScoringSheet in one go; the def is rebuilt from the edited fields.
 *
 * Composes SheetDetailsForm / SheetMovementsEditor / SheetCollectivesEditor,
 * which own their own section's markup — this component owns the shared form
 * state (so Save can assemble one payload from every section) and the
 * save/cancel/delete actions.
 */
export function SheetDetail({ sheet }: { sheet: ScoringSheet }) {
  const router = useRouter();
  const initial = readSheetDef(sheet.def);

  const [title, setTitle] = useState(sheet.title);
  const [level, setLevel] = useState(sheet.level ?? '');
  const [discipline, setDiscipline] = useState(sheet.discipline ?? 'Dressage');
  const [scoreType, setScoreType] = useState(sheet.governing_body ?? 'Independent');
  const [family, setFamily] = useState<SheetFamily>((sheet.family as SheetFamily | null) ?? 'unassigned');
  const [def, setDef] = useState<SheetDefShape>(initial);

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
        onFamilyChange={setFamily}
      />

      {isMovement ? (
        <>
          <SheetMovementsEditor def={def} setDef={setDef} />
          <SheetCollectivesEditor def={def} setDef={setDef} />
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
