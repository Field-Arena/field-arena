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
import { getImpersonatedOrgId } from '@/modules/superadmin/data/impersonation';
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
} from '../schemas';
import {
  buildVendorStripeLineItems,
  createVendorBookingStripeCustomer,
  finalizeVendorBookingPayment,
  priceVendorBooking,
  saveVendorOffSessionCard,
} from './checkout';
import type {
  FinalizeVendorBookingResult,
  VendorCheckoutSessionResult,
  VendorResendOutcome,
  VendorSignUpOutcome,
  VendorVerifyOutcome,
} from '../types';

type ServerClient = Awaited<ReturnType<typeof createServerClient>>;

/**
 * Vendor self-service writes — applying to a show, signing the booth
 * agreement, the per-booking document checklist, and booth-fee checkout.
 *
 * The apply/sign/document actions go through the caller's own client, so RLS
 * decides what is allowed — see
 * supabase/migrations/20260806140000_vendor_self_service.sql for the
 * policies this relies on. That migration deliberately does NOT open
 * status/amount_total/refunded_amount/stripe_* to a plain authenticated
 * write: a vendor can apply and sign, never mark their own booking paid.
 *
 * The two checkout actions below (createVendorCheckoutSession/
 * confirmVendorCheckoutSession) are the exception: money only ever moves
 * once Stripe itself confirms it, through the service-role admin client and
 * ../data/checkout.ts's finalizeVendorBookingPayment — never through a
 * client-writable RLS path. Mirrors modules/riders/data/mutations.ts's own
 * checkout actions exactly: resolve identity on the caller's own RLS-scoped
 * client first (requireVendorProfile), then switch to the admin client for
 * everything Stripe-adjacent, same reasoning as that file's own header
 * comment (RLS has no policy letting a vendor write these columns, by
 * design).
 */

const VENDOR_DOCS_BUCKET = 'vendor-docs';

/**
 * Same "a stalled mail send throws a bare, message-less fetch failure"
 * problem riders/data/mutations.ts's own withMailTransport documents —
 * Supabase's shared testing SMTP sender is slow enough that this is a real,
 * not hypothetical, failure mode. Kept as its own copy rather than imported,
 * per this codebase's "a module must not reach into another module's
 * internals" rule.
 */
const MAIL_UNREACHABLE = 'We could not reach the email service just now. Wait a moment and try again.';

async function withMailTransport<T>(
  run: () => Promise<T>
): Promise<{ ok: true; value: T } | { ok: false; message: string }> {
  try {
    return { ok: true, value: await run() };
  } catch (cause) {
    console.error('[vendors] auth transport failure', cause);
    return { ok: false, message: MAIL_UNREACHABLE };
  }
}

/**
 * Self-provisions the `users` row (platform_role: 'Vendor') for an
 * authenticated auth.users account that doesn't have one yet — the bridge
 * back from applyToShowPublic's genuinely anonymous application to a real
 * account, the same "buy first, account second" shape legacy's vendor.html
 * used with Clerk's mountSignUp (see this file's own applyToShowPublic doc
 * comment). Runs on the caller's own request-scoped client —
 * users_insert_self_vendor RLS (20260807010000_vendor_self_signup.sql)
 * already lets a signed-in user insert their own row scoped to
 * platform_role = 'Vendor', so no elevated privilege is needed or wanted.
 *
 * Select-then-insert rather than upsert: an upsert would silently overwrite
 * an already-provisioned row's fields (e.g. a name edited since) on a second call.
 */
