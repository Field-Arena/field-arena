import 'server-only';
import { createAdminClient } from '@/shared/lib/supabase/admin';

export interface CalendlyLead {
  orgName: string | null;
  contactName: string | null;
  email: string | null;
  website: string | null;
  showsPerYear: number | null;
  calendlyEventUri: string | null;
  demoAt: string | null;
}

/**
 * Upsert a sales lead from a Calendly `invitee.created` booking (ported from
 * field-and-arena-main api/leads.js `upsertLeadFromCalendly`).
 *
 * Idempotent: matches an existing lead by `calendly_event_uri` first so a
 * webhook retry for the same booking updates rather than duplicates, then falls
 * back to `email`. Either way the lead lands in the Sales Funnel as
 * `demo_scheduled`. Runs through the service-role client because the webhook is
 * public and unauthenticated — the signature check on the route is its gate.
 */
export async function upsertLeadFromCalendly(lead: CalendlyLead): Promise<void> {
  const admin = createAdminClient();

  let existing: { id: string; org_name: string } | null = null;
  if (lead.calendlyEventUri) {
    const { data } = await admin
      .from('leads')
      .select('id, org_name')
      .eq('calendly_event_uri', lead.calendlyEventUri)
      .maybeSingle();
    existing = data;
  }
  if (!existing && lead.email) {
    const { data } = await admin
      .from('leads')
      .select('id, org_name')
      .eq('email', lead.email)
      .maybeSingle();
    existing = data;
  }

  const fields = {
    org_name: lead.orgName ?? existing?.org_name ?? 'Unknown organization',
    contact_name: lead.contactName,
    email: lead.email,
    website: lead.website,
    shows_per_year: lead.showsPerYear,
    calendly_event_uri: lead.calendlyEventUri,
    demo_at: lead.demoAt,
    status: 'demo_scheduled',
  };

  if (existing) {
    const { error } = await admin.from('leads').update(fields).eq('id', existing.id);
    if (error) throw error;
  } else {
    const { error } = await admin.from('leads').insert(fields);
    if (error) throw error;
  }
}
