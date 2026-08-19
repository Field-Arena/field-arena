'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/shared/lib/supabase/server';
import { createAdminClient } from '@/shared/lib/supabase/admin';
import { getStripeClient } from '@/shared/lib/stripe';
import { env } from '@/shared/lib/env';
import { ROUTES } from '@/shared/constants/routes';
import { run, UserFacingError, type ActionResult } from '@/shared/lib/action-result';
import type { Database, Json } from '@/shared/types/database.types';
import { HORSE_DOCUMENTS_BUCKET } from '@/modules/riders/constants';
import {
  buildStripeLineItems,
  createOrderStripeCustomer,
  finalizeOrder,
  itemsToJson,
  priceCart,
  saveOffSessionCard,
} from '@/modules/riders/data/checkout';
import {
  confirmCheckoutSessionSchema,
  createCheckoutSessionSchema,
  horseCreateSchema,
  horseDeleteSchema,
  horseDocumentDeleteSchema,
  horseDocumentUploadFieldsSchema,
  horseUpdateSchema,
  riderProfileUpdateSchema,
  riderResendCodeSchema,
  riderSignUpSchema,
  riderVerifySchema,
  stablingSaveSchema,
  waiverSignSchema,
} from '@/modules/riders/schemas';
import type {
  CheckoutSessionResult,
  FinalizeOrderResult,
  HorseDocumentUpload,
  HorseRow,
  OrderLineItem,
  OrderRow,
  RiderResendOutcome,
  RiderRow,
  RiderSignUpOutcome,
  RiderVerifyOutcome,
  WaiverSignatureRow,
} from '@/modules/riders/types';

type ServerClient = Awaited<ReturnType<typeof createServerClient>>;

/**
 * Same "a stalled mail send throws a bare, message-less fetch failure" problem
 * auth module's withMailTransport documents — Supabase's shared testing SMTP
 * sender is slow enough that this is a real, not hypothetical, failure mode.
 */
const MAIL_UNREACHABLE = 'We could not reach the email service just now. Wait a moment and try again.';

async function withMailTransport<T>(
  run: () => Promise<T>
): Promise<{ ok: true; value: T } | { ok: false; message: string }> {
  try {
    return { ok: true, value: await run() };
  } catch (cause) {
    console.error('[riders] auth transport failure', cause);
    return { ok: false, message: MAIL_UNREACHABLE };
  }
}

/**
 * Self-provisions the `riders` row for an authenticated auth.users account
 * that doesn't have one yet — the same "first authenticated request creates
 * the row" behaviour as legacy's getSessionRider (api/_lib/riderAuth.js),
 * ported to Supabase Auth.
 *
 * Runs on the caller's own request-scoped client, not the service-role admin
 * client: `riders_insert_self` RLS (20260727120900_rls.sql) already lets a
 * signed-in user insert their own row (`id = auth.uid()`), so no elevated
 * privilege is needed or wanted for this write.
 *
 * Select-then-insert rather than upsert: an upsert would silently overwrite
 * an already-provisioned row's fields on a second call. In practice this only
 * runs once per account (right after signUp or verifyOtp establishes the
 * first session), but the guard costs nothing and matches legacy's own
 * "only insert if nothing matched" shape.
 */
async function ensureRiderProfile(
  supabase: ServerClient,
  user: { id: string; email?: string | null }
): Promise<void> {
  const { data: existing, error: selectError } = await supabase
    .from('riders')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();
  if (selectError) throw selectError;
  if (existing) return;

  const { error: insertError } = await supabase.from('riders').insert({
    id: user.id,
    email: (user.email ?? '').toLowerCase(),
  });
  if (insertError) throw insertError;
}

/**
 * Creates the auth.users account for a self-service rider sign-up and, once a
 * session exists, immediately provisions the matching `riders` row.
 *
 * Deliberately NOT routed through auth module's signUpWithPassword. That
 * function's landAfterSignup/provisionedDestination enforce Field & Arena's
 * invite-only rule for staff: an account with no pre-existing users/riders
 * row is signed back out with "ask your organizer to invite you." Riders are
 * the carved-out exception — legacy's rider.html let a stranger land on a
 * show's ticket page with no account, pick classes, and self-provision during
 * checkout (see api/_lib/riderAuth.js's getSessionRider), and that is the
 * model riders keep here: this function never checks for an existing invite
 * and never signs the new account back out.
 */
