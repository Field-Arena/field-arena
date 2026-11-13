import 'server-only';
import { createServerClient } from '@/shared/lib/supabase/server';
import { getShowStats } from '@/modules/shows/data/queries';
import { getExportInput } from '@/modules/results-export/data/get-export-input';
import { buildUsefRows } from '@/modules/results-export/utils/build-usef-rows';
import { computeUsefReadiness, type ReadinessItem } from '@/modules/results-export/utils/readiness';

export interface PostShowReport {
  showName: string;
  startDate: string | null;
  endDate: string | null;
  venue: string | null;
  days: number;
  rings: number;
  classes: number;
  entries: number;
  riders: number;
  horses: number;
  scored: number;
  scratched: number;
  resultsPublished: number;
  revenue: number;
  /** Rows the export will contain. */
  exportRows: number;
  readiness: ReadinessItem[];
}

/* Everything the post-show report shows, built from the same data the export
 * uses so the page and the file always agree. Read with the caller's own
 * session, so row-level security applies. */
export async function getPostShowReport(showId: string): Promise<PostShowReport | null> {
  const input = await getExportInput(showId);
  if (!input) return null;

  const supabase = await createServerClient();
  const [showRes, classRes, stats] = await Promise.all([
    supabase.from('shows').select('end_date, venue_name, locations').eq('id', showId).maybeSingle(),
    supabase.from('classes').select('id, date, results_published').eq('show_id', showId),
    getShowStats(showId),
  ]);
  if (showRes.error) throw showRes.error;
  if (classRes.error) throw classRes.error;

  const { entries, classes } = input;
  const scratched = entries.filter((e) => e.status === 'scratched' || e.finalPct === 'SCR').length;
  const scored = entries.filter((e) => e.status === 'scored' && e.pct !== null).length;
  const bundle = buildUsefRows(input);

  return {
    showName: input.show.name,
    startDate: input.show.startDate,
    endDate: showRes.data?.end_date ?? null,
    venue: showRes.data?.venue_name ?? null,
    days: new Set(classRes.data.map((c) => c.date).filter(Boolean)).size,
    rings: Array.isArray(showRes.data?.locations) ? showRes.data.locations.length : 0,
    classes: classes.length,
    entries: entries.length - scratched,
    riders: new Set(entries.map((e) => e.riderKey)).size,
    horses: new Set(entries.map((e) => e.horseKey)).size,
    scored,
    scratched,
    resultsPublished: classRes.data.filter((c) => c.results_published === true).length,
    revenue: stats.settledRevenue,
    exportRows: bundle.rows.length,
    readiness: computeUsefReadiness(input),
  };
}
