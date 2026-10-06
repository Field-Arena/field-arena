-- Payments follow-ups to the 2026-10-02 audit (H11, H13, H14, webhook events,
-- add-on oversell flag). Re-runnable: every statement is guarded.
--
-- None of the new columns are added to the column-level SELECT grants from
-- 20260907120000_fix_money_column_privileges.sql, so `authenticated`/`anon`
-- cannot read them — they are written and read only by server code through
-- the service-role client. vendor_bookings UPDATE is already column-scoped
-- (20260806140000), so vendors cannot write them either.

-- ---------------------------------------------------------------------------
-- H13: vendor bookings get a 'review' status.
-- Set when Stripe reports a paid session whose amount does not match what the
-- booking was priced at (or a payment lands on a rejected / superseded
-- checkout). A booking in 'review' is not payable, so the vendor cannot pay a
-- second time while the organizer reconciles the first payment.
-- The original inline check got Postgres' default name.
-- ---------------------------------------------------------------------------
alter table public.vendor_bookings drop constraint if exists vendor_bookings_status_check;
alter table public.vendor_bookings add constraint vendor_bookings_status_check
  check (status in ('pending', 'approved', 'rejected', 'paid', 'review'));

-- ---------------------------------------------------------------------------
-- H14: what the booking was priced at when its Checkout Session was created.
-- {sessionId, total, feeTotal, currency, items[{label, vendorItemId, qty,
-- unitPrice, amount}], pricedAt}. Payment is matched and recorded against
-- this snapshot, not against today's vendor_items prices, and the invoice
-- shows these lines (the price actually paid).
-- ---------------------------------------------------------------------------
alter table public.vendor_bookings add column if not exists checkout_snapshot jsonb;

-- ---------------------------------------------------------------------------
-- Free-text "needs a human" flag on a sale: a dispute was opened, a refund
-- was made outside the app, a transfer reversal failed, or an add-on was
-- oversold at fulfilment. Null = nothing to look at.
-- ---------------------------------------------------------------------------
alter table public.orders add column if not exists review_reason text;
alter table public.vendor_bookings add column if not exists review_reason text;

-- ---------------------------------------------------------------------------
-- H11: per-refund audit trail. One entry per in-app refund:
-- {refundId, amount, createdAt, transferId, transferReversalId, reversalError}.
-- Lets a failed transfer reversal (organizer balance too low, etc.) be
-- reconciled later without losing the fact that the refund itself happened.
-- ---------------------------------------------------------------------------
alter table public.orders add column if not exists refund_log jsonb not null default '[]'::jsonb;
alter table public.vendor_bookings add column if not exists refund_log jsonb not null default '[]'::jsonb;

-- Atomic append, so two refunds landing at once cannot overwrite each
-- other's log entry (a read-modify-write from the app could).
create or replace function public.append_sale_refund_log(
  p_sale_type text,
  p_sale_id uuid,
  p_entry jsonb
) returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if p_sale_type = 'order' then
    update public.orders
       set refund_log = coalesce(refund_log, '[]'::jsonb) || jsonb_build_array(p_entry)
     where id = p_sale_id;
  elsif p_sale_type = 'vendor_booking' then
    update public.vendor_bookings
       set refund_log = coalesce(refund_log, '[]'::jsonb) || jsonb_build_array(p_entry)
     where id = p_sale_id;
  else
    raise exception 'append_sale_refund_log: unknown sale type %', p_sale_type;
  end if;
end;
$$;

revoke all on function public.append_sale_refund_log(text, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.append_sale_refund_log(text, uuid, jsonb) to service_role;

-- Webhook lookups by PaymentIntent (charge.refunded, charge.dispute.created).
create index if not exists orders_stripe_payment_intent_id_idx
  on public.orders (stripe_payment_intent_id);
create index if not exists vendor_bookings_stripe_payment_intent_id_idx
  on public.vendor_bookings (stripe_payment_intent_id);
