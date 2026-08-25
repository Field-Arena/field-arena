import 'server-only';
import { createServerClient } from '@/shared/lib/supabase/server';
import type { VenueListItem, VenueRing, VenueStable } from '@/modules/organizations/types';

export interface MemberRow {
  id: string;
  name: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
  membershipStatus: string;
  membershipExpires: string | null;
  notes: string | null;

  extraFields: Record<string, string>;
}

export async function listMembers(orgId: string): Promise<MemberRow[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('member_database')
    .select(
      'id, name, first_name, last_name, email, phone, role, membership_status, membership_expires, notes, extra_fields',
    )
    .eq('org_id', orgId)
    .order('name');
  if (error) throw error;

  return data.map((m) => ({
    id: m.id,
    name: m.name,
    firstName: m.first_name,
    lastName: m.last_name,
    email: m.email,
    phone: m.phone,
    role: m.role,
    membershipStatus: m.membership_status ?? 'active',
    membershipExpires: m.membership_expires,
    notes: m.notes,
    extraFields: (m.extra_fields ?? {}) as Record<string, string>,
  }));
}

export interface TestTemplateRow {
  id: string;
  name: string;
  level: string | null;
  sourceLabel: string | null;
  movementCount: number;
}

export async function listTestTemplates(orgId: string): Promise<TestTemplateRow[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('test_templates')
    .select('id, name, level, source_label, movements')
    .eq('org_id', orgId)
    .order('name');
  if (error) throw error;

  return data.map((t) => ({
    id: t.id,
    name: t.name,
    level: t.level,
    sourceLabel: t.source_label,
    movementCount: Array.isArray(t.movements) ? t.movements.length : 0,
  }));
}

export async function listVenues(orgId: string): Promise<VenueListItem[]> {
  const supabase = await createServerClient();

  const [{ data: venues, error }, { data: shows, error: showsError }] = await Promise.all([
    supabase
      .from('venues')
      .select('id, name, city, region, address, website, phone, contact, rings, stables')
      .eq('org_id', orgId)
      .order('name'),
    supabase.from('shows').select('venue_id').eq('org_id', orgId),
  ]);
  if (error) throw error;
  if (showsError) throw showsError;

  const usage = new Map<string, number>();
  for (const show of shows) {
    if (show.venue_id) usage.set(show.venue_id, (usage.get(show.venue_id) ?? 0) + 1);
  }

  return venues.map((v) => ({
    id: v.id,
    name: v.name,
    address: v.address,
    website: v.website,
    phone: v.phone,
    contact: v.contact,
    city: v.city,
    region: v.region,
    rings: (v.rings ?? []) as unknown as VenueRing[],
    stables: (v.stables ?? []) as unknown as VenueStable[],
    showCount: usage.get(v.id) ?? 0,
  }));
}
