import { NextResponse, type NextRequest } from 'next/server';
import { verifyCalendlySignature } from '@/shared/lib/calendly';
import { upsertLeadFromCalendly } from '@/modules/superadmin/data/calendly';

/**
 * Calendly's server-to-server "invitee.created" webhook — fires when someone
 * books the demo call on the client's Calendly page. Ported from
 * field-and-arena-main api/calendly-webhook.js.
 *
 * A route handler, not a Server Action: Calendly POSTs here directly with no
 * Field & Arena session, and the only trust boundary is the HMAC signature over
 * the raw body (verifyCalendlySignature). The booking lands in the Sales Funnel
 * as a `demo_scheduled` lead (upsertLeadFromCalendly, idempotent on retries).
 *
 * Setup: add Organization / Website / "how many shows per year" as custom
 * questions on the Calendly event type, then create the webhook subscription
 * pointed at {SITE}/api/webhooks/calendly with signing-key
 * CALENDLY_WEBHOOK_SIGNING_KEY.
 */

interface CalendlyQuestion {
  question?: string;
  answer?: string;
}
interface CalendlyPayload {
  name?: string;
  email?: string;
  event?: string;
  uri?: string;
  questions_and_answers?: CalendlyQuestion[];
  scheduled_event?: { start_time?: string };
}
interface CalendlyWebhookBody {
  event?: string;
  payload?: CalendlyPayload;
}

/**
 * Match a Calendly custom question by fuzzy substring — organizers phrase
 * answers to differently-worded questions, and a real answer shouldn't be
 * dropped over a wording mismatch.
 */
function answerFor(qanda: CalendlyQuestion[], matchers: string[]): string | null {
  const hit = qanda.find((qa) => {
    const q = (qa.question ?? '').toLowerCase();
    return matchers.some((m) => q.includes(m));
  });
  return hit ? (hit.answer ?? '').trim() : null;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const signingKey = process.env.CALENDLY_WEBHOOK_SIGNING_KEY;
  if (!signingKey) {
    return NextResponse.json(
      { message: 'Calendly webhook is not configured yet (missing CALENDLY_WEBHOOK_SIGNING_KEY).' },
      { status: 501 },
    );
  }

  // The raw, unparsed body is required — the signature is computed over these
  // exact bytes, and re-serializing a parsed body can differ byte-for-byte.
  const rawBody = await request.text();
  const signature = request.headers.get('calendly-webhook-signature');
  if (!verifyCalendlySignature(rawBody, signature, signingKey)) {
    return NextResponse.json({ message: 'Invalid webhook signature.' }, { status: 401 });
  }

  let body: CalendlyWebhookBody;
  try {
    body = JSON.parse(rawBody) as CalendlyWebhookBody;
  } catch {
    return NextResponse.json({ message: 'Invalid JSON.' }, { status: 400 });
  }

  if (body.event !== 'invitee.created') {
    return NextResponse.json({ ok: true, ignored: body.event ?? null });
  }

  const payload = body.payload ?? {};
  const qanda = payload.questions_and_answers ?? [];
  const orgName = answerFor(qanda, ['organization', 'company', 'business']);
  const website = answerFor(qanda, ['website']);
  const showsPerYearRaw = answerFor(qanda, [
    'how many shows',
    'shows per year',
    'shows do you manage',
  ]);
  const showsPerYear = showsPerYearRaw !== null ? Number.parseInt(showsPerYearRaw, 10) : null;

  await upsertLeadFromCalendly({
    orgName: orgName ?? payload.name ?? 'Unknown organization',
    contactName: payload.name ?? null,
    email: payload.email ?? null,
    website: website,
    showsPerYear: showsPerYear !== null && Number.isFinite(showsPerYear) ? showsPerYear : null,
    calendlyEventUri: payload.event ?? payload.uri ?? null,
    demoAt: payload.scheduled_event?.start_time ?? null,
  });

  return NextResponse.json({ ok: true });
}
