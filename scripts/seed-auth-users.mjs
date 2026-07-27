#!/usr/bin/env node
/**
 * Creates demo auth accounts and their profile rows.
 *
 * This is separate from supabase/seed.sql because public.users and public.riders
 * are keyed to auth.users, and auth accounts can only be created through the
 * Admin API — not from SQL. Running the SQL seed alone leaves the app
 * unusable: every RLS policy resolves the caller's role through one of those two
 * profile tables, so a session without a profile row sees zero rows everywhere
 * and the dashboard renders empty with no error to explain why.
 *
 * Idempotent: an existing account is updated in place rather than duplicated.
 *
 * Usage:
 *   node scripts/seed-auth-users.mjs
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

for (const line of readFileSync(join(ROOT, '.env.local'), 'utf8').split('\n')) {
  const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
  if (match && !process.env[match[1]]) {
    process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error('Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/** Demo credentials. Fine for a demo project; never for anything real. */
const PASSWORD = 'FieldArena!2026';
const PEACHTREE_ORG = 'a0000000-0000-4000-8000-000000000004';
const BLUE_RIDGE_SHOW = 'c0000000-0000-4000-8000-000000000001';

const STAFF = [
  { email: 'superadmin@fieldarena-demo.test', name: 'Brooks Avery', role: 'SuperAdmin', orgId: null },
  { email: 'organizer@fieldarena-demo.test', name: 'Rhonda Pike', role: 'Organizer', orgId: PEACHTREE_ORG },
  // Deliberately org_id null: a ShowAdmin's authority comes from a
  // staff_assignments row for one show, never from org membership. Setting
  // org_id here would be the very authorization bug the legacy code fixed.
  { email: 'showadmin@fieldarena-demo.test', name: 'Marcus Hale', role: 'ShowAdmin', orgId: null, staffEmail: 'marcus.hale@fieldarena-demo.test' },
  { email: 'judge@fieldarena-demo.test', name: 'Elena Marsh', role: 'Judge', orgId: null, staffEmail: 'elena.marsh@fieldarena-demo.test' },
];

const RIDERS = [
  { email: 'rider1@fieldarena-demo.test', firstName: 'Nina', lastName: 'Cohen', horse: 'Kismet B' },
  { email: 'rider2@fieldarena-demo.test', firstName: 'Chase', lastName: 'Doyle', horse: 'Marble K' },
  { email: 'rider3@fieldarena-demo.test', firstName: 'Brooke', lastName: 'Frost', horse: 'Sable J' },
];

/** Returns the auth user id for an email, creating the account if absent. */
async function ensureAuthUser(email, fullName) {
  // listUsers is paginated and has no email filter, so a targeted lookup means
  // paging until found. The demo project is small enough that one page suffices.
  const { data: list, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (listError) throw listError;

  const existing = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (existing) {
    await supabase.auth.admin.updateUserById(existing.id, { password: PASSWORD });
    return { id: existing.id, created: false };
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: PASSWORD,
    // Skips the confirmation email — these accounts must be usable immediately.
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error) throw error;
  return { id: data.user.id, created: true };
}

let created = 0;
let updated = 0;

console.log('Staff accounts');
for (const person of STAFF) {
  const { id, created: isNew } = await ensureAuthUser(person.email, person.name);
  if (isNew) created++;
  else updated++;

  const { error } = await supabase.from('users').upsert(
    { id, name: person.name, email: person.email, platform_role: person.role, org_id: person.orgId, country: 'US' },
    { onConflict: 'id' }
  );
  if (error) throw new Error(`profile for ${person.email}: ${error.message}`);

  // Bind the existing seeded staff_assignments row to this login. Until this is
  // set, has_staff_assignment() has to fall back to matching on email.
  if (person.staffEmail) {
    const { error: linkError } = await supabase
      .from('staff_assignments')
      .update({ user_id: id, status: 'accepted' })
      .eq('email', person.staffEmail);
    if (linkError) throw new Error(`staff link for ${person.email}: ${linkError.message}`);
  }

  console.log(`  ${isNew ? 'created' : 'updated'}  ${person.role.padEnd(11)} ${person.email}`);
}

console.log('\nRider accounts');
for (const rider of RIDERS) {
  const { id, created: isNew } = await ensureAuthUser(rider.email, `${rider.firstName} ${rider.lastName}`);
  if (isNew) created++;
  else updated++;

  const { error } = await supabase.from('riders').upsert(
    {
      id,
      email: rider.email,
      first_name: rider.firstName,
      last_name: rider.lastName,
      phone: '404-555-0100',
      city: 'Atlanta',
      state: 'GA',
      zip: '30301',
    },
    { onConflict: 'id' }
  );
  if (error) throw new Error(`rider profile for ${rider.email}: ${error.message}`);

  // One horse each. Name is immutable once set (enforced by trigger), so this
  // only inserts when the rider has no horse yet.
  const { data: horses } = await supabase.from('horses').select('id').eq('rider_id', id);
  if (!horses?.length) {
    const { error: horseError } = await supabase
      .from('horses')
      .insert({ rider_id: id, name: rider.horse, stable: 'Peachtree Stables', is_stallion: false });
    if (horseError) throw new Error(`horse for ${rider.email}: ${horseError.message}`);
  }

  // A signed waiver for the show the dashboard opens on.
  const { error: waiverError } = await supabase.from('waiver_signatures').upsert(
    {
      rider_id: id,
      show_id: BLUE_RIDGE_SHOW,
      full_name: `${rider.firstName} ${rider.lastName}`,
      signature_date: '2026-06-20',
    },
    { onConflict: 'rider_id,show_id' }
  );
  if (waiverError) throw new Error(`waiver for ${rider.email}: ${waiverError.message}`);

  console.log(`  ${isNew ? 'created' : 'updated'}  Rider       ${rider.email}`);
}

console.log(`\n${created} created, ${updated} updated.`);
console.log(`Password for every account above: ${PASSWORD}`);
