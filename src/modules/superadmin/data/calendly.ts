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

export async function upsertLeadFromCalendly(lead: CalendlyLead): Promise<void> {
  const admin = createAdminClient();

  const EXISTING_COLUMNS =
    'id, org_name, contact_name, email, website, shows_per_year, calendly_event_uri, demo_at';

  let existing: {
    id: string;
    org_name: string;
    contact_name: string | null;
    email: string | null;
    website: string | null;
    shows_per_year: number | null;
    calendly_event_uri: string | null;
    demo_at: string | null;
  } | null = null;
  if (lead.calendlyEventUri) {
    const { data } = await admin
      .from('leads')
      .select(EXISTING_COLUMNS)
      .eq('calendly_event_uri', lead.calendlyEventUri)
      .maybeSingle();
    existing = data;
  }
  if (!existing && lead.email) {
    const { data } = await admin
      .from('leads')
      .select(EXISTING_COLUMNS)
      .eq('email', lead.email)
      .maybeSingle();
    existing = data;
  }

  // Every field falls back to what is already on the row. A webhook retry, or
  // a booking form that simply didn't collect a website/phone, must ENRICH the
  // existing lead — writing the payload straight through blanked out data a
  // human had already filled in by hand.
  const fields = {
    org_name: lead.orgName ?? existing?.org_name ?? 'Unknown organization',
    contact_name: lead.contactName ?? existing?.contact_name ?? null,
    email: lead.email ?? existing?.email ?? null,
    website: lead.website ?? existing?.website ?? null,
    shows_per_year: lead.showsPerYear ?? existing?.shows_per_year ?? null,
    calendly_event_uri: lead.calendlyEventUri ?? existing?.calendly_event_uri ?? null,
    demo_at: lead.demoAt ?? existing?.demo_at ?? null,
    status: 'demo_scheduled',
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    const { error } = await admin.from('leads').update(fields).eq('id', existing.id);
    if (error) throw error;
  } else {
    const { error } = await admin.from('leads').insert(fields);
    if (error) throw error;
  }
}
