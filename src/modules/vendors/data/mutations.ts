'use server';

import crypto from 'crypto';
import { revalidatePath } from 'next/cache';
import type Stripe from 'stripe';
import { createServerClient } from '@/shared/lib/supabase/server';
import { createAdminClient } from '@/shared/lib/supabase/admin';
import { getStripeClient } from '@/shared/lib/stripe';
import { env } from '@/shared/lib/env';
import { ROUTES } from '@/shared/constants/routes';
import { getStaffProfile } from '@/modules/auth/data/queries';
import { getImpersonatedOrgId } from '@/shared/lib/impersonation';
import type { Json } from '@/shared/types/database.types';
import {
  vendorSignUpSchema,
  vendorVerifySchema,
  vendorResendCodeSchema,
  applyToShowSchema,
  applyToShowPublicSchema,
  signVendorAgreementSchema,
  createVendorDocumentUploadUrlSchema,
  registerVendorDocumentSchema,
  removeVendorDocumentSchema,
  createVendorCheckoutSessionSchema,
  confirmVendorCheckoutSessionSchema,
  reviewVendorBookingSchema,
} from '@/modules/vendors/schemas';
import {
  buildVendorStripeLineItems,
  createVendorBookingStripeCustomer,
  finalizeVendorBookingPayment,
  priceVendorBooking,
  saveVendorOffSessionCard,
} from '@/modules/vendors/data/checkout';
import type {
  FinalizeVendorBookingResult,
  VendorCheckoutSessionResult,
  VendorDocumentUpload,
  VendorResendOutcome,
  VendorSignUpOutcome,
  VendorVerifyOutcome,
} from '@/modules/vendors/types';
import {
  VENDOR_DASHBOARD_PATH,
  VENDOR_DISCOVER_PATH,
  VENDOR_DOCUMENTS_PATH,
  VENDOR_DOCS_BUCKET,
  VENDOR_DOCUMENT_SIGNED_URL_TTL_SECONDS,
} from '@/modules/vendors/constants';

type ServerClient = Awaited<ReturnType<typeof createServerClient>>;

const MAIL_UNREACHABLE =
  'We could not reach the email service just now. Wait a moment and try again.';

async function withMailTransport<T>(
  run: () => Promise<T>,
): Promise<{ ok: true; value: T } | { ok: false; message: string }> {
  try {
    return { ok: true, value: await run() };
  } catch (cause) {
    console.error('[vendors] auth transport failure', cause);
    return { ok: false, message: MAIL_UNREACHABLE };
  }
}

async function ensureVendorProfile(
  supabase: ServerClient,
  user: { id: string; email?: string | null },
  name: string,
): Promise<void> {
  const { data: existing, error: selectError } = await supabase
    .from('users')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();
  if (selectError) throw selectError;
  if (existing) return;

  const { error: insertError } = await supabase.from('users').insert({
    id: user.id,
    name,
    email: (user.email ?? '').toLowerCase(),
    platform_role: 'Vendor',
  });
  if (insertError) throw insertError;
}

