-- Column-level REVOKEs that never took effect, plus the settlement columns
-- that were never protected at all.
--
-- 20260727120900_rls.sql:710-712 tried to hide Stripe identifiers with:
--
--   revoke select (stripe_connect_account_id) on public.organizations from authenticated, anon;
--
-- The intent was right and the comment there explains it correctly: RLS is
-- row-level, so any staff member who can read an organization row can read
-- every column on it. But in Postgres a column-level REVOKE has no effect
-- while the role still holds table-level SELECT — and `authenticated` and
-- `anon` do, on all three tables. Verified against the live database: reading
-- as an ordinary staff session still returned stripe_connect_account_id and
-- orders.stripe_customer_id. All three revokes have been inert since day one.
--
-- The fix is to drop the table-level grant first, then re-grant explicitly by
-- column. Every column is listed except the protected ones, so adding a new
-- column later does NOT silently expose it — it will be unreadable until
-- someone grants it, which fails closed rather than open.
--
-- payout_cadence / holdback_percent are added to the protected set: they are
-- settlement terms between the platform and one organizer, only ever written
-- by SuperAdmin and only ever read by server-side code. They had no legacy
-- precedent and no gate of any kind.

-- ---------------------------------------------------------------- organizations
revoke select on public.organizations from authenticated, anon;

grant select (
  id, name, city, region, country, currency, locale, timezone, avg_entry_value, fee_model,
  email, website, phone, suspended, deleted_at, is_demo, created_at
) on public.organizations to authenticated, anon;

-- ---------------------------------------------------------------------- orders
revoke select on public.orders from authenticated, anon;

grant select (
  id, rider_id, show_id, stripe_payment_intent_id, amount_total, status, items, fee_total,
  refunded_amount, created_at, paid_at, arrival_date, departure_date,
  additional_charges_total, additional_charges
) on public.orders to authenticated, anon;

-- ------------------------------------------------------------- vendor_bookings
revoke select on public.vendor_bookings from authenticated, anon;

grant select (
  id, show_id, name, contact, contact_name, phone, website, products_offered,
  special_requests, status, created_at, stripe_payment_intent_id, paid_at, amount_total,
  fee_total, refunded_amount, additional_charges_total, additional_charges,
  document_uploads, agreement_signed_at, agreement_signed_text, agreement_signed_name
) on public.vendor_bookings to authenticated, anon;

comment on column public.organizations.payout_cadence is
  'Settlement term — SuperAdmin-written, server-read only. SELECT is not granted to authenticated/anon; see 20260907120000.';
comment on column public.organizations.holdback_percent is
  'Settlement term — SuperAdmin-written, server-read only. SELECT is not granted to authenticated/anon; see 20260907120000.';
