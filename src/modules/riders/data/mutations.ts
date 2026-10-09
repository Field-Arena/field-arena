'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/shared/lib/supabase/server';
import { createAdminClient } from '@/shared/lib/supabase/admin';
import { getStripeClient, SAVE_FOR_CHARGE_MORE } from '@/shared/lib/stripe';
import { env } from '@/shared/lib/env';
import { ROUTES } from '@/shared/constants/routes';
import { run, parseInput, UserFacingError, type ActionResult } from '@/shared/lib/action-result';
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
import { generateSignedDocumentPdf } from '@/modules/riders/data/signed-document-pdf';
import { parseDocumentRequirements } from '@/modules/riders/utils/parse-document-requirements';
import {
  isSignableRequirement,
  signableRequirementText,
} from '@/modules/riders/utils/is-signable-requirement';
import { todayInTimeZone } from '@/modules/riders/utils/today-in-time-zone';
import {
  confirmCheckoutSessionSchema,
  createCheckoutSessionSchema,
  horseCreateSchema,
  horseDeleteSchema,
  horseDocumentDeleteSchema,
  horseDocumentUploadFieldsSchema,
  horseUpdateSchema,
  requiredDocumentSignSchema,
  riderProfileUpdateSchema,
  riderResendCodeSchema,
  riderSignInSchema,
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
  RiderSignInOutcome,
  RiderSignUpOutcome,
  RiderVerifyOutcome,
  WaiverSignatureRow,
} from '@/modules/riders/types';

type ServerClient = Awaited<ReturnType<typeof createServerClient>>;

const MAIL_UNREACHABLE =
  'We could not reach the email service just now. Wait a moment and try again.';

async function withMailTransport<T>(
  run: () => Promise<T>,
): Promise<{ ok: true; value: T } | { ok: false; message: string }> {
  try {
    return { ok: true, value: await run() };
  } catch (cause) {
    console.error('[riders] auth transport failure', cause);
    return { ok: false, message: MAIL_UNREACHABLE };
  }
}