export async function signUpVendor(input: unknown): Promise<VendorSignUpOutcome> {
  const { name, email, password } = vendorSignUpSchema.parse(input);

  const supabase = await createServerClient();
  const attempt = await withMailTransport(() =>
    supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${env.siteUrl}${ROUTES.authCallback}?next=${VENDOR_DASHBOARD_PATH}`,

        data: { name },
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

  await ensureVendorProfile(supabase, data.user, name);
  revalidatePath('/', 'layout');
  return { status: 'done', redirectTo: VENDOR_DASHBOARD_PATH };
}

export async function verifyVendorSignUpCode(input: unknown): Promise<VendorVerifyOutcome> {
  const { email, token } = vendorVerifySchema.parse(input);

  const supabase = await createServerClient();
  const attempt = await withMailTransport(() =>
    supabase.auth.verifyOtp({ email, token, type: 'email' }),
  );
  if (!attempt.ok) return { status: 'error', message: attempt.message };

  const { data, error } = attempt.value;
  if (error || !data.user) {
    return { status: 'error', message: 'That code did not check out. Send a new one and retry.' };
  }

  const metadataName = (data.user.user_metadata as { name?: unknown }).name;
  const name =
    typeof metadataName === 'string' && metadataName.trim()
      ? metadataName
      : (data.user.email ?? 'Vendor');
  await ensureVendorProfile(supabase, data.user, name);
  revalidatePath('/', 'layout');
  return { status: 'done', redirectTo: VENDOR_DASHBOARD_PATH };
}

export async function resendVendorSignUpCode(input: unknown): Promise<VendorResendOutcome> {
  const { email } = vendorResendCodeSchema.parse(input);

  const supabase = await createServerClient();
  const attempt = await withMailTransport(() => supabase.auth.resend({ type: 'signup', email }));
  if (!attempt.ok) return { status: 'error', message: attempt.message };

  const { error } = attempt.value;
  if (error) return { status: 'error', message: error.message };
  return { status: 'sent' };
}

async function requireVendorProfile(): Promise<{ id: string; email: string }> {
  const profile = await getStaffProfile();
  if (profile?.platform_role !== 'Vendor') {
    throw new Error('Only a signed-in Vendor account can do this.');
  }
  return { id: profile.id, email: profile.email };
}

interface VendorApplyFields {
  showId: string;
  businessName: string;
  contact: string;
  contactName?: string;
  phone?: string;
  website?: string;
  productsOffered?: string;
  specialRequests?: string;
  items: { vendorItemId: string; qty: number }[];
}

async function insertPendingVendorBooking(
  supabase: ServerClient,
  admin: ReturnType<typeof createAdminClient>,
  fields: VendorApplyFields,
): Promise<{ bookingId: string }> {
  const { data: catalog, error: catalogError } = await supabase
    .from('vendor_items')
    .select('id, name, price, qty')
    .eq('show_id', fields.showId)
    .eq('enabled', true)
    .in(
      'id',
      fields.items.map((l) => l.vendorItemId),
    );
  if (catalogError) throw new Error(catalogError.message);

  const catalogById = new Map(catalog.map((c) => [c.id, c]));

  const cartByItem = new Map<string, number>();
  for (const line of fields.items) {
    if (!catalogById.has(line.vendorItemId)) continue;
    cartByItem.set(line.vendorItemId, (cartByItem.get(line.vendorItemId) ?? 0) + line.qty);
  }
  const cart = [...cartByItem].map(([vendorItemId, qty]) => ({ vendorItemId, qty }));

  const cappedIds = catalog.filter((c) => c.qty !== null).map((c) => c.id);
  if (cappedIds.length > 0) {
    const { data: existingBookings, error: existingError } = await admin
      .from('vendor_bookings')
      .select('id, status')
      .eq('show_id', fields.showId)
      .neq('status', 'rejected');
    if (existingError) throw new Error(existingError.message);

    const bookedByItem = new Map<string, number>();
    if (existingBookings.length > 0) {
      const { data: existingItems, error: itemsReadError } = await admin
        .from('vendor_booking_items')
        .select('vendor_item_id, qty')
        .in(
          'booking_id',
          existingBookings.map((b) => b.id),
        )
        .in('vendor_item_id', cappedIds);
      if (itemsReadError) throw new Error(itemsReadError.message);
      for (const row of existingItems) {
        bookedByItem.set(
          row.vendor_item_id,
          (bookedByItem.get(row.vendor_item_id) ?? 0) + (row.qty ?? 1),
        );
      }
    }

    for (const line of cart) {
      const cat = catalogById.get(line.vendorItemId);
      if (cat === undefined) continue;
      if (cat.qty === null) continue;
      if ((bookedByItem.get(cat.id) ?? 0) + line.qty > cat.qty) {
        throw new Error(`"${cat.name}" doesn't have enough left.`);
      }
    }
  }

  const bookingId = crypto.randomUUID();
  const { error: bookingError } = await supabase.from('vendor_bookings').insert({
    id: bookingId,
    show_id: fields.showId,
    name: fields.businessName,
    contact: fields.contact,
    contact_name: fields.contactName ?? null,
    phone: fields.phone ?? null,
    website: fields.website ?? null,
    products_offered: fields.productsOffered ?? null,
    special_requests: fields.specialRequests ?? null,
    status: 'pending',
  });
  if (bookingError) throw new Error(bookingError.message);

  if (cart.length > 0) {
    const { error: itemsError } = await supabase.from('vendor_booking_items').insert(
      cart.map((line) => ({
        booking_id: bookingId,
        vendor_item_id: line.vendorItemId,
        qty: line.qty,
      })),
    );
    if (itemsError) throw new Error(itemsError.message);
  }

  return { bookingId };
}