async function ensureVendorProfile(
  supabase: ServerClient,
  user: { id: string; email?: string | null },
  name: string
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

/**
 * Creates the auth.users account for a self-service vendor sign-up and, once
 * a session exists, immediately provisions the matching `users` row. Once
 * this exists, RLS reconciles it against any earlier anonymous application
 * by email (vendor_bookings_select_own/update_own,
 * 20260806140000_vendor_self_service.sql) — no explicit linking step needed.
 *
 * Deliberately NOT routed through auth module's signUpWithPassword — that
 * function's landAfterSignup/provisionedDestination enforce Field & Arena's
 * invite-only rule for staff, signing an unprovisioned account back out with
 * "ask your organizer to invite you." Vendor is a carved-out exception, same
 * as Rider: this function never checks for an existing invite and never
 * signs the new account back out.
 */
export async function signUpVendor(input: unknown): Promise<VendorSignUpOutcome> {
  const { name, email, password } = vendorSignUpSchema.parse(input);

  const supabase = await createServerClient();
  const attempt = await withMailTransport(() =>
    supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${env.siteUrl}${ROUTES.authCallback}?next=${ROUTES.dashboard}/vendor`,
        // Carries the name across to verifyVendorSignUpCode, a separate
        // request (just email + the emailed code) with no other way to know
        // what was typed on this original form.
        data: { name },
      },
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
  await ensureVendorProfile(supabase, data.user, name);
  revalidatePath('/', 'layout');
  return { status: 'done', redirectTo: `${ROUTES.dashboard}/vendor` };
}

/** Exchanges the emailed 6-digit code for a session, then provisions the vendor row. Name was already captured at sign-up time and isn't re-asked here. */
export async function verifyVendorSignUpCode(input: unknown): Promise<VendorVerifyOutcome> {
  const { email, token } = vendorVerifySchema.parse(input);

  const supabase = await createServerClient();
  const attempt = await withMailTransport(() => supabase.auth.verifyOtp({ email, token, type: 'email' }));
  if (!attempt.ok) return { status: 'error', message: attempt.message };

  const { data, error } = attempt.value;
  if (error || !data.user) {
    return { status: 'error', message: 'That code did not check out. Send a new one and retry.' };
  }

  const metadataName = (data.user.user_metadata as { name?: unknown }).name;
  const name = typeof metadataName === 'string' && metadataName.trim() ? metadataName : (data.user.email ?? 'Vendor');
  await ensureVendorProfile(supabase, data.user, name);
  revalidatePath('/', 'layout');
  return { status: 'done', redirectTo: `${ROUTES.dashboard}/vendor` };
}

/** Sends a fresh six-digit code to a vendor signup that hasn't confirmed yet. */
export async function resendVendorSignUpCode(input: unknown): Promise<VendorResendOutcome> {
  const { email } = vendorResendCodeSchema.parse(input);

  const supabase = await createServerClient();
  const attempt = await withMailTransport(() => supabase.auth.resend({ type: 'signup', email }));
  if (!attempt.ok) return { status: 'error', message: attempt.message };

  const { error } = attempt.value;
  if (error) return { status: 'error', message: error.message };
  return { status: 'sent' };
}

interface VendorDocumentUpload {
  requirementId: string;
  label: string;
  path: string;
  expirationDate: string | null;
  verified: boolean;
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

/**
 * The real, non-money half of vendor-apply.html's POST: creates a pending
 * vendor_bookings row (+ its line items), same shape the legacy public
 * application wrote — including its qty-cap check (409 when a space no
 * longer has room), same non-transactional best-effort legacy's own
 * handleVendorApply makes (a genuine simultaneous double-booking is not
 * closed here, matching that source). Shared by both `applyToVendorShow`
 * (signed-in vendor) and `applyToShowPublic` (anonymous, legacy's actual
 * entry point) — the only difference between them is who `contact` and the
 * write client's identity are.
 *
 * The cap check itself has to read through the service-role client: RLS only
 * ever admits a vendor to their own booking's line items
 * (vendor_booking_items_select_own), so a normal client here would always see
 * zero existing bookings for a show the applicant has never booked before —
 * silently disabling the cap rather than enforcing it. Only read — the
 * booking/line-item writes below stay on the caller's own client (`supabase`,
 * scoped to whatever the caller is actually allowed to insert under RLS), so
 * RLS still governs what gets written.
 */
async function insertPendingVendorBooking(
  supabase: ServerClient,
  admin: ReturnType<typeof createAdminClient>,
  fields: VendorApplyFields
): Promise<{ bookingId: string }> {
  const { data: catalog, error: catalogError } = await supabase
    .from('vendor_items')
    .select('id, name, price, qty')
    .eq('show_id', fields.showId)
    .eq('enabled', true)
    .in(
      'id',
      fields.items.map((l) => l.vendorItemId)
    );
  if (catalogError) throw new Error(catalogError.message);

  const catalogById = new Map(catalog.map((c) => [c.id, c]));
  // Merged by vendorItemId before the cap check or the insert — two cart
  // lines for the same item (never producible by VendorApplyDialog's own UI,
  // which keys qty by item.id in a single object, but not guarded against for
  // a hand-built call) would otherwise pass the cap check individually and
  // then trip vendor_booking_items' unique(booking_id, vendor_item_id)
  // constraint as an unhandled 500 on insert.
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
          existingBookings.map((b) => b.id)
        )
        .in('vendor_item_id', cappedIds);
      if (itemsReadError) throw new Error(itemsReadError.message);
      for (const row of existingItems) {
        bookedByItem.set(row.vendor_item_id, (bookedByItem.get(row.vendor_item_id) ?? 0) + (row.qty ?? 1));
      }
    }

    for (const line of cart) {
      const cat = catalogById.get(line.vendorItemId);
      if (cat === undefined) continue;
      if (cat.qty === null) continue; // null = unlimited, nothing to cap
      if ((bookedByItem.get(cat.id) ?? 0) + line.qty > cat.qty) {
        throw new Error(`"${cat.name}" doesn't have enough left.`);
      }
    }
  }

  // The id is generated here rather than read back via `.select().single()`
  // (Postgres RETURNING): RETURNING requires the new row to also satisfy the
  // table's SELECT policies, and an anonymous caller has none that admit it
  // (vendor_bookings_select_own matches contact against auth.jwt()->>'email',
  // which anon has none of) — confirmed live, the insert itself succeeds
  // under vendor_bookings_insert_anon but a chained `.select()` 42501s. A
  // signed-in vendor's own insert would pass RETURNING fine (their JWT email
  // matches), but generating the id upfront works identically for both
  // callers, so there's only one code path to get right.
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
      }))
    );
    if (itemsError) throw new Error(itemsError.message);
  }

  return { bookingId };
}

