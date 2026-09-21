alter table public.classes
  add column schedule_updated_at timestamptz,
  add column ring_packet_printed_at timestamptz;

alter table public.class_entries
  add column updated_at timestamptz;

-- classes has a BEFORE UPDATE trigger (assert_classes_write_permission,
-- 20260806130000) that field-diffs old/new and requires canEditShow for
-- anything outside its known carve-outs. ring_packet_printed_at is written
-- by a Print Center action gated on canManageEntryLedger -- a permission
-- distinct from canEditShow -- so it needs its own carve-out branch or that
-- write breaks for anyone holding canManageEntryLedger without canEditShow.
-- schedule_updated_at gets NO carve-out: it's always written in the same
-- UPDATE as location/date/min_per_ride by moveClassToRingDay/
-- setClassDuration, so the diff still correctly falls to the existing
-- canEditShow "anything else" branch, unchanged from today.
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
  if (old_j - 'scoring_open') = (new_j - 'scoring_open') then
    if not public.can_view_show(new.show_id) then
      raise exception 'not authorized to change scoring status for this class';
    end if;
    return new;
  end if;

  if (old_j - 'working_in_entry_id') = (new_j - 'working_in_entry_id') then
    if not public.has_show_permission(new.show_id, 'canManageHoldingQueue') then
      raise exception 'not authorized to manage the holding queue for this class';
    end if;
    return new;
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
