import Link from 'next/link';
import { NewShowButton } from '@/modules/shows/ui/show-manager/new-show-button';
import type { DashboardShowRow, DashboardTodo, ShowDocumentSummary } from '@/modules/shows/types';
import { DocumentStatusChips } from './document-status-chips';
import { TodoList } from './todo-list';

export interface HomeShow {
  show: DashboardShowRow;
  daysOut: number | null;
  entries: number | null;
  todos: DashboardTodo[];
  documents: ShowDocumentSummary;
}

export const STAGE_LABEL: Record<string, string> = {
  setup: 'Setup',
  'sales-open': 'Entries open',
  'sales-closed': 'Entries closed',
  live: 'Live',
  complete: 'Complete',
};

export function whenLabel(daysOut: number | null): string | null {
  if (daysOut === null) return null;
  if (daysOut <= 0) return 'Running now';
  return daysOut === 1 ? 'Tomorrow' : `${String(daysOut)} days out`;
}

const box = 'rounded-2xl border-[1.5px] border-[#C9D3CE] bg-white';

/** The organizer's landing view: the shows they're working on now, each one
 * a way into that show, and one to-do list per show underneath. */
export function DashboardHome({ orgName, shows }: { orgName: string; shows: HomeShow[] }) {
  if (shows.length === 0) {
    return (
      <section>
        <h1 className="m-0 text-[30px] font-extrabold text-[#0D2C23]">Your shows</h1>
        <div className={`${box} mt-5 p-6`}>
          <h2 className="m-0 text-[20px] font-extrabold text-[#0D2C23]">No current shows</h2>
          <p className="mt-1.5 mb-4 text-[15px] text-[#5A6B63]">
            {orgName} has nothing coming up. Create a show, or open a finished one from Completed.
          </p>
          <NewShowButton />
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="m-0 text-[30px] leading-tight font-extrabold text-[#0D2C23]">
            Your shows
          </h1>
          <p className="mt-1 mb-0 text-[15px] text-[#5A6B63]">
            Click a show to go into it. Use the tabs above to switch any time.
          </p>
        </div>
        <NewShowButton />
      </div>

      <div className="mb-9 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {shows.map(({ show, daysOut, entries, documents }) => {
          const ref = show.slug ?? show.id;
          const when = whenLabel(daysOut);
          return (
            <Link
              key={show.id}
              href={`/dashboard?show=${ref}`}
              prefetch={false}
              className={`${box} group flex flex-col p-5 no-underline transition hover:border-[#1A5B3C] hover:shadow-[0_10px_28px_-14px_rgba(16,40,32,.35)]`}
            >
              <h2 className="m-0 text-[22px] leading-tight font-extrabold text-[#0D2C23]">
                {show.name}
              </h2>
              <p className="mt-1.5 mb-0 text-[15px] font-semibold text-[#16261F]">
                {[show.dateLabel, STAGE_LABEL[show.stage] ?? show.stage]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
              <p className="mt-1 mb-3 text-[14px] text-[#5A6B63]">
                {[entries === null ? null : `${String(entries)} entries`, when]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
              <DocumentStatusChips documents={documents} />
              <span className="mt-auto pt-4 text-[15px] font-extrabold text-[#1A5B3C] group-hover:underline">
                Enter show →
              </span>
            </Link>
          );
        })}
      </div>

      <h2 className="mt-0 mb-4 text-[24px] font-extrabold text-[#0D2C23]">To-do by show</h2>
      <div className="grid gap-5">
        {shows.map(({ show, todos }) => {
          const urgent = todos.filter((t) => t.priority === 'urgent').length;
          return (
            <div key={show.id} className={`${box} p-5`}>
              <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
                <h3 className="m-0 text-[19px] font-extrabold text-[#0D2C23]">{show.name}</h3>
                <span className="flex gap-2 text-[13.5px] font-bold">
                  <span className="rounded-lg bg-[#EDF0EE] px-2.5 py-1 text-[#16261F]">
                    {todos.length} open
                  </span>
                  {urgent > 0 && (
                    <span className="rounded-lg bg-[#B4432F] px-2.5 py-1 text-white">
                      {urgent} urgent
                    </span>
                  )}
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