/** Applies to a show as an already-signed-in platform Vendor — VendorApplyDialog's "Reserve Space" flow. */
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

  revalidatePath('/dashboard/vendor');
  revalidatePath('/dashboard/vendor/discover');
  return result;
}

/**
 * Applies to a show with no account at all — the genuine legacy
 * vendor-apply.html entry point, faithfully anonymous: no
 * `requireVendorProfile`, and the booking/line-item insert runs on the
 * caller's own (unauthenticated) request-scoped client, admitted by
 * `vendor_bookings_insert_anon`/`vendor_booking_items_insert_anon`
 * (supabase/migrations/20260810120000_vendor_public_apply.sql). `contact` is
 * the email typed on the form, not a session's — the same column a later
 * real Vendor account reconciles against by email
 * (vendor_bookings_select_own/update_own), so an applicant who signs up
 * afterward with the same address already sees this booking.
 */
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

/**
 * Vendor equivalent of the rider waiver — one signature per booking, stored
 * inline on the row (see vendor_bookings.agreement_signed_* columns' own
 * comment for why there is no separate table). Idempotent, same as legacy:
 * signing an already-signed booking is a no-op, not an error.
 */
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

  revalidatePath('/dashboard/vendor');
}

async function loadOwnBooking(
  bookingId: string,
  vendorEmail: string
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

/**
 * Step one of the two-step upload — same pattern as
 * shows/data/mutations.ts's createDocumentUploadUrl, scoped under this
 * vendor's own auth uid so the storage policy (fa_vendor_docs_owner) admits
 * it. See that migration's header for the full path convention.
 */
export async function createVendorDocumentUploadUrl(
  input: unknown
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

/** Step two: record the uploaded object against this requirement, replacing any earlier upload for the same one. */
export async function registerVendorDocument(
  input: unknown
): Promise<{ url: string | null }> {
  const parsed = registerVendorDocumentSchema.parse(input);
  const vendor = await requireVendorProfile();
  const existing = await loadOwnBooking(parsed.bookingId, vendor.email);
  const supabase = await createServerClient();

  const uploads = existing.documentUploads.filter(
    (d) => d.requirementId !== parsed.requirementId
  );
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

  revalidatePath('/dashboard/vendor/documents');

  const { data } = await supabase.storage
    .from(VENDOR_DOCS_BUCKET)
    .createSignedUrl(parsed.path, 3600);
  return { url: data?.signedUrl ?? null };
}

export async function removeVendorDocument(input: unknown): Promise<void> {
  const parsed = removeVendorDocumentSchema.parse(input);
  const vendor = await requireVendorProfile();
  const existing = await loadOwnBooking(parsed.bookingId, vendor.email);
  const supabase = await createServerClient();

  const removed = existing.documentUploads.find((d) => d.requirementId === parsed.requirementId);
  const uploads = existing.documentUploads.filter(
    (d) => d.requirementId !== parsed.requirementId
  );

  const { error } = await supabase
    .from('vendor_bookings')
    .update({ document_uploads: uploads as unknown as Json })
    .eq('id', parsed.bookingId);
  if (error) throw new Error(error.message);

  if (removed?.path) {
    // Best-effort: the row is already updated, so a stray object is not worth failing on.
    await supabase.storage.from(VENDOR_DOCS_BUCKET).remove([removed.path]);
  }

  revalidatePath('/dashboard/vendor/documents');
}

// ---------------------------------------------------------------------------
// Booth-fee checkout
//
// Both actions resolve the caller's identity through requireVendorProfile
// FIRST (backed by getStaffProfile's own RLS-scoped read), then do every
// subsequent read/write through the service-role admin client via
// data/checkout.ts. Same split as riders/data/mutations.ts's checkout
// actions, for the same reason: the identity check is the one thing that
// must never be spoofable, and it stays on the client that only ever sees
// what RLS says the real signed-in caller may see.
// ---------------------------------------------------------------------------

/** Loads a booking and confirms it belongs to the signed-in vendor — shared by both checkout actions below. */
async function loadOwnBookingForCheckout(
  admin: ReturnType<typeof createAdminClient>,
  bookingId: string,
  vendorEmail: string
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

/**
 * Prices the booking's own line items and creates a real Stripe Checkout
 * Session for the outstanding booth fee. Returns the hosted page's `url` for
 * the client to redirect to (`window.location.href = url`) — same
 * hosted-Checkout approach as riders' createCheckoutSession, and mirrors
 * legacy's vendor-checkout-quote (api/organizations/[id]/[resource].js)
 * closely, minus that endpoint's Elements-based in-page card form: this port
 * uses Stripe's hosted page instead, matching the pattern the Rider Portal
 * checkout just established here.
 *
 * Gated on status === 'approved' — an intentional addition over legacy,
 * which only checked "not already confirmed." Legacy's vendor_bookings had
 * no distinct approval step (pending → confirmed only); this schema's
 * pending → approved → paid flow means payment should not be offered before
 * an organizer has actually reviewed the application, matching what the My
 * Bookings page (app/(dashboard)/dashboard/vendor/page.tsx) already shows
 * for a 'pending' booking ("pending review", no pay action).
 *
 * Also gated on the booth agreement being signed — the Pay button on that
 * same page is only rendered once agreementSignedAt is set, but a Server
 * Action is a directly-callable RPC regardless of what the UI chooses to
 * render (see architecture.md: "every read and write must be safe under the
 * caller's role"), so that UI-only gate is re-checked here for real.
 */
export async function createVendorCheckoutSession(input: unknown): Promise<VendorCheckoutSessionResult> {
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
  const returnPath = '/dashboard/vendor';

  const paymentIntentData: NonNullable<Stripe.Checkout.SessionCreateParams['payment_intent_data']> = {
    setup_future_usage: 'off_session',
  };
  // Same "unfinished organizer Connect onboarding never blocks a sale" stance
  // as riders' createCheckoutSession: a plain charge with no transfer_data
  // until the org finishes onboarding, rather than blocking payment.
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
    // bookingId (not orderId) is what the webhook route uses to tell a
    // vendor booking session apart from a rider order session — both fire
    // the same checkout.session.completed/async_payment_succeeded event
    // types, so the branch happens on metadata, not event.type. See
    // app/api/webhooks/stripe/route.ts.
    metadata: { bookingId: booking.id, showId: booking.show_id },
    payment_intent_data: paymentIntentData,
  });

  const paymentIntentId =
    typeof session.payment_intent === 'string' ? session.payment_intent : (session.payment_intent?.id ?? null);
  await admin.from('vendor_bookings').update({ stripe_payment_intent_id: paymentIntentId }).eq('id', booking.id);

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

/**
 * The return-from-Stripe path: verifies the Checkout Session actually paid,
 * then calls the same finalizeVendorBookingPayment the webhook calls.
 * Mirrors riders' confirmCheckoutSession — this is the in-page half of "two
 * ways to reach fulfillment," the webhook
 * (app/api/webhooks/stripe/route.ts) being the other, for whichever one the
 * vendor's browser actually completes (the webhook fires even if this call
 * never runs — a closed tab, a network drop on the way back).
 *
 * No revalidatePath here, unlike this file's other mutations — this
 * function's only caller is app/(dashboard)/dashboard/vendor/page.tsx's own
 * render (the `?booking=&checkoutSession=` return-from-Stripe branch), not a
 * client-triggered Server Action. revalidatePath() called during a render
 * pass throws ("used ... during render which is unsupported" — confirmed
 * live: this crashed the confirmation page with a 500 despite the payment
 * itself having already succeeded). It's also unnecessary here: the render
 * already has the freshly-finalized `result` to show directly, and this
 * route has no static/cached RSC payload to bust — every request re-runs
 * getStaffProfile()/listMyBookings() fresh because both read cookies().
 */
export async function confirmVendorCheckoutSession(input: unknown): Promise<FinalizeVendorBookingResult> {
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
      typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent.id;
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId).catch(() => null);
    if (paymentIntent) await saveVendorOffSessionCard(admin, booking.id, paymentIntent);
  }

  const result = await finalizeVendorBookingPayment(admin, booking, priced, paymentIntentId);
  return result;
}

