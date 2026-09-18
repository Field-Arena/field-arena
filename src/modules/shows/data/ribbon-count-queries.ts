import 'server-only';
import { createServerClient } from '@/shared/lib/supabase/server';
import { assertCanManageEntryLedger } from '@/modules/shows/data/entry-numbering';
import { awardUnitsFor, type AwardClassInput } from '@/modules/shows/awards-engine';
import type { RibbonColor } from '@/modules/shows/constants';

export interface RibbonCountRow {
  unitLabel: string;
  pooled: boolean;
  classLabels: string[];
  ribbonPlaces: number;
  ribbonSets: number;
  entryCount: number;
}

export interface RibbonCountPageData {
  showId: string;
  showName: string;
  rows: RibbonCountRow[];
}

function extractTestName(override: unknown): string | null {
  if (!override || typeof override !== 'object') return null;
  const name = (override as Record<string, unknown>).name;
  return typeof name === 'string' && name.trim() ? name : null;
}

export async function getRibbonCountReport(showId: string): Promise<RibbonCountPageData | null> {
  await assertCanManageEntryLedger(showId);

  const supabase = await createServerClient();

  const { data: show, error: showError } = await supabase
    .from('shows')
    .select('id, name')
    .eq('id', showId)
    .maybeSingle();
  if (showError) throw showError;
  if (!show) return null;

  const { data: classes, error: classesError } = await supabase
    .from('classes')
    .select('id, label, display_name, division, group_name, award_scope, ribbon_places, ribbon_colors')
    .eq('show_id', showId);
  if (classesError) throw classesError;

  if (classes.length === 0) return { showId: show.id, showName: show.name, rows: [] };

  const classIds = classes.map((c) => c.id);
  const { data: entries, error: entriesError } = await supabase
    .from('class_entries')
    .select('class_id, test_override, status')
    .in('class_id', classIds)
    .neq('status', 'scratched');
  if (entriesError) throw entriesError;

  const testNamesByClass = new Map<string, Set<string>>();
  const entryCountByClass = new Map<string, number>();
  for (const e of entries) {
    entryCountByClass.set(e.class_id, (entryCountByClass.get(e.class_id) ?? 0) + 1);
    const testName = extractTestName(e.test_override) ?? '';
    const set = testNamesByClass.get(e.class_id) ?? new Set<string>();
    set.add(testName);
    testNamesByClass.set(e.class_id, set);
  }

  const awardInputs: AwardClassInput[] = classes.map((c) => ({
    id: c.id,
    label: c.display_name ?? c.label,
    awardScope: c.award_scope,
    division: c.division,
    groupName: c.group_name,
    ribbonPlaces: c.ribbon_places ?? 6,
    ribbonColors: c.ribbon_colors as RibbonColor[] | null,
    entries: [],
  }));

  const units = awardUnitsFor(awardInputs);

  const rows: RibbonCountRow[] = units.map((unit) => {
    const testNames = new Set<string>();
    let entryCount = 0;
    for (const cls of unit.classes) {
      entryCount += entryCountByClass.get(cls.id) ?? 0;
      for (const name of testNamesByClass.get(cls.id) ?? []) testNames.add(name);
    }
    // A class using Test of Choice needs one ribbon set per distinct test
    // riders actually chose, not one per class — an ordinary class always
    // has the single '' (no-override) key, so this stays 1 for it.
    const ribbonSets = entryCount === 0 ? 0 : Math.max(1, testNames.size);
    return {
      unitLabel: unit.label,
      pooled: unit.pooled,
      classLabels: unit.classes.map((c) => c.label),
      ribbonPlaces: unit.ribbonPlaces,
      ribbonSets,
      entryCount,
    };
  });

  rows.sort((a, b) => a.unitLabel.localeCompare(b.unitLabel));

  return { showId: show.id, showName: show.name, rows };
}
