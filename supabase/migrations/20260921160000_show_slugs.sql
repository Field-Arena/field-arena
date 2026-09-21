-- Human-readable show URLs. Nullable during backfill, unique once set (a
-- partial index so it never blocks an INSERT that hasn't generated one yet
-- — app code always generates one at creation time, this is defense only).
alter table public.shows add column slug text;

create unique index shows_slug_unique_idx on public.shows (slug) where slug is not null;

-- Backfill every existing row: lowercase/hyphenate the name, then
-- de-duplicate with a numeric suffix (shows.name has no uniqueness
-- constraint at all — duplicate names already exist in real data).
with base as (
  select id, created_at,
    regexp_replace(regexp_replace(lower(trim(name)), '[^a-z0-9]+', '-', 'g'), '^-+|-+$', '', 'g') as base_slug
  from public.shows
),
numbered as (
  select id,
    case when row_number() over (partition by base_slug order by created_at, id) = 1
      then coalesce(nullif(base_slug, ''), 'show')
      else coalesce(nullif(base_slug, ''), 'show') || '-' || row_number() over (partition by base_slug order by created_at, id)
    end as slug
  from base
)
update public.shows s set slug = n.slug from numbered n where n.id = s.id;
