import 'server-only';
import { getHorsesPageData } from '@/modules/shows/data/horses-queries';
import { getShowAttention, getShowStats } from '@/modules/shows/data/queries';
import { createServerClient } from '@/shared/lib/supabase/server';
import { COGGINS_LABEL } from '@/modules/shows/constants';
import { todoPriority, sortTodos, type TodoKind } from '@/modules/shows/utils/todo-priority';
import { ticketSalesStatus } from '@/modules/shows/utils/ticket-sales';
import type {
  DashboardTodo,
  ShowDocumentSummary,
  ShowPanelDetail,
  TicketSales,
} from '@/modules/shows/types';

const isCoggins = (label: string) => label.trim().toLowerCase() === COGGINS_LABEL.toLowerCase();

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
    cogginsConfirmed: 0,
    cogginsTotal: 0,
    cogginsAwaiting: 0,
    cogginsRejected: 0,
    cogginsNotUploaded: 0,
    waiversSigned: 0,
    waiversTotal: 0,
  };
  if (!data) return summary;

  for (const row of data.rows) {
    for (const doc of row.documents) {
      const coggins = isCoggins(doc.label);
      if (coggins) {
        summary.cogginsTotal++;
        if (doc.uploaded && doc.verified && !doc.expired) summary.cogginsConfirmed++;
      }
      if (!doc.uploaded) {
        summary.notUploaded++;
        if (coggins) summary.cogginsNotUploaded++;
      } else if (
        doc.expired ||
        doc.status === 'rejected' ||
        doc.status === 'replacement_requested'
      ) {
        summary.problem++;
        if (coggins && doc.expired) summary.cogginsExpired++;
        else if (coggins) summary.cogginsRejected++;
      } else if (doc.needsApproval) {
        summary.awaitingReview++;
        if (coggins) summary.cogginsAwaiting++;
      }
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
): Promise<{
  todos: DashboardTodo[];
  documents: ShowDocumentSummary;
  entries: number;
  revenue: number;
  tickets: TicketSales;
  detail: ShowPanelDetail;
}> {
  const supabase = await createServerClient();
  const [
    documents,
    attention,
    stats,
    { count: signed },
    { data: showRow },
    { data: bookings },
    { data: vendorItems },
    { count: classCount },
  ] = await Promise.all([
    getShowDocumentSummary(show.id),
    getShowAttention(show.id),
    getShowStats(show.id),
    supabase
      .from('waiver_signatures')
      .select('id', { count: 'exact', head: true })
      .eq('show_id', show.id),
    supabase
      .from('shows')
      .select('published, ticket_open, ticket_close, runner_state, venue_name, locations')
      .eq('id', show.id)
      .maybeSingle(),
    supabase.from('vendor_bookings').select('status, amount_total').eq('show_id', show.id),
    supabase.from('vendor_items').select('qty, enabled').eq('show_id', show.id),
    supabase.from('classes').select('id', { count: 'exact', head: true }).eq('show_id', show.id),
  ]);
  const ref = show.slug ?? show.id;
  const bookingRows = bookings ?? [];
  const spaceTotal = (vendorItems ?? [])
    .filter((i) => i.enabled !== false)
    .reduce((sum, i) => sum + (i.qty ?? 0), 0);
  const detail: ShowPanelDetail = {
    riders: stats.riders,
    horses: stats.horses,
    classes: classCount ?? 0,
    rings: Array.isArray(showRow?.locations) ? showRow.locations.length : 0,
    venue: showRow?.venue_name ?? null,
    ticketOpen: showRow?.ticket_open ?? null,
    ticketClose: showRow?.ticket_close ?? null,
    vendors: {
      paid: bookingRows.filter((b) => b.status === 'paid').length,
      pending: bookingRows.filter((b) => (b.status ?? 'pending') === 'pending').length,
      approvedUnpaid: bookingRows.filter((b) => b.status === 'approved').length,
      revenue: bookingRows
        .filter((b) => b.status === 'paid')
        .reduce((sum, b) => sum + (b.amount_total ?? 0), 0),
      spaces: spaceTotal > 0 ? spaceTotal : null,
    },
  };
  const tickets = ticketSalesStatus({
    published: showRow?.published ?? false,
    ticketOpen: showRow?.ticket_open ?? null,
    ticketClose: showRow?.ticket_close ?? null,
    manuallyClosed: !!(showRow?.runner_state as { ticketClosed?: boolean } | null)?.ticketClosed,
  });
  documents.waiversTotal = stats.riders;
  documents.waiversSigned = Math.min(signed ?? 0, stats.riders);
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

  const unsigned = documents.waiversTotal - documents.waiversSigned;
  if (unsigned > 0) {
    add('document-missing', {
      key: 'waivers-unsigned',
      label: `${plural(unsigned, 'rider')} ${unsigned === 1 ? "hasn't" : "haven't"} signed the waiver`,
      detail: 'Every rider must sign before they can ride.',
      actionLabel: 'See who',
      href: `/dashboard/riders?show=${show.slug ?? show.id}`,
    });
  }

  if (detail.vendors.approvedUnpaid > 0) {
    const n = detail.vendors.approvedUnpaid;
    add('note', {
      key: 'vendors-unpaid',
      label: `${plural(n, 'approved vendor')} ${n === 1 ? "hasn't" : "haven't"} paid`,
      detail: "Their booth isn't held until payment comes in.",
      actionLabel: 'See vendors',
      href: `/dashboard/users?show=${ref}`,
    });
  }

  for (const item of attention) {
    // The shared attention list points vendor and staff reviews at routes
    // without the show; on the dashboard they open the organizer's Users
    // screen for this show, where vendors are approved and staff managed.
    const href =
      item.href === '/dashboard/vendor' || item.href === '/dashboard/users'
        ? `/dashboard/users?show=${ref}`
        : item.href;
    add(item.severity === 'warn' ? 'setup-warning' : 'note', {
      key: `attention-${item.label}`,
      label: item.label,
      detail: item.detail,
      actionLabel: item.actionLabel,
      href,
    });
  }

  return {
    todos: sortTodos(todos),
    documents,
    entries: stats.entries,
    revenue: stats.settledRevenue,
    tickets,
    detail,
  };
}
