import 'server-only';
import { createServerClient } from '@/shared/lib/supabase/server';
import { assertCanManageEntryLedger } from '@/modules/shows/data/entry-numbering';

export interface TestPrintRow {
  classId: string;
  classLabel: string;
  division: string | null;
  location: string | null;
  date: string | null;
  testName: string | null;
  testEdition: string | null;
  rideCount: number;
  judgeCount: number;
  workingCopies: number;
  blankCopies: number;
  totalCopies: number;
}

export interface TestPrintPageData {
  showId: string;
  showName: string;
  rows: TestPrintRow[];
}

export async function getTestPrintCounts(showId: string): Promise<TestPrintPageData | null> {
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
    .select('id, label, display_name, division, location, date')
    .eq('show_id', showId);
  if (classesError) throw classesError;

  if (classes.length === 0) return { showId: show.id, showName: show.name, rows: [] };

  const classIds = classes.map((c) => c.id);

  const [{ data: tests, error: testsError }, { data: entries, error: entriesError }, { data: panel, error: panelError }] =
    await Promise.all([
      supabase.from('class_tests').select('class_id, name, edition').in('class_id', classIds),
      supabase.from('class_entries').select('class_id').in('class_id', classIds),
      supabase.from('class_panel').select('class_id, judge_staff_id').in('class_id', classIds),
    ]);
  if (testsError) throw testsError;
  if (entriesError) throw entriesError;
  if (panelError) throw panelError;

  const testByClass = new Map(tests.map((t) => [t.class_id, t]));

  const rideCountByClass = new Map<string, number>();
  for (const e of entries) {
    rideCountByClass.set(e.class_id, (rideCountByClass.get(e.class_id) ?? 0) + 1);
  }

  const judgeCountByClass = new Map<string, number>();
  for (const p of panel) {
    if (!p.judge_staff_id) continue;
    judgeCountByClass.set(p.class_id, (judgeCountByClass.get(p.class_id) ?? 0) + 1);
  }

  const rows: TestPrintRow[] = classes.map((cls) => {
    const test = testByClass.get(cls.id);
    const rideCount = rideCountByClass.get(cls.id) ?? 0;
    const judgeCount = judgeCountByClass.get(cls.id) ?? 0;
    const workingCopies = rideCount * judgeCount;
    // One blank/cover copy per class, regardless of ride/judge count — the
    // office needs a packet cover even for a class not yet fully staffed.
    const blankCopies = 1;
    return {
      classId: cls.id,
      classLabel: cls.display_name ?? cls.label,
      division: cls.division,
      location: cls.location,
      date: cls.date,
      testName: test?.name ?? null,
      testEdition: test?.edition ?? null,
      rideCount,
      judgeCount,
      workingCopies,
      blankCopies,
      totalCopies: workingCopies + blankCopies,
    };
  });

  rows.sort((a, b) => a.classLabel.localeCompare(b.classLabel));

  return { showId: show.id, showName: show.name, rows };
}
