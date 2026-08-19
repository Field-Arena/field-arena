'use server';

import { createAdminClient } from '@/shared/lib/supabase/admin';
import { demoRequestSchema } from '@/modules/marketing/schemas';
import { DEMO_VOLUME_TO_SHOWS } from '@/modules/marketing/landing-content';
import { DEMO_REQUEST_ERROR_MESSAGE } from '@/modules/marketing/constants';

/**
 * Records a "Book a demo" request as a lead.
 *
 * Written with the service-role client, which is unusual here and deliberate:
 * public.leads carries a single RLS policy (leads_super_admin_all), so an
 * anonymous visitor cannot insert. Relaxing that policy to admit anon would open
 * the table to arbitrary writes from anywhere; keeping it closed and going
 * through one narrow, schema-validated server action does not.
 *
 * Two consequences worth naming:
 *
 *  - This is the only publicly-callable write on the platform. Every field is
 *    validated and length-bounded before the insert, and only the six form
 *    fields are ever written — the caller cannot set status, dates, or the
 *    onboarding checklist.
 *  - There is no captcha or per-IP throttle yet, so it can be submitted
 *    repeatedly. That is a spam risk on the Sales Funnel, not a data-integrity
 *    one; it wants a rate limit before the site is publicly announced.
 */
export async function requestDemo(input: unknown): Promise<void> {
  const data = demoRequestSchema.parse(input);

  // Discipline has no column of its own, and the chosen volume range is coarser
  // than the integer column — both are preserved verbatim in the note so the
  // sales conversation still has the visitor's actual answers.
  const notes = [
    `Discipline: ${data.discipline}`,
    `Shows per year: ${data.volume}`,
    data.notes ? `\n${data.notes}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const admin = createAdminClient();
  const { error } = await admin.from('leads').insert({
    org_name: data.organization,
    contact_name: data.name,
    email: data.email,
    shows_per_year: DEMO_VOLUME_TO_SHOWS[data.volume] ?? null,
    notes,
    status: 'new',
  });

  if (error) {
    // A lead for this organization already exists (leads_org_name_key is unique
    // on org_name). From the visitor's side that is not a failure — their
    // interest is already on our radar and they can still book a walkthrough —
    // so we let the flow continue to the "thank you / schedule" step rather than
    // surface a raw database constraint error. The existing lead is left
    // untouched so an in-progress sales conversation is never clobbered.
    if (error.code === '23505') return;

    // Anything else is a genuine server-side fault: log the real cause for us,
    // show the visitor a plain, actionable message instead of Postgres wording.
    console.error('[marketing] demo request failed', error.message);
    throw new Error(DEMO_REQUEST_ERROR_MESSAGE);
  }
}
