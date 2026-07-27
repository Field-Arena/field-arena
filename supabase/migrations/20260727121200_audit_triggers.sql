-- Enable RLS on the audit ledger and attach the audit trigger to the tables
-- that warrant one.
--
-- This runs last because the policy depends on is_super_admin(), which the RLS
-- migration defines.

alter table public.audit_log enable row level security;

-- Read-only, SuperAdmin-only. There is intentionally no INSERT/UPDATE/DELETE
-- policy: rows enter solely through audit_row_change(), which is SECURITY
-- DEFINER and therefore bypasses RLS. Application code cannot rewrite history
-- even with a valid session.
create policy audit_log_select_super_admin on public.audit_log
  for select to authenticated
  using (public.is_super_admin());

comment on policy audit_log_select_super_admin on public.audit_log is
  'Only SuperAdmin reads the ledger. No write policy exists by design.';

-- Audited tables, and why each one:
--
--   orders, vendor_bookings   real money — refunds and additional charges must
--                             be attributable after the fact
--   scores, class_entries     competition integrity — a changed mark, a scratch
--                             or a disqualification decides placings
--   staff_assignments         permission grants — who gave whom refund or
--                             money-visibility authority
--   users                     role and org changes — privilege escalation
--   organizations             suspension, soft delete, fee model
--   shows                     publish state and waiver approval, both of which
--                             carry legal weight
--
-- Deliberately not audited: high-churn operational tables (divisions, classes,
-- add_ons, the various catalogs). Auditing every schedule tweak would bury the
-- entries above in noise, and none of them is a money or integrity decision.

create trigger orders_audit
  after insert or update or delete on public.orders
  for each row execute function public.audit_row_change();

create trigger vendor_bookings_audit
  after insert or update or delete on public.vendor_bookings
  for each row execute function public.audit_row_change();

create trigger scores_audit
  after insert or update or delete on public.scores
  for each row execute function public.audit_row_change();

create trigger class_entries_audit
  after insert or update or delete on public.class_entries
  for each row execute function public.audit_row_change();

create trigger staff_assignments_audit
  after insert or update or delete on public.staff_assignments
  for each row execute function public.audit_row_change();

create trigger users_audit
  after insert or update or delete on public.users
  for each row execute function public.audit_row_change();

create trigger organizations_audit
  after insert or update or delete on public.organizations
  for each row execute function public.audit_row_change();

create trigger shows_audit
  after insert or update or delete on public.shows
  for each row execute function public.audit_row_change();
