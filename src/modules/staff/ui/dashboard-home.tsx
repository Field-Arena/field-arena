import Link from 'next/link';
import { NewShowButton } from '@/modules/shows/public';
import type { DashboardShowRow, DashboardTodo, ShowDocumentSummary } from '@/modules/shows/types';
import { DocumentStatusChips } from './document-status-chips';
import { TodoList } from './todo-list';

export interface HomeShow {
  show: DashboardShowRow;
  daysOut: number | null;
  todos: DashboardTodo[];
  documents: ShowDocumentSummary;
}

const STAGE_LABEL: Record<string, string> = {
  setup: 'Setup',
  'sales-open': 'Entries open',
  'sales-closed': 'Entries closed',
  live: 'Live',
  complete: 'Complete',
};

function whenLabel(daysOut: number | null): string | null {
  if (daysOut === null) return null;
  if (daysOut <= 0) return 'Running now';
  return daysOut === 1 ? 'Tomorrow' : `${String(daysOut)} days out`;
}

/** The organizer's landing view: the shows they're working on now, each one
 * a way into that show, and one to-do list per show underneath. */
export function DashboardHome({ orgName, shows }: { orgName: string; shows: HomeShow[] }) {
  if (shows.length === 0) {
    return (
      <section>
        <div className="fa-page-head">
          <div>
            <h2>Dashboard</h2>
            <p>Your current shows and what needs doing.</p>
          </div>
        </div>
        <div className="fa-mini-card">
          <h4>No current shows</h4>
          <p>
            {orgName} has nothing coming up. Create a show, or open a finished one from Completed.
          </p>
          <NewShowButton className="mt-4" />
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="fa-page-head">
        <div>
          <h2>Dashboard</h2>
          <p>Your current shows and what needs doing. Click a show to go into it.</p>
        </div>
        <div className="fa-head-actions">
          <NewShowButton />
        </div>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {shows.map(({ show, daysOut, documents }) => {
          const ref = show.slug ?? show.id;
          const when = whenLabel(daysOut);
          return (
            <Link
              key={show.id}
              href={`/dashboard?show=${ref}`}
              prefetch={false}
              className="fa-aside-card block no-underline transition-shadow hover:shadow-[var(--fa-shadow-md)]"
            >
              <h4 className="m-0">{show.name}</h4>
              <p className="m-0 text-[12.5px] text-[var(--fa-ink-2)]">
                {[show.dateLabel, STAGE_LABEL[show.stage] ?? show.stage]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
              <p className="mt-1 mb-2 text-[12.5px] text-[var(--fa-ink-3)]">
                {[`${String(show.riderCount)} riders`, when].filter(Boolean).join(' · ')}
              </p>
              <DocumentStatusChips documents={documents} />
              <span className="mt-3 block text-[12.5px] font-semibold text-[var(--fa-brand)]">
                Enter show →
              </span>
            </Link>
          );
        })}
      </div>

      <h3 className="mb-3 text-[15px] font-semibold text-[var(--fa-ink)]">To-do by show</h3>
      <div className="grid gap-3">
        {shows.map(({ show, todos }) => {
          const urgent = todos.filter((t) => t.priority === 'urgent').length;
          return (
            <div key={show.id} className="fa-aside-card">
              <div className="mb-1 flex items-center justify-between gap-3">
                <h4 className="m-0">{show.name}</h4>
                <span className="text-[12px] text-[var(--fa-ink-3)]">
                  {todos.length} open · {urgent} urgent
                </span>
              </div>
              <TodoList todos={todos} />
            </div>
          );
        })}
      </div>
    </section>
  );
}