export async function applyToVendorShow(input: unknown): Promise<{ bookingId: string }> {
  const parsed = applyToShowSchema.parse(input);
  const vendor = await requireVendorProfile();
  const supabase = await createServerClient();
  const admin = createAdminClient();

  const result = await insertPendingVendorBooking(supabase, admin, {
    showId: parsed.showId,
    businessName: parsed.businessName,
    contact: vendor.email,
    contactName: parsed.contactName,
    phone: parsed.phone,
    website: parsed.website,
    productsOffered: parsed.productsOffered,
    specialRequests: parsed.specialRequests,
    items: parsed.items,
  });

  revalidatePath(VENDOR_DASHBOARD_PATH);
  revalidatePath(VENDOR_DISCOVER_PATH);
  return result;
}

export async function applyToShowPublic(input: unknown): Promise<{ bookingId: string }> {
  const parsed = applyToShowPublicSchema.parse(input);
  const supabase = await createServerClient();
  const admin = createAdminClient();

  return insertPendingVendorBooking(supabase, admin, {
    showId: parsed.showId,
    businessName: parsed.businessName,
    contact: parsed.email,
    contactName: parsed.contactName,
    phone: parsed.phone,
    website: parsed.website,
    productsOffered: parsed.productsOffered,
    specialRequests: parsed.specialRequests,
    items: parsed.items,
  });
}

export async function signVendorAgreement(input: unknown): Promise<void> {
  const parsed = signVendorAgreementSchema.parse(input);
  const vendor = await requireVendorProfile();
  const supabase = await createServerClient();

  const { data: booking, error: readError } = await supabase
    .from('vendor_bookings')
    .select('id, contact, agreement_signed_at, show_id, shows(vendor_agreement_text)')
    .eq('id', parsed.bookingId)
    .maybeSingle();
  if (readError) throw new Error(readError.message);
  if (!booking || (booking.contact ?? '').toLowerCase() !== vendor.email.toLowerCase()) {
    throw new Error('Not your booking.');
  }
  if (booking.agreement_signed_at) return;

  const showRow = booking.shows as unknown as { vendor_agreement_text: string | null } | null;

  const { error } = await supabase
    .from('vendor_bookings')
    .update({
      agreement_signed_at: new Date().toISOString(),
      agreement_signed_text: showRow?.vendor_agreement_text ?? null,
      agreement_signed_name: parsed.fullName,
    })
    .eq('id', parsed.bookingId);
  if (error) throw new Error(error.message);

  revalidatePath(VENDOR_DASHBOARD_PATH);
}

async function loadOwnBooking(
  bookingId: string,
  vendorEmail: string,
): Promise<{ id: string; documentUploads: VendorDocumentUpload[] }> {
  const supabase = await createServerClient();
  const { data: booking, error } = await supabase
    .from('vendor_bookings')
    .select('id, contact, document_uploads')
    .eq('id', bookingId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!booking || (booking.contact ?? '').toLowerCase() !== vendorEmail.toLowerCase()) {
    throw new Error('Not your booking.');
  }
  const uploads = Array.isArray(booking.document_uploads)
    ? (booking.document_uploads as unknown as VendorDocumentUpload[])
    : [];
  return { id: booking.id, documentUploads: uploads };
}

