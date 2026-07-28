-- Deduplicates seeded rows and adds the unique constraints that make
-- supabase/seed.sql genuinely re-runnable.
--
-- The bug this corrects: seed.sql used `on conflict do nothing` on tables that
-- had no matching unique constraint. That clause only suppresses an insert when
-- a real constraint is violated, so with nothing to violate every re-run
-- appended a fresh copy of every row. Running the seed three times left three
-- times the classes, divisions, add-ons, qualifying types, vendor items, staff
-- assignments, members, catalog sheets and leads. Organizations, venues and
-- shows were unaffected because they carry explicit primary keys and used
-- `on conflict (id) do nothing`, which does have a constraint to violate.
--
-- The constraints below are not scaffolding for the seed — each is a domain rule
-- worth enforcing regardless. Two classes with the same label in one show, or two
-- staff rows for the same email on one show, are data errors however they arrive.

-- ---------------------------------------------------------------------------
-- Deduplicate, keeping the earliest row of each group
-- ---------------------------------------------------------------------------
-- ctid is the physical row identifier, which is the only tiebreaker available
-- for tables whose duplicate rows are otherwise identical.
delete from public.divisions d
using public.divisions keep
where d.show_id = keep.show_id
  and d.name = keep.name
  and d.ctid > keep.ctid;

delete from public.classes c
using public.classes keep
where c.show_id = keep.show_id
  and c.label = keep.label
  and c.ctid > keep.ctid;

delete from public.add_ons a
using public.add_ons keep
where a.show_id = keep.show_id
  and a.name = keep.name
  and a.ctid > keep.ctid;

delete from public.qual_types q
using public.qual_types keep
where q.show_id = keep.show_id
  and q.name = keep.name
  and q.ctid > keep.ctid;

delete from public.vendor_items v
using public.vendor_items keep
where v.show_id = keep.show_id
  and v.name = keep.name
  and v.ctid > keep.ctid;

delete from public.staff_assignments s
using public.staff_assignments keep
where s.show_id = keep.show_id
  and lower(s.email) = lower(keep.email)
  and s.ctid > keep.ctid;

delete from public.member_database m
using public.member_database keep
where m.org_id = keep.org_id
  and lower(m.email) = lower(keep.email)
  and m.ctid > keep.ctid;

delete from public.scoring_catalog sc
using public.scoring_catalog keep
where sc.title = keep.title
  and coalesce(sc.discipline, '') = coalesce(keep.discipline, '')
  and coalesce(sc.governing_body, '') = coalesce(keep.governing_body, '')
  and sc.ctid > keep.ctid;

delete from public.leads l
using public.leads keep
where lower(l.org_name) = lower(keep.org_name)
  and l.ctid > keep.ctid;

-- Entries orphaned by the class dedupe above. class_entries has an ON DELETE
-- CASCADE to classes so these are already gone, but the statement is harmless
-- and documents the dependency.
delete from public.class_entries ce
where not exists (select 1 from public.classes c where c.id = ce.class_id);

-- ---------------------------------------------------------------------------
-- Constraints
-- ---------------------------------------------------------------------------
create unique index divisions_show_name_key on public.divisions (show_id, name);
create unique index classes_show_label_key on public.classes (show_id, label);
create unique index add_ons_show_name_key on public.add_ons (show_id, name);
create unique index qual_types_show_name_key on public.qual_types (show_id, name);
create unique index vendor_items_show_name_key on public.vendor_items (show_id, name);

-- email is nullable on both of these — a partial index leaves rows without an
-- email unconstrained rather than collapsing them all into one NULL group.
create unique index staff_assignments_show_email_key
  on public.staff_assignments (show_id, lower(email))
  where email is not null;

create unique index member_database_org_email_key
  on public.member_database (org_id, lower(email))
  where email is not null;

create unique index scoring_catalog_identity_key
  on public.scoring_catalog (title, coalesce(discipline, ''), coalesce(governing_body, ''));

create unique index leads_org_name_key on public.leads (lower(org_name));
