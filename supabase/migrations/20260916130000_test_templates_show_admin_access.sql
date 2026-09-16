-- test_templates is an org-wide reusable test library (no show_id column —
-- see 20260727120700_scoring.sql), so its RLS policy only ever admitted the
-- org's actual Organizer/owner via can_access_org(org_id). Every sibling
-- show-scoped table (documents, scores, ...) also admits a Show Admin
-- staffed on the relevant show via has_show_permission/has_staff_assignment,
-- but test_templates had no equivalent path since it carries no show_id to
-- check a staff assignment against. A Show Admin building a test in the
-- Test Builder (reached from a specific show) hit "new row violates row
-- level security policy" on save as a result.
--
-- Fix: admit a user who is staffed as 'Show Admin' on ANY show belonging to
-- this org — test templates are a shared library across the org's shows,
-- so Show Admin access to the org's template library follows the same
-- shape as their access to any one show, just not scoped to a single show.
create or replace function public.can_manage_org_test_templates(target_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.can_access_org(target_org_id)
      or exists (
        select 1
        from public.staff_assignments sa
        join public.shows s on s.id = sa.show_id
        where s.org_id = target_org_id
          and sa.role = 'Show Admin'
          and (
            sa.user_id = auth.uid()
            or lower(sa.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
          )
      );
$$;

drop policy if exists test_templates_all on public.test_templates;
create policy test_templates_all on public.test_templates
  for all using (public.can_manage_org_test_templates(org_id))
  with check (public.can_manage_org_test_templates(org_id));