export async function signUpRider(input: unknown): Promise<RiderSignUpOutcome> {
  const { email, password } = riderSignUpSchema.parse(input);

  const supabase = await createServerClient();
  const attempt = await withMailTransport(() =>
    supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${env.siteUrl}${ROUTES.authCallback}?next=${ROUTES.rider}` },
    })
  );
  if (!attempt.ok) return { status: 'error', message: attempt.message };

  const { data, error } = attempt.value;
  if (error) return { status: 'error', message: error.message };

  // Same "empty identities array" signal auth module's signUpWithPassword
  // relies on — Supabase does not otherwise say an address is already
  // registered, to keep this from being an account-enumeration oracle.
  if (data.user && data.user.identities?.length === 0) {
    return { status: 'exists' };
  }

  if (!data.session || !data.user) {
    return { status: 'verify', email };
  }

  // Confirmation is off for this project — the account is live immediately.
  await ensureRiderProfile(supabase, data.user);
  revalidatePath('/', 'layout');
  return { status: 'done', redirectTo: ROUTES.rider };
}

/** Exchanges the emailed 6-digit code for a session, then provisions the rider row. */
export async function verifyRiderSignUpCode(input: unknown): Promise<RiderVerifyOutcome> {
  const { email, token } = riderVerifySchema.parse(input);

  const supabase = await createServerClient();
  const attempt = await withMailTransport(() => supabase.auth.verifyOtp({ email, token, type: 'email' }));
  if (!attempt.ok) return { status: 'error', message: attempt.message };

  const { data, error } = attempt.value;
  if (error || !data.user) {
    return { status: 'error', message: 'That code did not check out. Send a new one and retry.' };
  }

  await ensureRiderProfile(supabase, data.user);
  revalidatePath('/', 'layout');
  return { status: 'done', redirectTo: ROUTES.rider };
}

/** Sends a fresh six-digit code to a rider signup that hasn't confirmed yet. */
export async function resendRiderSignUpCode(input: unknown): Promise<RiderResendOutcome> {
  const { email } = riderResendCodeSchema.parse(input);

  const supabase = await createServerClient();
  const attempt = await withMailTransport(() => supabase.auth.resend({ type: 'signup', email }));
  if (!attempt.ok) return { status: 'error', message: attempt.message };

  const { error } = attempt.value;
  if (error) return { status: 'error', message: error.message };
  return { status: 'sent' };
}

/** Signs the current rider out. Identity-agnostic — `auth.signOut()` alone, no role logic. */
export async function signOutRider(): Promise<void> {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
}

// ---------------------------------------------------------------------------
// Phase B — profile, horses, waiver
//
// Unlike the sign-up flow above, these follow .claude/rules/layers.md's plain
// convention: parse, call Supabase on the caller's own RLS-scoped client,
// throw on error. No outcome-object indirection — a failed profile edit or
// horse add is a single, unambiguous failure, not a multi-branch flow like
// sign-up's verify/exists/error split.
// ---------------------------------------------------------------------------

/** Shared guard: every mutation below requires a signed-in rider. */
async function requireCurrentRider(
  supabase: ServerClient
): Promise<{ id: string; email: string | null }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in.');
  return { id: user.id, email: user.email ?? null };
}

/**
 * Same guard as requireCurrentRider, but resolves the full `riders` row —
 * checkout needs firstName/lastName/category, not just id/email. Reads
 * through the caller's own RLS-scoped client (riders_select_self), so this
 * still only ever returns the signed-in rider's own row; the checkout
 * functions below switch to the service-role client only afterward, for the
 * cross-rider reads/writes that RLS genuinely cannot express (see
 * data/checkout.ts's own file-header comment).
 */
async function requireCurrentRiderProfile(supabase: ServerClient): Promise<RiderRow> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in.');
  const { data: rider, error } = await supabase.from('riders').select('*').eq('id', user.id).maybeSingle();
  if (error) throw error;
  if (!rider) throw new Error('Not signed in.');
  return rider;
}

/**
 * Updates the signed-in rider's own profile fields.
 *
 * Mirrors legacy's handleMe PATCH (api/rider/[resource].js) field-for-field —
 * `firstName`/`lastName` are deliberately absent from riderProfileUpdateSchema
 * (and so can never appear here), matching that handler's own comment: name is
 * a fixed "who you are" fact once set, never re-editable through this path.
 */
export async function updateRiderProfile(input: unknown): Promise<RiderRow> {
  const parsed = riderProfileUpdateSchema.parse(input);
  const supabase = await createServerClient();
  const rider = await requireCurrentRider(supabase);

  const updates: Database['public']['Tables']['riders']['Update'] = {};
  if (parsed.phone !== undefined) updates.phone = parsed.phone;
  if (parsed.street !== undefined) updates.street = parsed.street;
  if (parsed.city !== undefined) updates.city = parsed.city;
  if (parsed.state !== undefined) updates.state = parsed.state;
  if (parsed.zip !== undefined) updates.zip = parsed.zip;
  if (parsed.usef !== undefined) updates.usef = parsed.usef;
  if (parsed.fei !== undefined) updates.fei = parsed.fei;
  if (parsed.category !== undefined) updates.category = parsed.category;
  if (parsed.dob !== undefined) updates.dob = parsed.dob;
  if (parsed.ecFirstName !== undefined) updates.ec_first_name = parsed.ecFirstName;
  if (parsed.ecLastName !== undefined) updates.ec_last_name = parsed.ecLastName;
  if (parsed.ecRel !== undefined) updates.ec_rel = parsed.ecRel;
  if (parsed.ecPhone !== undefined) updates.ec_phone = parsed.ecPhone;

  const { data, error } = await supabase
    .from('riders')
    .update(updates)
    .eq('id', rider.id)
    .select()
    .single();
  if (error) throw error;

  revalidatePath(ROUTES.rider);
  return data;
}

/** Adds a horse to the signed-in rider's account. Name is permanent from here on. */
export async function createHorse(input: unknown): Promise<HorseRow> {
  const parsed = horseCreateSchema.parse(input);
  const supabase = await createServerClient();
  const rider = await requireCurrentRider(supabase);

  const { data, error } = await supabase
    .from('horses')
    .insert({ rider_id: rider.id, name: parsed.name })
    .select()
    .single();
  if (error) throw error;

  revalidatePath(ROUTES.rider);
  return data;
}

/**
 * Updates a horse's non-identity fields. `id` must belong to the caller —
 * checked explicitly for a clear "Not your horse" message rather than relying
 * on `horses_owner_all` RLS to silently match zero rows, matching legacy's own
 * explicit ownership check in handleHorses PATCH.
 */
export async function updateHorse(input: unknown): Promise<HorseRow> {
  const parsed = horseUpdateSchema.parse(input);
  const supabase = await createServerClient();
  const rider = await requireCurrentRider(supabase);

  const { data: existing, error: readError } = await supabase
    .from('horses')
    .select('rider_id')
    .eq('id', parsed.id)
    .maybeSingle();
  if (readError) throw readError;
  if (!existing) throw new Error('Horse not found.');
  if (existing.rider_id !== rider.id) throw new Error('Not your horse.');

  const updates: Database['public']['Tables']['horses']['Update'] = {};
  if (parsed.stable !== undefined) updates.stable = parsed.stable;
  if (parsed.trainer !== undefined) updates.trainer = parsed.trainer;
  if (parsed.trainerPhone !== undefined) updates.trainer_phone = parsed.trainerPhone;
  if (parsed.isStallion !== undefined) updates.is_stallion = parsed.isStallion;
  if (Object.keys(updates).length === 0) throw new Error('No valid fields to update.');

  const { data, error } = await supabase
    .from('horses')
    .update(updates)
    .eq('id', parsed.id)
    .select()
    .single();
  if (error) throw error;

  revalidatePath(ROUTES.rider);
  return data;
}

/**
 * Removes a horse from the signed-in rider's account.
 *
 * Blocked once the horse is tied to a real class_entries row — same rule and
 * message as legacy's handleHorses DELETE: "accidentally added" only ever
 * applies before checkout, so this is the one case worth blocking rather than
 * silently orphaning class_entries.horse_id.
 */
export async function deleteHorse(input: unknown): Promise<{ ok: true }> {
  const parsed = horseDeleteSchema.parse(input);
  const supabase = await createServerClient();
  const rider = await requireCurrentRider(supabase);

  const { data: existing, error: readError } = await supabase
    .from('horses')
    .select('rider_id, document_uploads')
    .eq('id', parsed.id)
    .maybeSingle();
  if (readError) throw readError;
  if (!existing) throw new Error('Horse not found.');
  if (existing.rider_id !== rider.id) throw new Error('Not your horse.');

  const { data: entryRows, error: entryError } = await supabase
    .from('class_entries')
    .select('id')
    .eq('horse_id', parsed.id)
    .limit(1);
  if (entryError) throw entryError;
  if (entryRows.length > 0) {
    throw new Error(
      "This horse is already entered in a class and can't be removed. Contact the show for changes."
    );
  }

  const { error } = await supabase.from('horses').delete().eq('id', parsed.id);
  if (error) throw error;

  // Best-effort: an orphaned storage object is a cleanup nuisance, not a
  // reason to fail a delete that has already succeeded in the database.
  const uploads = (existing.document_uploads ?? []) as unknown as HorseDocumentUpload[];
  const paths = uploads.map((u) => u.path).filter((path): path is string => Boolean(path));
  if (paths.length) {
    await supabase.storage.from(HORSE_DOCUMENTS_BUCKET).remove(paths);
  }

  revalidatePath(ROUTES.rider);
  return { ok: true };
}

/**
 * Uploads one document against one of the show's document_requirements for a
 * horse. Takes FormData (not a parsed object) because it carries a real File —
 * Server Actions accept FormData directly, which is why this doesn't need
 * legacy's base64-over-JSON workaround (that existed only because Vercel
 * serverless functions needed a JSON body).
 *
 * Stored at a STABLE path (`{riderId}/{horseId}/{requirementId}`) with
 * `upsert: true`, unlike legacy's random-UUID-per-upload key (handleHorseDocument
 * in api/rider/[resource].js), which left the superseded file behind in
 * storage on every re-upload. A stable path replaces in place, so there is no
 * orphaned-object bookkeeping to get right.
 */
export async function uploadHorseDocument(formData: FormData): Promise<HorseRow> {
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    throw new Error('File data is required.');
  }

  const expirationDateRaw = formData.get('expirationDate');
  const parsed = horseDocumentUploadFieldsSchema.parse({
    horseId: formData.get('horseId'),
    requirementId: formData.get('requirementId'),
    label: formData.get('label'),
    expirationDate:
      typeof expirationDateRaw === 'string' && expirationDateRaw.length > 0
        ? expirationDateRaw
        : undefined,
  });

  const supabase = await createServerClient();
  const rider = await requireCurrentRider(supabase);

  const { data: existing, error: readError } = await supabase
    .from('horses')
    .select('rider_id, document_uploads')
    .eq('id', parsed.horseId)
    .maybeSingle();
  if (readError) throw readError;
  if (!existing) throw new Error('Horse not found.');
  if (existing.rider_id !== rider.id) throw new Error('Not your horse.');

  const path = `${rider.id}/${parsed.horseId}/${parsed.requirementId}`;
  const { error: uploadError } = await supabase.storage
    .from(HORSE_DOCUMENTS_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type || 'application/octet-stream' });
  if (uploadError) throw uploadError;

  const uploads = (existing.document_uploads ?? []) as unknown as HorseDocumentUpload[];
  const nextUploads: HorseDocumentUpload[] = [
    ...uploads.filter((u) => u.requirementId !== parsed.requirementId),
    {
      requirementId: parsed.requirementId,
      label: parsed.label,
      path,
      expirationDate: parsed.expirationDate ?? null,
      verified: false,
    },
  ];

  const { data, error } = await supabase
    .from('horses')
    .update({ document_uploads: nextUploads as unknown as Json })
    .eq('id', parsed.horseId)
    .select()
    .single();
  if (error) throw error;

  revalidatePath(ROUTES.rider);
  return data;
}

/**
 * Clears one uploaded document without requiring an immediate replacement —
 * same as legacy's handleHorseDocument DELETE.
 */
export async function deleteHorseDocument(input: unknown): Promise<HorseRow> {
  const parsed = horseDocumentDeleteSchema.parse(input);
  const supabase = await createServerClient();
  const rider = await requireCurrentRider(supabase);

  const { data: existing, error: readError } = await supabase
    .from('horses')
    .select('rider_id, document_uploads')
    .eq('id', parsed.horseId)
    .maybeSingle();
  if (readError) throw readError;
  if (!existing) throw new Error('Horse not found.');
  if (existing.rider_id !== rider.id) throw new Error('Not your horse.');

  const uploads = (existing.document_uploads ?? []) as unknown as HorseDocumentUpload[];
  const removed = uploads.find((u) => u.requirementId === parsed.requirementId);
  const nextUploads = uploads.filter((u) => u.requirementId !== parsed.requirementId);

  const { data, error } = await supabase
    .from('horses')
    .update({ document_uploads: nextUploads as unknown as Json })
    .eq('id', parsed.horseId)
    .select()
    .single();
  if (error) throw error;

  if (removed?.path) {
    // Best-effort, same reasoning as deleteHorse above.
    await supabase.storage.from(HORSE_DOCUMENTS_BUCKET).remove([removed.path]);
  }

  revalidatePath(ROUTES.rider);
  return data;
}

/**
 * Signs a show's waiver of liability. Idempotent — POSTing again for a show
 * the rider already signed returns the existing signature rather than
 * erroring or creating a second row, matching legacy's handleWaiver POST and
 * the `unique (rider_id, show_id)` constraint it relies on
 * (20260727120600_rider_domain.sql).
 */
export async function signWaiver(input: unknown): Promise<WaiverSignatureRow> {
  const parsed = waiverSignSchema.parse(input);
  const supabase = await createServerClient();
  const rider = await requireCurrentRider(supabase);

  const { data: existing, error: readError } = await supabase
    .from('waiver_signatures')
    .select('*')
    .eq('rider_id', rider.id)
    .eq('show_id', parsed.showId)
    .maybeSingle();
  if (readError) throw readError;
  if (existing) return existing;

  const { data, error } = await supabase
    .from('waiver_signatures')
    .insert({
      rider_id: rider.id,
      show_id: parsed.showId,
      full_name: parsed.fullName,
      signature_date: parsed.signatureDate,
    })
    .select()
    .single();
  if (error) {
    // Two concurrent submits can both pass the read-then-insert check above;
    // the `unique (rider_id, show_id)` constraint rejects the loser rather than
    // creating a second row. Treat that as the same idempotent success as the
    // `existing` early-return, not as a failure — the waiver is signed either way.
    if (error.code === '23505') {
      const { data: raced, error: racedError } = await supabase
        .from('waiver_signatures')
        .select('*')
        .eq('rider_id', rider.id)
        .eq('show_id', parsed.showId)
        .single();
      if (racedError) throw racedError;
      return raced;
    }
    throw error;
  }

  revalidatePath(`/rider/shows/${parsed.showId}`);
  return data;
}

// ---------------------------------------------------------------------------
// Phase C — checkout
//
// Both actions below resolve the caller's identity through their own
// RLS-scoped client FIRST (requireCurrentRiderProfile), then do every
// subsequent read/write through the service-role admin client via
// data/checkout.ts. That split matters: the identity check is the one thing
// that must never be spoofable, and it stays on the client that only ever
// sees what RLS says the real signed-in caller may see. Everything after
// that (pricing, Stripe calls, order/class_entries writes) needs the
// admin client because RLS has no policy letting a rider write class_entries
// or read another rider's orders — see checkout.ts's own header comment.
// ---------------------------------------------------------------------------

/**
 * Prices the cart, creates the `orders` row (status 'pending'), and creates a
 * real Stripe Checkout Session for it. Returns the hosted page's `url` for
 * the client to redirect to (`window.location.href = url`) — mirrors
 * legacy's handleCheckoutSessionCreate, choosing the same hosted-Checkout
 * approach over hand-built Elements so wallets/BNPL/card are whatever the
 * org's own Stripe Dashboard has enabled, never hardcoded here.
 *
 * Wrapped in `run()` (shared/lib/action-result.ts) rather than throwing
 * directly: priceCart's validation failures — empty cart, unsigned waiver,
 * closed ticket window — are exactly the kind of thing a rider needs to read
 * and act on, but Next.js redacts a Server Action's thrown error message in
 * production. `run()` catches them, and `describeError` reads their
 * `UserFacingError` message back out for the client; `unwrap()` on the
 * calling hook turns the returned failure back into a thrown Error in the
 * browser, where nothing redacts it.
 */
export async function createCheckoutSession(
  input: unknown
): Promise<ActionResult<CheckoutSessionResult>> {
  return run('Could not start checkout', async () => {
    const parsed = createCheckoutSessionSchema.parse(input);
    const supabase = await createServerClient();
    const rider = await requireCurrentRiderProfile(supabase);

    const admin = createAdminClient();
    const priced = await priceCart(admin, rider.id, parsed.showId, parsed.cart, parsed.addOns);

    const { data: order, error: orderError } = await admin
      .from('orders')
      .insert({
        rider_id: rider.id,
        show_id: parsed.showId,
        amount_total: priced.total,
        status: 'pending',
        items: itemsToJson(priced.items),
        fee_total: priced.feeTotal,
      })
      .select()
      .single();
    if (orderError) throw orderError;

    const stripeCustomerId = await createOrderStripeCustomer(rider);
    const stripe = getStripeClient();
    const returnPath = `/rider/shows/${parsed.showId}`;

    const paymentIntentData: NonNullable<
      import('stripe').Stripe.Checkout.SessionCreateParams['payment_intent_data']
    > = { setup_future_usage: 'off_session' };
    // Decision mirrored from legacy: unfinished organizer Connect onboarding
    // never blocks a show from going on sale — money just sits in the
    // platform's own Stripe balance (plain charge, no transfer_data) until
    // onboarding finishes.
    if (priced.chargesEnabled && priced.stripeConnectAccountId) {
      paymentIntentData.application_fee_amount = Math.round(priced.feeTotal * 100);
      paymentIntentData.transfer_data = { destination: priced.stripeConnectAccountId };
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer: stripeCustomerId,
      line_items: buildStripeLineItems(priced.items, priced.currency),
      success_url: `${env.siteUrl}${returnPath}?order=${order.id}&checkoutSession={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.siteUrl}${returnPath}?checkoutCanceled=1`,
      metadata: { showId: parsed.showId, riderId: rider.id, orderId: order.id },
      payment_intent_data: paymentIntentData,
    });

    const paymentIntentId =
      typeof session.payment_intent === 'string' ? session.payment_intent : (session.payment_intent?.id ?? null);
    await admin.from('orders').update({ stripe_payment_intent_id: paymentIntentId }).eq('id', order.id);

    if (!session.url) throw new UserFacingError('Stripe did not return a checkout URL. Please try again.');

    return {
      orderId: order.id,
      sessionId: session.id,
      url: session.url,
      total: priced.total,
      items: priced.items,
      feeTotal: priced.feeTotal,
    };
  });
}

/**
 * The return-from-Stripe path: verifies the Checkout Session actually paid,
 * then calls the same finalizeOrder the webhook calls. Mirrors legacy's
 * handleCheckoutSessionConfirm — this is the in-page half of "two ways to
 * reach fulfillment," the webhook (app/api/webhooks/stripe/route.ts) being
 * the other, for whichever one the rider's browser actually completes (the
 * webhook fires even if this call never runs — a closed tab, a network drop
 * on the way back).
 *
 * No revalidatePath here (there was one — it crashed every real checkout,
 * confirmed live: "used revalidatePath ... during render," Next.js's own
 * hard error for calling it mid-render). This function's only call site is
 * RiderShowPage awaiting it directly during its own render
 * (app/rider/shows/[showId]/page.tsx) — never from a client-triggered Server
 * Action — so revalidatePath is both illegal there and unnecessary: the page
 * already renders the fresh `result` this function returns via
 * `CheckoutConfirmation`, and any later visit re-runs this Server Component
 * from scratch against Supabase, which isn't behind Next's fetch cache here.
 */
export async function confirmCheckoutSession(input: unknown): Promise<FinalizeOrderResult> {
  const parsed = confirmCheckoutSessionSchema.parse(input);
  const supabase = await createServerClient();
  const rider = await requireCurrentRiderProfile(supabase);

  const admin = createAdminClient();
  const { data: order, error: orderError } = await admin
    .from('orders')
    .select('*')
    .eq('id', parsed.orderId)
    .maybeSingle();
  if (orderError) throw orderError;
  if (!order) throw new Error('Order not found.');
  if (order.rider_id !== rider.id) throw new Error('Not your order.');

  if (order.status === 'paid') {
    const { data: entries, error: entriesError } = await admin
      .from('class_entries')
      .select('*')
      .eq('order_id', order.id);
    if (entriesError) throw entriesError;
    return {
      ok: true,
      alreadyFulfilled: true,
      entries,
      riderNumber: entries[0]?.num ?? null,
      orderId: order.id,
      total: order.amount_total,
      items: (order.items ?? []) as unknown as OrderLineItem[],
    };
  }

  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.retrieve(parsed.sessionId).catch(() => null);
  if (!session) throw new Error('That Checkout Session could not be found.');
  if (session.metadata?.orderId !== order.id) {
    throw new Error('This Checkout Session does not match this order.');
  }
  if (session.payment_status !== 'paid') {
    throw new Error('Payment has not completed yet.');
  }
  if (session.amount_total !== Math.round(order.amount_total * 100)) {
    throw new Error('Payment amount does not match this order.');
  }

  if (session.payment_intent) {
    const piId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent.id;
    const paymentIntent = await stripe.paymentIntents.retrieve(piId).catch(() => null);
    if (paymentIntent) await saveOffSessionCard(admin, order.id, paymentIntent);
  }

  return finalizeOrder(admin, order, rider);
}

// ---------------------------------------------------------------------------
// Phase D — Purchases tab: stabling dates.
// ---------------------------------------------------------------------------

/**
 * Saves the rider's arrival/departure dates against one of their own paid
 * orders. Mirrors legacy's handleStabling (api/rider/[resource].js) —
 * including its one real gate, "orders isn't paid yet": stabling logistics
 * only make sense once a spot is actually secured, so an order still pending
 * payment is rejected rather than quietly recording dates for a purchase that
 * might never complete.
 *
 * Same identity-then-admin split as createCheckoutSession/confirmCheckoutSession
 * above: `orders` RLS (20260727120900_rls.sql) defines only SELECT policies
 * (`orders_select_owner`/`orders_select_money_staff`) — there is no
 * UPDATE policy for a rider at all, by design (writes to `orders` are meant
 * to come from server-side checkout/webhook code, not directly from a rider's
 * own client). Ownership is still verified on the caller's own RLS-scoped
 * client first — the switch to admin happens only after that check passes.
 */
export async function saveStablingDates(input: unknown): Promise<OrderRow> {
  const parsed = stablingSaveSchema.parse(input);
  const supabase = await createServerClient();
  const rider = await requireCurrentRider(supabase);

  const admin = createAdminClient();
  const { data: existing, error: readError } = await admin
    .from('orders')
    .select('rider_id, status')
    .eq('id', parsed.orderId)
    .maybeSingle();
  if (readError) throw readError;
  if (!existing) throw new Error('Order not found.');
  if (existing.rider_id !== rider.id) throw new Error('Not your order.');
  if (existing.status !== 'paid') throw new Error("This order isn't paid yet.");

  const { data, error } = await admin
    .from('orders')
    .update({ arrival_date: parsed.arrivalDate, departure_date: parsed.departureDate })
    .eq('id', parsed.orderId)
    .select()
    .single();
  if (error) throw error;

  revalidatePath(ROUTES.rider);
  return data;
}