// ---------------------------------------------------------------------------
// Staff review — approve or reject a pending application
//
// This is the previously-missing organizer-side half of the
// pending → approved → paid flow: createVendorCheckoutSession has always
// refused to start checkout on anything but an 'approved' booking, but
// nothing anywhere wrote that value, so no booking could ever leave 'pending'
// through the app. These two actions close that gap.
//
// Same shape as sales/data/mutations.ts's refundSale/chargeMore: the
// permission check that would normally be RLS's job happens explicitly here
// (vendor_bookings carries no UPDATE policy for the status column outside the
// vendor's own agreement/document fields — see
// supabase/migrations/20260806140000_vendor_self_service.sql), then every
// read/write goes through the service-role admin client.
// ---------------------------------------------------------------------------

async function assertCanManageVendors(showId: string): Promise<void> {
  const profile = await getStaffProfile();
  if (!profile) throw new Error('Not signed in.');

  // Mirrors sales/data/mutations.ts's assertCanRefund: the account owner (and
  // a SuperAdmin impersonating them) always has full authority over their own
  // show's vendors, regardless of the per-person canManageVendors grant.
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
  showId: string
): Promise<{ id: string; status: string | null }> {
  const { data: booking, error } = await admin
    .from('vendor_bookings')
    .select('id, show_id, status')
    .eq('id', bookingId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (booking?.show_id !== showId) throw new Error('Vendor booking not found for this show.');
  if (booking.status !== 'pending') {
    throw new Error(`This application is already ${booking.status ?? 'pending'} — nothing to review.`);
  }
  return booking;
}

/** Approves a pending application, unlocking createVendorCheckoutSession for the vendor. */
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

  revalidatePath('/dashboard/users');
}

/** Rejects a pending application. Terminal — a rejected booking is not reconsidered through this action. */
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

  revalidatePath('/dashboard/users');
}
