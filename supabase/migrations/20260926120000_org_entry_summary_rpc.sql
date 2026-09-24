-- listOrganizations (superadmin console) computed per-org show/entry/rider
-- counts by pulling every shows, classes, and class_entries row on the whole
-- platform into JS and joining them in memory -- the single most expensive
-- query in the app, and the one most likely to fall over first as data
-- grows, since class_entries has no filter of any kind. This does the same
-- aggregation with GROUP BY, returning one small row per org instead of
-- every entry ever created. No security definer: the console already reads
-- these tables directly today, so this keeps the exact same RLS-driven
-- access (SuperAdmin's existing platform-wide read policies) rather than
-- introducing a new, separately-audited privilege path.
create or replace function public.organization_entry_summaries()
returns table (org_id uuid, show_count bigint, entry_count bigint, rider_count bigint)
language sql
stable
as $$
  select
    s.org_id,
    count(distinct s.id) as show_count,
    count(ce.id) as entry_count,
    count(distinct ce.rider) as rider_count
  from public.shows s
  left join public.classes c on c.show_id = s.id
  left join public.class_entries ce on ce.class_id = c.id
  group by s.org_id;
$$;
