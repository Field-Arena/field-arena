import 'server-only';
import { createServerClient } from '@/shared/lib/supabase/server';
import { getShowCompleteness } from '@/modules/shows/data/setup-queries';
import { getShowTodos } from '@/modules/shows/data/dashboard-todos';
import { daysUntilShow } from '@/modules/shows/utils/current-shows';
import { SHOW_MANAGER_SECTIONS, type ShowManagerTab } from '@/modules/shows/constants';
import type { TodoPriority } from '@/modules/shows/types';

export interface ShowManagerNeed {
  key: string;
  priority: TodoPriority;
  label: string;
  detail: string;
  actionLabel: string;
  href: string;
  /** Show Manager step this item belongs to, when it maps to one. */
  step: ShowManagerTab | null;
  /** Short tag shown next to the label. */
  tag: string;
}

export interface ShowManagerOverview {
  name: string;
  startDate: string | null;
  endDate: string | null;
  venue: string | null;
  daysOut: number | null;
  readyCount: number;
  readyTotal: number;
  needs: ShowManagerNeed[];
  countsByStep: Partial<Record<ShowManagerTab, number>>;
  setupComplete: boolean;
}

/* Setup-readiness sections that live on another Show Manager step. Every
 * other section is edited on the Setup page. */
const SECTION_STEP: Record<string, ShowManagerTab> = {
  'Select Events': 'Select Events',
  'Required Documents': 'Documents',
};

const SECTION_ANCHOR: Record<string, string> = {
  'Show Details': '#show-details',
  Venue: '#venue',
  'Class Divisions': '#class-divisions',
  'Merchandise Sales': '#merchandise',
  'Waiver of Liability': '#waiver',
};

/* Works out which step a to-do belongs to from where its button goes. Show
 * links may use the slug or the id, so only the part after the show is
 * compared. */
function stepForHref(href: string): ShowManagerTab | null {
  const path = href.split(/[?#]/)[0] ?? '';
  const match = /^\/dashboard\/shows\/[^/]+(\/[^/]+)?$/.exec(path);
  if (match) {
    const sub = match[1] ?? '';
    return SHOW_MANAGER_SECTIONS.find((s) => s.path === sub)?.label ?? null;
  }
  if (path === '/dashboard/horses' || path === '/dashboard/riders') return 'Rider Entries';
  return null;
}

function tagForHref(href: string, step: ShowManagerTab | null): string {
  if (step) return step;
  if (href.startsWith('/dashboard/users')) return 'Users';
  return 'Show';
}

export async function getShowManagerOverview(showId: string): Promise<ShowManagerOverview | null> {
  const supabase = await createServerClient();
  const { data: show, error } = await supabase
    .from('shows')
    .select('id, slug, name, start_date, end_date, venue_name')
    .eq('id', showId)
    .maybeSingle();
  if (error) throw error;
  if (!show) return null;

  const todayIso = new Date().toISOString().slice(0, 10);
  const daysOut = daysUntilShow({ startDate: show.start_date }, todayIso);
  const ref = show.slug ?? show.id;

  const [completeness, { todos }] = await Promise.all([
    getShowCompleteness(show.id),
    getShowTodos({ id: show.id, slug: show.slug }, daysOut),
  ]);

  const needs: ShowManagerNeed[] = todos.map((todo) => {
    const step = stepForHref(todo.href);
    return { ...todo, step, tag: tagForHref(todo.href, step) };
  });

  // Unfinished setup sections the to-do list doesn't already cover.
  for (const section of completeness.sections) {
    if (section.ok) continue;
    const step = SECTION_STEP[section.name] ?? 'Setup';
    const path = SHOW_MANAGER_SECTIONS.find((s) => s.label === step)?.path ?? '';
    const missing = section.items.filter((i) => !i.ok).map((i) => i.label);
    needs.push({
      key: `setup-${section.name}`,
      priority: 'soon',
      label: `${section.name} not finished`,
      detail: missing.length > 0 ? `Still needed: ${missing.join(', ')}` : '',
      actionLabel: 'Finish',
      href: `/dashboard/shows/${ref}${path}${step === 'Setup' ? (SECTION_ANCHOR[section.name] ?? '') : ''}`,
      step,
      tag: step,
    });
  }

  const countsByStep: Partial<Record<ShowManagerTab, number>> = {};
  for (const need of needs) {
    if (need.step) countsByStep[need.step] = (countsByStep[need.step] ?? 0) + 1;
  }

  return {
    name: show.name,
    startDate: show.start_date,
    endDate: show.end_date,
    venue: show.venue_name,
    daysOut,
    readyCount: completeness.sections.filter((s) => s.ok).length,
    readyTotal: completeness.sections.length,
    needs,
    countsByStep,
    setupComplete: completeness.complete,
  };
}
