import 'server-only';
import { createServerClient } from '@/shared/lib/supabase/server';

/**
 * Org-wide reads: the member database and org-level document library.
 *
 * The member database is deliberately org-scoped, not show-scoped. A member's
 * standing predates any show they appear on, which is why membership_status and
 * membership_expires live here rather than on a per-show staff row.
 */

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
}

export async function listMembers(orgId: string): Promise<MemberRow[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('member_database')
    .select(
      'id, name, first_name, last_name, email, phone, role, membership_status, membership_expires, notes'
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
  }));
}

export interface TestTemplateRow {
  id: string;
  name: string;
  level: string | null;
  sourceLabel: string | null;
  movementCount: number;
}

/** The organization's own reusable test library, distinct from the platform catalog. */
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
