-- Judges and scribes can move their own ring forward. Re-runnable.
--
-- Stress test 2026-10-17: in every one of 10,000 rides the judge's own
-- "advance to next rider" was refused ("not authorized to edit this class"),
-- so every ring stalls after its first rider unless an Organizer or Show
-- Admin has the class open. advanceRide marks the ride scored, then moves
-- the class pointer (classes.scoring_pos, and clears working_in_entry_id
-- once a worked-in ride is finished). assert_classes_write_permission sent
-- both changes to permissions panel members don't hold: canEditShow on main,
-- and after 20261002120000 canManageHoldingQueue for working_in_entry_id
-- (scoring_pos was opened to canEnterScores there, which an org can switch
-- off per person while still seating them on a panel).
--
-- This version lets anyone with canEnterScores, or seated as judge or scribe
-- on the class's panel, move the pointer — but only to where the rides say
-- it is. They never get canEditShow and can't park the ring on a rider of
-- their choosing:
--   scoring_pos          must equal class_current_ride_index(): the first
--                        unfinished, non-holding ride in running order (the
--                        same rule as resolveCurrentRideIndex in
--                        src/shared/lib/current-ride.ts).
--   working_in_entry_id  may only be cleared, and only once the worked-in
--                        ride is finished.
-- Show management (canEditShow / canManageHoldingQueue) keeps full control.

-- Is the caller seated on this class's panel (judge or scribe)? Matches the
-- staff identity rules of has_show_permission: user_id, or the invited email
-- from the JWT. Suspended or deleted orgs never match.
create or replace function public.is_class_panel_member(p_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.class_panel cp
    join public.classes c on c.id = cp.class_id
    join public.staff_assignments sa
      on sa.show_id = c.show_id
     and sa.id in (cp.judge_staff_id, cp.scribe_staff_id)
    where cp.class_id = p_class_id
      and public.show_org_is_active(c.show_id)
      and (
        sa.user_id = auth.uid()
        or lower(sa.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      )
  );
$$;

revoke execute on function public.is_class_panel_member(uuid) from public, anon;
grant execute on function public.is_class_panel_member(uuid) to authenticated, service_role;

-- Index (0-based) of the ride in the ring: first ride that is neither
-- advanced past nor in a terminal status, holding entries excluded, ordered
-- like the app (ride_order, then id). Equals the ride count when every ride
-- is finished.
create or replace function public.class_current_ride_index(p_class_id uuid)
returns integer
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with rides as (
    select
      (row_number() over (order by ride_order, id) - 1)::integer as idx,
      coalesce(advanced_past, false) or coalesce(status, 'scheduled') <> 'scheduled' as finished
    from public.class_entries
    where class_id = p_class_id
      and coalesce(holding, false) = false
  )
  select coalesce(
    (select min(idx) from rides where not finished),
    (select count(*)::integer from rides)
  );
$$;

revoke execute on function public.class_current_ride_index(uuid) from public, anon;
grant execute on function public.class_current_ride_index(uuid) to authenticated, service_role;

-- Same body as 20261002120000 except the scoring_pos and working_in_entry_id
-- branches.
create or replace function public.assert_classes_write_permission()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  old_j jsonb := to_jsonb(old);
  new_j jsonb := to_jsonb(new);
begin
  -- The admin client (service role) has already done its own checks.
  if coalesce(auth.role(), '') = 'service_role' then
    return new;
  end if;

  if (old_j - 'scoring_open') = (new_j - 'scoring_open') then
    if not public.can_view_show(new.show_id) then
      raise exception 'not authorized to change scoring status for this class';
    end if;
    return new;
  end if;

  if (old_j - 'scoring_pos') = (new_j - 'scoring_pos') then
    if public.has_show_permission(new.show_id, 'canEditShow') then
      return new;
    end if;
    if not (
      public.has_show_permission(new.show_id, 'canEnterScores')
      or public.is_class_panel_member(new.id)
    ) then
      raise exception 'not authorized to move the ride in the ring for this class';
    end if;
    if new.scoring_pos is distinct from public.class_current_ride_index(new.id) then
      raise exception 'The ring can only move to the next unfinished ride.'
        using errcode = '42501';
    end if;
    return new;
  end if;

  if (old_j - 'working_in_entry_id') = (new_j - 'working_in_entry_id') then
    if public.has_show_permission(new.show_id, 'canManageHoldingQueue') then
      return new;
    end if;
    -- A panel member finishing a worked-in ride hands the ring back to the
    -- running order. Starting or changing a work-in stays with management.
    if new.working_in_entry_id is null
       and old.working_in_entry_id is not null
       and (
         public.has_show_permission(new.show_id, 'canEnterScores')
         or public.is_class_panel_member(new.id)
       )
       and exists (
         select 1 from public.class_entries e
         where e.id = old.working_in_entry_id
           and (coalesce(e.advanced_past, false) or coalesce(e.status, 'scheduled') <> 'scheduled')
       ) then
      return new;
    end if;
    raise exception 'not authorized to manage the holding queue for this class';
  end if;

  if (old_j - 'results_published' - 'results_published_at')
     = (new_j - 'results_published' - 'results_published_at') then
    if not public.has_show_permission(new.show_id, 'canPublishShow') then
      raise exception 'not authorized to publish results for this class';
    end if;
    return new;
  end if;

  if (old_j - 'ring_packet_printed_at') = (new_j - 'ring_packet_printed_at') then
    if not public.has_show_permission(new.show_id, 'canManageEntryLedger') then
      raise exception 'not authorized to record a ring packet print for this class';
    end if;
    return new;
  end if;

  if not public.has_show_permission(new.show_id, 'canEditShow') then
    raise exception 'not authorized to edit this class';
  end if;
  return new;
end;
$$;
