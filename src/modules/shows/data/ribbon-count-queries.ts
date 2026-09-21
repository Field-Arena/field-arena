import 'server-only';
import { createServerClient } from '@/shared/lib/supabase/server';
import { assertCanManageEntryLedger } from '@/modules/shows/data/entry-numbering';
import {
  awardUnitsFor,
  unitPlacings,
  type AwardClassInput,
  type AwardEntry,
} from '@/modules/shows/awards-engine';
import { DEFAULT_SCHEDULE_PREFS, type RibbonColor } from '@/modules/shows/constants';
import type { SchedulePrefs } from '@/modules/shows/data/setup-queries';

export interface RibbonCountRow {
  unitLabel: string;
  pooled: boolean;
  classLabels: string[];
  ribbonPlaces: number;
  // One ribbon set per non-empty placing group from unitPlacings() — the
  // same primitive the real Awards screen ranks with. Normally 1 per unit;
  // more than 1 only when the show's awardsByDivision preference splits it
  // into separate J/Y/A/O groups. Never driven by how many different tests
  // riders chose (a Test of Choice class still ranks and awards as one
  // combined group).
  ribbonSets: number;
  entryCount: number;
}

export interface RibbonCountPageData {
  showId: string;
  showName: string;
  rows: RibbonCountRow[];
}

export async function getRibbonCountReport(showId: string): Promise<RibbonCountPageData | null> {
  await assertCanManageEntryLedger(showId);

  const supabase = await createServerClient();

  const { data: show, error: showError } = await supabase
    .from('shows')
    .select('id, name, schedule_prefs')
    .eq('id', showId)
    .maybeSingle();
  if (showError) throw showError;
  if (!show) return null;

  const prefs = {
    ...DEFAULT_SCHEDULE_PREFS,
    ...((show.schedule_prefs ?? {}) as Partial<SchedulePrefs>),
  };

  const { data: classes, error: classesError } = await supabase
    .from('classes')
    .select(
      'id, label, display_name, division, group_name, award_scope, ribbon_places, ribbon_colors',
    )
    .eq('show_id', showId);
  if (classesError) throw classesError;

  if (classes.length === 0) return { showId: show.id, showName: show.name, rows: [] };

  const classIds = classes.map((c) => c.id);
  const { data: entries, error: entriesError } = await supabase
    .from('class_entries')
    .select('class_id, num, rider, horse, final_pct, collective_total, division')
    .in('class_id', classIds);
  if (entriesError) throw entriesError;

  const byClass = new Map<string, AwardEntry[]>();
  for (const entry of entries) {
    const list = byClass.get(entry.class_id) ?? [];
    list.push({
      num: entry.num,
      name: entry.rider ?? '',
      horse: entry.horse ?? '',
      pct: entry.final_pct == null ? null : Number(entry.final_pct),
      ctot: entry.collective_total,
      division: entry.division,
    });
    byClass.set(entry.class_id, list);
  }

  const awardInputs: AwardClassInput[] = classes.map((c) => ({
    id: c.id,
    label: c.display_name ?? c.label,
    awardScope: c.award_scope,
    division: c.division,
    groupName: c.group_name,
    ribbonPlaces: c.ribbon_places ?? 6,
    ribbonColors: c.ribbon_colors as RibbonColor[] | null,
    entries: byClass.get(c.id) ?? [],
  }));

  const units = awardUnitsFor(awardInputs);

  const rows: RibbonCountRow[] = units.map((unit) => {
    const groups = unitPlacings(unit, prefs.awardsByDivision).filter((g) => g.rows.length > 0);
    return {
      unitLabel: unit.label,
      pooled: unit.pooled,
      classLabels: unit.classes.map((c) => c.label),
      ribbonPlaces: unit.ribbonPlaces,
      ribbonSets: groups.length,
      entryCount: groups.reduce((sum, g) => sum + g.rows.length, 0),
    };
  });

  rows.sort((a, b) => a.unitLabel.localeCompare(b.unitLabel));

  return { showId: show.id, showName: show.name, rows };
}