export async function createVendorDocumentUploadUrl(
  input: unknown,
): Promise<{ path: string; token: string }> {
  const parsed = createVendorDocumentUploadUrlSchema.parse(input);
  const vendor = await requireVendorProfile();
  await loadOwnBooking(parsed.bookingId, vendor.email);
  const supabase = await createServerClient();

  const safeName = parsed.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${vendor.id}/${parsed.bookingId}/${parsed.requirementId}-${crypto.randomUUID()}-${safeName}`;

  const { data, error } = await supabase.storage
    .from(VENDOR_DOCS_BUCKET)
    .createSignedUploadUrl(path);
  if (error) throw new Error(error.message);

  return { path: data.path, token: data.token };
}

export async function registerVendorDocument(input: unknown): Promise<{ url: string | null }> {
  const parsed = registerVendorDocumentSchema.parse(input);
  const vendor = await requireVendorProfile();
  const existing = await loadOwnBooking(parsed.bookingId, vendor.email);
  const supabase = await createServerClient();

  const uploads = existing.documentUploads.filter((d) => d.requirementId !== parsed.requirementId);
  uploads.push({
    requirementId: parsed.requirementId,
    label: parsed.label,
    path: parsed.path,
    expirationDate: null,
    verified: false,
  });

  const { error } = await supabase
    .from('vendor_bookings')
    .update({ document_uploads: uploads as unknown as Json })
    .eq('id', parsed.bookingId);
  if (error) {
    await supabase.storage.from(VENDOR_DOCS_BUCKET).remove([parsed.path]);
    throw new Error(error.message);
  }

  revalidatePath(VENDOR_DOCUMENTS_PATH);

  const { data } = await supabase.storage
    .from(VENDOR_DOCS_BUCKET)
    .createSignedUrl(parsed.path, VENDOR_DOCUMENT_SIGNED_URL_TTL_SECONDS);
  return { url: data?.signedUrl ?? null };
}

export async function removeVendorDocument(input: unknown): Promise<void> {
  const parsed = removeVendorDocumentSchema.parse(input);
  const vendor = await requireVendorProfile();
  const existing = await loadOwnBooking(parsed.bookingId, vendor.email);
  const supabase = await createServerClient();

  const removed = existing.documentUploads.find((d) => d.requirementId === parsed.requirementId);
  const uploads = existing.documentUploads.filter((d) => d.requirementId !== parsed.requirementId);

  const { error } = await supabase
    .from('vendor_bookings')
    .update({ document_uploads: uploads as unknown as Json })
    .eq('id', parsed.bookingId);
  if (error) throw new Error(error.message);

  if (removed?.path) {
    await supabase.storage.from(VENDOR_DOCS_BUCKET).remove([removed.path]);
  }

  revalidatePath(VENDOR_DOCUMENTS_PATH);
}

async function loadOwnBookingForCheckout(
  admin: ReturnType<typeof createAdminClient>,
  bookingId: string,
  vendorEmail: string,
) {
  const { data: booking, error } = await admin
    .from('vendor_bookings')
    .select('*')
    .eq('id', bookingId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!booking || (booking.contact ?? '').toLowerCase() !== vendorEmail.toLowerCase()) {
    throw new Error('Not your booking.');
  }
  return booking;
}

export async function createVendorCheckoutSession(
  input: unknown,
): Promise<VendorCheckoutSessionResult> {
  const parsed = createVendorCheckoutSessionSchema.parse(input);
  const vendor = await requireVendorProfile();
  const admin = createAdminClient();

  const booking = await loadOwnBookingForCheckout(admin, parsed.bookingId, vendor.email);
  if (booking.status === 'paid') throw new Error('This booking is already paid.');
  if (booking.status !== 'approved') {
    throw new Error('This booking needs organizer approval before it can be paid.');
  }
  if (!booking.agreement_signed_at) {
    throw new Error('Sign the booth agreement before paying.');
  }

  const priced = await priceVendorBooking(admin, booking);
  if (priced.total <= 0) throw new Error('This booking has nothing to charge yet.');

  const stripeCustomerId = await createVendorBookingStripeCustomer(booking);
  const stripe = getStripeClient();
  const returnPath = VENDOR_DASHBOARD_PATH;

  const paymentIntentData: NonNullable<Stripe.Checkout.SessionCreateParams['payment_intent_data']> =
    {
      setup_future_usage: 'off_session',
    };

  if (priced.chargesEnabled && priced.stripeConnectAccountId) {
    paymentIntentData.application_fee_amount = Math.round(priced.feeTotal * 100);
    paymentIntentData.transfer_data = { destination: priced.stripeConnectAccountId };
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer: stripeCustomerId,
    line_items: buildVendorStripeLineItems(priced.items, priced.currency),
    success_url: `${env.siteUrl}${returnPath}?booking=${booking.id}&checkoutSession={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.siteUrl}${returnPath}?checkoutCanceled=1`,

    metadata: { bookingId: booking.id, showId: booking.show_id },
    payment_intent_data: paymentIntentData,
  });

  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : (session.payment_intent?.id ?? null);
  await admin
    .from('vendor_bookings')
    .update({ stripe_payment_intent_id: paymentIntentId })
    .eq('id', booking.id);

  if (!session.url) throw new Error('Stripe did not return a checkout URL. Please try again.');

  return {
    bookingId: booking.id,
    sessionId: session.id,
    url: session.url,
    total: priced.total,
    items: priced.items,
    feeTotal: priced.feeTotal,
  };
}

export async function confirmVendorCheckoutSession(
  input: unknown,
): Promise<FinalizeVendorBookingResult> {
  const parsed = confirmVendorCheckoutSessionSchema.parse(input);
  const vendor = await requireVendorProfile();
  const admin = createAdminClient();

  const booking = await loadOwnBookingForCheckout(admin, parsed.bookingId, vendor.email);

  if (booking.status === 'paid') {
    const priced = await priceVendorBooking(admin, booking);
    return {
      ok: true,
      alreadyFulfilled: true,
      bookingId: booking.id,
      total: booking.amount_total ?? priced.total,
      items: priced.items,
    };
  }

  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.retrieve(parsed.sessionId).catch(() => null);
  if (!session) throw new Error('That Checkout Session could not be found.');
  if (session.metadata?.bookingId !== booking.id) {
    throw new Error('This Checkout Session does not match this booking.');
  }
  if (session.payment_status !== 'paid') {
    throw new Error('Payment has not completed yet.');
  }

  const priced = await priceVendorBooking(admin, booking);
  if (session.amount_total !== Math.round(priced.total * 100)) {
    throw new Error('Payment amount does not match this booking.');
  }

  let paymentIntentId: string | null = null;
  if (session.payment_intent) {
    paymentIntentId =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent.id;
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId).catch(() => null);
    if (paymentIntent) await saveVendorOffSessionCard(admin, booking.id, paymentIntent);
  }

  const result = await finalizeVendorBookingPayment(admin, booking, priced, paymentIntentId);
  return result;
}

async function assertCanManageVendors(showId: string): Promise<void> {
  const profile = await getStaffProfile();
  if (!profile) throw new Error('Not signed in.');

  const impersonatedOrgId = await getImpersonatedOrgId();
  if (profile.platform_role === 'Organizer' || impersonatedOrgId !== null) return;

  const supabase = await createServerClient();
  const { data: allowed } = await supabase.rpc('has_show_permission', {
    target_show_id: showId,
    permission_key: 'canManageVendors',
  });
  if (allowed !== true) {
    throw new Error('You do not have permission to manage vendors for this show.');
  }
}

async function loadPendingBookingForReview(
  admin: ReturnType<typeof createAdminClient>,
  bookingId: string,
  showId: string,
): Promise<{ id: string; status: string | null }> {
  const { data: booking, error } = await admin
    .from('vendor_bookings')
    .select('id, show_id, status')
    .eq('id', bookingId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (booking?.show_id !== showId) throw new Error('Vendor booking not found for this show.');
  if (booking.status !== 'pending') {
    throw new Error(
      `This application is already ${booking.status ?? 'pending'} — nothing to review.`,
    );
  }
  return booking;
}

export async function approveVendorBooking(input: unknown): Promise<void> {
  const parsed = reviewVendorBookingSchema.parse(input);
  await assertCanManageVendors(parsed.showId);

  const admin = createAdminClient();
  await loadPendingBookingForReview(admin, parsed.bookingId, parsed.showId);

  const { error } = await admin
    .from('vendor_bookings')
    .update({ status: 'approved' })
    .eq('id', parsed.bookingId)
    .eq('status', 'pending');
  if (error) throw new Error(error.message);

  revalidatePath(ROUTES.users);
}

export async function rejectVendorBooking(input: unknown): Promise<void> {
  const parsed = reviewVendorBookingSchema.parse(input);
  await assertCanManageVendors(parsed.showId);

  const admin = createAdminClient();
  await loadPendingBookingForReview(admin, parsed.bookingId, parsed.showId);

  const { error } = await admin
    .from('vendor_bookings')
    .update({ status: 'rejected' })
    .eq('id', parsed.bookingId)
    .eq('status', 'pending');
  if (error) throw new Error(error.message);

  revalidatePath(ROUTES.users);
}
