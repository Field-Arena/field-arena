import 'server-only';
import { getHorsesPageData } from '@/modules/shows/data/horses-queries';
import { getShowAttention } from '@/modules/shows/data/queries';
import { COGGINS_LABEL } from '@/modules/shows/constants';
import { todoPriority, sortTodos, type TodoKind } from '@/modules/shows/utils/todo-priority';
import type { DashboardTodo, ShowDocumentSummary } from '@/modules/shows/types';

/* Counts every required horse document for the show by where it stands.
 * Built on the Horses page's own resolution (horses-queries), so the
 * dashboard and the Horses screen can never disagree about a document. */
export async function getShowDocumentSummary(showId: string): Promise<ShowDocumentSummary> {
  const data = await getHorsesPageData(showId);
  const summary: ShowDocumentSummary = {
    notUploaded: 0,
    awaitingReview: 0,
    problem: 0,
    cogginsExpired: 0,
  };
  if (!data) return summary;

  for (const row of data.rows) {
    for (const doc of row.documents) {
      if (!doc.uploaded) summary.notUploaded++;
      else if (doc.expired || doc.status === 'rejected' || doc.status === 'replacement_requested') {
        summary.problem++;
        if (doc.label === COGGINS_LABEL && doc.expired) summary.cogginsExpired++;
      } else if (doc.needsApproval) summary.awaitingReview++;
    }
  }
  return summary;
}

const plural = (n: number, one: string, many = `${one}s`) => `${String(n)} ${n === 1 ? one : many}`;

/* The show's running to-do list: rider documents plus the dashboard's
 * existing "needs attention" checks, ranked by urgency. */
export async function getShowTodos(
  show: { id: string; slug: string | null },
  daysOut: number | null,
): Promise<{ todos: DashboardTodo[]; documents: ShowDocumentSummary }> {
  const [documents, attention] = await Promise.all([
    getShowDocumentSummary(show.id),
    getShowAttention(show.id),
  ]);
  const horsesHref = `/dashboard/horses?show=${show.slug ?? show.id}`;
  const todos: DashboardTodo[] = [];
  const add = (kind: TodoKind, todo: Omit<DashboardTodo, 'priority'>) => {
    todos.push({ ...todo, priority: todoPriority(kind, daysOut) });
  };

  if (documents.cogginsExpired > 0) {
    add('document-problem', {
      key: 'coggins-expired',
      label: `${plural(documents.cogginsExpired, 'Coggins', 'Coggins')} expired`,
      detail: "These horses can't come on the grounds until riders upload a current test.",
      actionLabel: 'Review',
      href: horsesHref,
    });
  }
  const otherProblems = documents.problem - documents.cogginsExpired;
  if (otherProblems > 0) {
    add('document-problem', {
      key: 'documents-problem',
      label: `${plural(otherProblems, 'document')} expired, rejected or awaiting a replacement`,
      detail: 'Riders need to send a new copy.',
      actionLabel: 'Review',
      href: horsesHref,
    });
  }
  if (documents.awaitingReview > 0) {
    add('document-review', {
      key: 'documents-review',
      label: `${plural(documents.awaitingReview, 'document')} waiting for your review`,
      detail: 'Uploaded by riders and not confirmed yet.',
      actionLabel: 'Review',
      href: horsesHref,
    });
  }
  if (documents.notUploaded > 0) {
    add('document-missing', {
      key: 'documents-missing',
      label: `${plural(documents.notUploaded, 'required document')} not uploaded`,
      detail: "Riders haven't sent these yet.",
      actionLabel: 'See who',
      href: horsesHref,
    });
  }

  for (const item of attention) {
    add(item.severity === 'warn' ? 'setup-warning' : 'note', {
      key: `attention-${item.label}`,
      label: item.label,
      detail: item.detail,
      actionLabel: item.actionLabel,
      href: item.href,
    });
  }

  return { todos: sortTodos(todos), documents };
}
