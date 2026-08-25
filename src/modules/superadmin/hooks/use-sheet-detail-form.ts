'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SHEET_FAMILIES } from '@/modules/superadmin/constants';
import type { ScoringSheet } from '@/modules/superadmin/types';
import { readSheetDef, type SheetDefShape } from '@/modules/superadmin/utils/read-sheet-def';
import {
  useUpdateScoringSheet,
  useDeleteScoringSheet,
} from '@/modules/superadmin/hooks/use-catalog-mutations';

type SheetFamily = (typeof SHEET_FAMILIES)[number];

/** Owns the sheet-detail editing form state, its save payload, and the delete-confirm dialog. */
export function useSheetDetailForm(sheet: ScoringSheet) {
  const router = useRouter();

  const [title, setTitle] = useState(sheet.title);
  const [level, setLevel] = useState(sheet.level ?? '');
  const [discipline, setDiscipline] = useState(sheet.discipline ?? 'Dressage');
  const [scoreType, setScoreType] = useState(sheet.governing_body ?? 'Independent');
  const [family, setFamily] = useState<SheetFamily>(
    (sheet.family as SheetFamily | null) ?? 'unassigned',
  );
  const [def, setDef] = useState<SheetDefShape>(() => readSheetDef(sheet.def));
  const [confirmOpen, setConfirmOpen] = useState(false);

  const update = useUpdateScoringSheet();
  const remove = useDeleteScoringSheet({
    onSuccess: () => {
      router.push('/dashboard/superadmin/catalog');
    },
  });

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

  return {
    title,
    setTitle,
    level,
    setLevel,
    discipline,
    setDiscipline,
    scoreType,
    setScoreType,
    family,
    setFamily,
    def,
    setDef,
    confirmOpen,
    setConfirmOpen,
    update,
    remove,
    save,
  };
}