async function ensureRiderProfile(
  supabase: ServerClient,
  user: { id: string; email?: string | null },
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

/** A rider who started at a specific show's ticket page (e.g. an organizer's
 * shared link, or the public directory) and had to sign up/verify first
 * should land back on that show afterward, not on the generic /rider portal
 * — otherwise they lose the class selection they were about to make and have
 * to find their way back manually. Only ever trusts an internal path. */
function safeRiderReturnTo(value?: string | null): string {
  if (!value) return ROUTES.rider;
  if (!value.startsWith('/') || value.startsWith('//')) return ROUTES.rider;
  return value;
}

export async function signUpRider(input: unknown, returnTo?: string): Promise<RiderSignUpOutcome> {
  const { email, password } = parseInput(riderSignUpSchema, input);
  const target = safeRiderReturnTo(returnTo);

  const supabase = await createServerClient();
  const attempt = await withMailTransport(() =>
    supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${env.siteUrl}${ROUTES.authCallback}?next=${encodeURIComponent(target)}`,
      },
    }),
  );
  if (!attempt.ok) return { status: 'error', message: attempt.message };

  const { data, error } = attempt.value;
  if (error) return { status: 'error', message: error.message };

  if (data.user && data.user.identities?.length === 0) {
    return { status: 'exists' };
  }

  if (!data.session || !data.user) {
    return { status: 'verify', email };
  }

  await ensureRiderProfile(supabase, data.user);
  revalidatePath('/', 'layout');
  return { status: 'done', redirectTo: target };
}

export async function verifyRiderSignUpCode(
  input: unknown,
  returnTo?: string,
): Promise<RiderVerifyOutcome> {
  const { email, token } = parseInput(riderVerifySchema, input);

  const supabase = await createServerClient();
  const attempt = await withMailTransport(() =>
    supabase.auth.verifyOtp({ email, token, type: 'email' }),
  );
  if (!attempt.ok) return { status: 'error', message: attempt.message };

  const { data, error } = attempt.value;
  if (error || !data.user) {
    return { status: 'error', message: 'That code did not check out. Send a new one and retry.' };
  }

  await ensureRiderProfile(supabase, data.user);
  revalidatePath('/', 'layout');
  return { status: 'done', redirectTo: safeRiderReturnTo(returnTo) };
}

export async function resendRiderSignUpCode(input: unknown): Promise<RiderResendOutcome> {
  const { email } = parseInput(riderResendCodeSchema, input);

  const supabase = await createServerClient();
  const attempt = await withMailTransport(() => supabase.auth.resend({ type: 'signup', email }));
  if (!attempt.ok) return { status: 'error', message: attempt.message };

  const { error } = attempt.value;
  if (error) return { status: 'error', message: error.message };
  return { status: 'sent' };
}

/** Sign-in for a rider who already has an account, started from the rider
 * portal or a show's entry page. Lands them back on `returnTo` (the show they
 * were entering) instead of the generic portal home. An account whose email
 * was never confirmed gets a fresh code and goes to the verify step. */
export async function signInRider(input: unknown, returnTo?: string): Promise<RiderSignInOutcome> {
  const { email, password } = parseInput(riderSignInSchema, input);
  const target = safeRiderReturnTo(returnTo);

  const supabase = await createServerClient();
  const attempt = await withMailTransport(() =>
    supabase.auth.signInWithPassword({ email, password }),
  );
  if (!attempt.ok) return { status: 'error', message: attempt.message };

  const { data, error } = attempt.value;
  if (error) {
    if (/not confirmed/i.test(error.message)) {
      const resent = await withMailTransport(() =>
        supabase.auth.resend({
          type: 'signup',
          email,
          options: {
            emailRedirectTo: `${env.siteUrl}${ROUTES.authCallback}?next=${encodeURIComponent(target)}`,
          },
        }),
      );
      if (resent.ok && !resent.value.error) return { status: 'verify', email };
      return {
        status: 'error',
        message: 'Your email is not confirmed yet. Use the code from your sign-up email.',
      };
    }
    if (/invalid login credentials/i.test(error.message)) {
      return {
        status: 'error',
        message: 'That email and password do not match. Check them and try again.',
      };
    }
    return { status: 'error', message: error.message };
  }

  const { data: staff, error: staffError } = await supabase
    .from('users')
    .select('id')
    .eq('id', data.user.id)
    .maybeSingle();
  if (staffError) throw staffError;
  if (staff) {
    // Staff and rider identities are kept apart (staff-XOR-rider trigger), so
    // a staff login can't enter classes — say so instead of half-signing in.
    await supabase.auth.signOut();
    return {
      status: 'error',
      message:
        'This email belongs to a show staff account, which cannot enter classes. Create a rider account with a different email.',
    };
  }

  await ensureRiderProfile(supabase, data.user);
  revalidatePath('/', 'layout');
  return { status: 'done', redirectTo: target };
}

export async function signOutRider(): Promise<void> {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
}

async function requireCurrentRider(
  supabase: ServerClient,
): Promise<{ id: string; email: string | null }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in.');
  return { id: user.id, email: user.email ?? null };
}

async function requireCurrentRiderProfile(supabase: ServerClient): Promise<RiderRow> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in.');
  const { data: rider, error } = await supabase
    .from('riders')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();
  if (error) throw error;
  if (!rider) throw new Error('Not signed in.');
  return rider;
}

export async function updateRiderProfile(input: unknown): Promise<RiderRow> {
  const parsed = parseInput(riderProfileUpdateSchema, input);
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

export async function createHorse(input: unknown): Promise<HorseRow> {
  const parsed = parseInput(horseCreateSchema, input);
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

export async function updateHorse(input: unknown): Promise<HorseRow> {
  const parsed = parseInput(horseUpdateSchema, input);
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
  if (parsed.height !== undefined) updates.height = parsed.height;
  if (parsed.farrier !== undefined) updates.farrier = parsed.farrier;
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

export async function deleteHorse(input: unknown): Promise<{ ok: true }> {
  const parsed = parseInput(horseDeleteSchema, input);
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
      "This horse is already entered in a class and can't be removed. Contact the show for changes.",
    );
  }

  const { error } = await supabase.from('horses').delete().eq('id', parsed.id);
  if (error) throw error;

  const uploads = (existing.document_uploads ?? []) as unknown as HorseDocumentUpload[];
  const paths = uploads.map((u) => u.path).filter((path): path is string => Boolean(path));
  if (paths.length) {
    await supabase.storage.from(HORSE_DOCUMENTS_BUCKET).remove(paths);
  }

  revalidatePath(ROUTES.rider);
  return { ok: true };
}

export async function uploadHorseDocument(formData: FormData): Promise<HorseRow> {
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    throw new Error('File data is required.');
  }

  const expirationDateRaw = formData.get('expirationDate');
  const parsed = parseInput(horseDocumentUploadFieldsSchema, {
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

export async function deleteHorseDocument(input: unknown): Promise<HorseRow> {
  const parsed = parseInput(horseDocumentDeleteSchema, input);
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
    await supabase.storage.from(HORSE_DOCUMENTS_BUCKET).remove([removed.path]);
  }

  revalidatePath(ROUTES.rider);
  return data;
}

export async function signWaiver(input: unknown): Promise<WaiverSignatureRow> {
  const parsed = parseInput(waiverSignSchema, input);
  const supabase = await createServerClient();
  const rider = await requireCurrentRider(supabase);

  /* The date on the signature is the server's "today" in the show's time
   * zone — never a date the rider typed, so it can't be back- or post-dated. */
  const { data: showRow, error: showError } = await supabase
    .from('shows')
    .select('timezone')
    .eq('id', parsed.showId)
    .maybeSingle();
  if (showError) throw showError;
  const signatureDate = todayInTimeZone(showRow?.timezone);

  /* Nothing else in the app ever collects a rider's own first/last name —
   * the waiver's typed signature is the first real name text a rider ever
   * provides. Backfill it onto their profile the first time they sign,
   * guarded by .is('first_name', null) so a name once set is never
   * overwritten by a later, possibly different, waiver signature. */
  const [firstName, ...rest] = parsed.fullName.trim().split(/\s+/);
  if (firstName) {
    const { error: nameError } = await supabase
      .from('riders')
      .update({ first_name: firstName, last_name: rest.join(' ') || null })
      .eq('id', rider.id)
      .is('first_name', null);
    if (nameError) throw nameError;
  }

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
      signature_date: signatureDate,
    })
    .select()
    .single();
  if (error) {
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

/** E-signs an organizer-required document that is an agreement (see
 * isSignableRequirement) instead of making the rider upload a signed copy.
 *
 * Required documents are tracked per horse (horses.document_uploads), so one
 * signature is filed on every horse on the rider's account that doesn't have
 * this requirement yet. Each gets a generated PDF record — the exact wording,
 * typed name and server timestamp — at the same storage path an upload would
 * use, so the organizer reviews and approves it exactly like an upload. No
 * schema change: document_uploads is jsonb and the extra keys are additive. */
export async function signRequiredDocument(input: unknown): Promise<{ signedHorseCount: number }> {
  const parsed = parseInput(requiredDocumentSignSchema, input);
  const supabase = await createServerClient();
  const rider = await requireCurrentRider(supabase);

  const { data: show, error: showError } = await supabase
    .from('shows')
    .select('id, name, timezone, document_requirements')
    .eq('id', parsed.showId)
    .maybeSingle();
  if (showError) throw showError;
  if (!show) throw new UserFacingError('Show not found.');

  const requirement = parseDocumentRequirements(show.document_requirements).find(
    (req) => req.id === parsed.requirementId,
  );
  if (!requirement || !isSignableRequirement(requirement)) {
    throw new UserFacingError('This document is uploaded, not signed on the site.');
  }

  const { data: horses, error: horsesError } = await supabase
    .from('horses')
    .select('id, name, document_uploads')
    .eq('rider_id', rider.id);
  if (horsesError) throw horsesError;
  if (horses.length === 0) {
    throw new UserFacingError('Add your horse first — the signed form is filed with its papers.');
  }

  const signedAt = new Date();
  const signedAtIso = signedAt.toISOString();
  const signedDate = todayInTimeZone(show.timezone, signedAt);
  const agreementText = signableRequirementText(requirement, show.name);

  let signedHorseCount = 0;
  for (const horse of horses) {
    const uploads = (horse.document_uploads ?? []) as unknown as HorseDocumentUpload[];
    if (uploads.some((u) => u.requirementId === requirement.id)) continue;

    const pdf = await generateSignedDocumentPdf({
      title: requirement.label,
      showName: show.name,
      agreementText,
      signedName: parsed.fullName,
      signedAtIso,
      signedDate,
      riderEmail: rider.email,
      horseName: horse.name,
    });
    const path = `${rider.id}/${horse.id}/${requirement.id}`;
    const { error: uploadError } = await supabase.storage
      .from(HORSE_DOCUMENTS_BUCKET)
      .upload(path, pdf, { upsert: true, contentType: 'application/pdf' });
    if (uploadError) throw uploadError;

    const nextUploads: HorseDocumentUpload[] = [
      ...uploads,
      {
        requirementId: requirement.id,
        label: requirement.label,
        path,
        expirationDate: null,
        verified: false,
        method: 'e-sign',
        signedName: parsed.fullName,
        signedAt: signedAtIso,
      },
    ];
    const { error } = await supabase
      .from('horses')
      .update({ document_uploads: nextUploads as unknown as Json })
      .eq('id', horse.id);
    if (error) throw error;
    signedHorseCount += 1;
  }

  revalidatePath(ROUTES.rider);
  return { signedHorseCount };
}

export async function createCheckoutSession(
  input: unknown,
): Promise<ActionResult<CheckoutSessionResult>> {
  return run('Could not start checkout', async () => {
    const parsed = parseInput(createCheckoutSessionSchema, input);
    const supabase = await createServerClient();
    const rider = await requireCurrentRiderProfile(supabase);

    const admin = createAdminClient();
    const priced = await priceCart(admin, rider.id, parsed.showId, parsed.cart, parsed.addOns);

    if (priced.needsStablingDetails && !parsed.stabling) {
      throw new UserFacingError(
        'Your cart includes stalls — fill in the stabling details above before checking out.',
      );
    }

    const { data: order, error: orderError } = await admin
      .from('orders')
      .insert({
        rider_id: rider.id,
        show_id: parsed.showId,
        amount_total: priced.total,
        status: 'pending',
        items: itemsToJson(priced.items),
        fee_total: priced.feeTotal,
        stabling_request: parsed.stabling ? (parsed.stabling as unknown as Json) : null,
      })
      .select()
      .single();
    if (orderError) throw orderError;

    const stripeCustomerId = await createOrderStripeCustomer(rider);
    const stripe = getStripeClient();
    const returnPath = `/rider/shows/${parsed.showId}`;

    const paymentIntentData: NonNullable<
      import('stripe').Stripe.Checkout.SessionCreateParams['payment_intent_data']
    > = {};

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
      // No payment_method_types: the Stripe Dashboard decides which methods show
      // (card, Apple Pay / Google Pay, Klarna, ...). Card saving for "charge more"
      // is set per method, not on payment_intent_data — a PaymentIntent-level
      // setup_future_usage hides Klarna, which cannot be saved for reuse.
      payment_method_options: SAVE_FOR_CHARGE_MORE,
    });

    const paymentIntentId =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : (session.payment_intent?.id ?? null);
    await admin
      .from('orders')
      .update({ stripe_payment_intent_id: paymentIntentId })
      .eq('id', order.id);

    if (!session.url)
      throw new UserFacingError('Stripe did not return a checkout URL. Please try again.');

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

export async function confirmCheckoutSession(input: unknown): Promise<FinalizeOrderResult> {
  const parsed = parseInput(confirmCheckoutSessionSchema, input);
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
    const piId =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent.id;
    const paymentIntent = await stripe.paymentIntents.retrieve(piId).catch(() => null);
    if (paymentIntent) await saveOffSessionCard(admin, order.id, paymentIntent);
  }

  return finalizeOrder(admin, order, rider);
}

export async function saveStablingDates(input: unknown): Promise<OrderRow> {
  const parsed = parseInput(stablingSaveSchema, input);
  const supabase = await createServerClient();
  const rider = await requireCurrentRider(supabase);

  const admin = createAdminClient();
  const { data: existing, error: readError } = await admin
    .from('orders')
    .select('rider_id, status, show_id')
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

  // Riders who didn't buy any stalls never get a stabling_requests row from
  // finalizeClaimedOrder (it only materializes one when horse/tack stalls
  // are non-zero), so the organizer's Arrivals & Departures list -- which
  // reads from stabling_requests, not orders -- would never learn these
  // dates exist. Back-fill a zero-stall placeholder row here so any rider
  // who reports dates shows up for the organizer, purchased stalls or not.
  const { data: hasRequest } = await admin
    .from('stabling_requests')
    .select('id')
    .eq('order_id', parsed.orderId)
    .maybeSingle();
  if (!hasRequest) {
    const { data: profile } = await admin
      .from('riders')
      .select('first_name, last_name, email')
      .eq('id', rider.id)
      .maybeSingle();
    const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ').trim();
    const trainerName = fullName !== '' ? fullName : (profile?.email ?? 'Not provided');
    await admin.from('stabling_requests').insert({
      show_id: existing.show_id,
      order_id: parsed.orderId,
      rider_id: rider.id,
      trainer_name: trainerName,
      horse_stalls: 0,
      tack_stalls: 0,
    });
  }

  revalidatePath(ROUTES.rider);
  return data;
}
