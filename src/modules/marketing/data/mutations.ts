'use server';

import { createAdminClient } from '@/shared/lib/supabase/admin';
import { parseInput } from '@/shared/lib/action-result';
import { demoRequestSchema } from '@/modules/marketing/schemas';
import { DEMO_VOLUME_TO_SHOWS } from '@/modules/marketing/landing-content';
import { clientIp, rateLimit } from '@/shared/lib/rate-limit';
import {
  DEMO_REQUEST_ERROR_MESSAGE,
  DEMO_REQUEST_LIMIT,
  DEMO_REQUEST_RATE_LIMITED_MESSAGE,
  DEMO_REQUEST_WINDOW_MS,
} from '@/modules/marketing/constants';
import {
  escapeLikePattern,
  leadOrgName,
  repeatRequestNote,
} from '@/modules/marketing/lead-org-name';

// Public and written with the service-role key, so it is rate-limited per
// client IP and carries a honeypot field to drop scripted submissions.
export async function requestDemo(input: unknown): Promise<void> {
  const data = parseInput(demoRequestSchema, input);

  // Pretend success so a bot gets no signal that it was caught.
  if (data.hpCompanyUrl) return;

  const ip = await clientIp();
  const { limited } = rateLimit(`demo-request:${ip}`, {
    limit: DEMO_REQUEST_LIMIT,
    windowMs: DEMO_REQUEST_WINDOW_MS,
  });
  if (limited) throw new Error(DEMO_REQUEST_RATE_LIMITED_MESSAGE);

  const notes = [
    `Discipline: ${data.discipline}`,
    `Shows per year: ${data.volume}`,
    data.notes ? `\n${data.notes}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const orgName = leadOrgName(data.organization, data.name);
  const admin = createAdminClient();
  const { error } = await admin.from('leads').insert({
    org_name: orgName,
    contact_name: data.name,
    email: data.email,
    shows_per_year: DEMO_VOLUME_TO_SHOWS[data.volume] ?? null,
    notes,
    status: 'new',
  });

  if (error) {
    if (error.code === '23505') {
      // The same barn asked again. Keep the new request on the existing lead
      // instead of dropping it while telling the visitor it went through.
      await appendToExistingLead(admin, orgName, {
        receivedOn: new Date().toISOString().slice(0, 10),
        contactName: data.name,
        email: data.email,
        details: notes,
      });
      return;
    }

    console.error('[marketing] demo request failed', error.message);
    throw new Error(DEMO_REQUEST_ERROR_MESSAGE);
  }
}

async function appendToExistingLead(
  admin: ReturnType<typeof createAdminClient>,
  orgName: string,
  request: Parameters<typeof repeatRequestNote>[0],
): Promise<void> {
  const { data: existing, error: findError } = await admin
    .from('leads')
    .select('id, notes')
    .ilike('org_name', escapeLikePattern(orgName))
    .limit(1)
    .maybeSingle();
  if (findError || !existing) {
    console.error('[marketing] repeat demo request could not be attached', findError?.message);
    return;
  }
  const { error: updateError } = await admin
    .from('leads')
    .update({ notes: `${existing.notes ?? ''}${repeatRequestNote(request)}` })
    .eq('id', existing.id);
  if (updateError) {
    console.error('[marketing] repeat demo request could not be saved', updateError.message);
  }
}
