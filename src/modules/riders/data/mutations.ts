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

export async function signUpRider(input: unknown): Promise<RiderSignUpOutcome> {
  const { email, password } = riderSignUpSchema.parse(input);

  const supabase = await createServerClient();
  const attempt = await withMailTransport(() =>
    supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${env.siteUrl}${ROUTES.authCallback}?next=${ROUTES.rider}` },
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
  return { status: 'done', redirectTo: ROUTES.rider };
}

export async function verifyRiderSignUpCode(input: unknown): Promise<RiderVerifyOutcome> {
  const { email, token } = riderVerifySchema.parse(input);

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
  return { status: 'done', redirectTo: ROUTES.rider };
}

export async function resendRiderSignUpCode(input: unknown): Promise<RiderResendOutcome> {
  const { email } = riderResendCodeSchema.parse(input);

  const supabase = await createServerClient();
  const attempt = await withMailTransport(() => supabase.auth.resend({ type: 'signup', email }));
  if (!attempt.ok) return { status: 'error', message: attempt.message };

  const { error } = attempt.value;
  if (error) return { status: 'error', message: error.message };
  return { status: 'sent' };
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
    await supabase.storage.from(HORSE_DOCUMENTS_BUCKET).remove([removed.path]);
  }

  revalidatePath(ROUTES.rider);
  return data;
}

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

export async function createCheckoutSession(
  input: unknown,
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
