'use server';

import { createAdminClient } from '@/shared/lib/supabase/admin';
import { demoRequestSchema } from '@/modules/marketing/schemas';
import { DEMO_VOLUME_TO_SHOWS } from '@/modules/marketing/landing-content';
import { DEMO_REQUEST_ERROR_MESSAGE } from '@/modules/marketing/constants';

export async function requestDemo(input: unknown): Promise<void> {
  const data = demoRequestSchema.parse(input);

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
    if (error.code === '23505') return;

    console.error('[marketing] demo request failed', error.message);
    throw new Error(DEMO_REQUEST_ERROR_MESSAGE);
  }
}
