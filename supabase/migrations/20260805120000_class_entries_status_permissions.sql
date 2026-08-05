-- class_entries_write only ever checked 'canEnterScores', which is correct
-- for judge_pct writes but wrong for scratchEntry's status-only update
-- (src/modules/shows/data/mutations.ts). Scratch/skip/eliminate are their
-- own permissions (canScratch/canSkip/canEliminate — see
-- src/shared/constants/permissions.ts), granted independently of score
-- entry: a Show Admin or ShowStaff member can be trusted to scratch a rider
-- without ever being handed the scoresheet, and legacy kept these as
-- separate grants for exactly that reason. Under the old policy, anyone
-- holding only the scratch-family permissions (no canEnterScores) had a
-- "Scratch" action that rendered but silently failed the RLS check on
-- submit.
--
-- OR-ing the four permissions together is additive only: everyone who could
-- write class_entries before (canEnterScores) still can. This does not
-- narrow score-entry access down to a status-only check — canEnterScores
-- still independently allows the full row, judge_pct included.
drop policy if exists class_entries_write on public.class_entries;
create policy class_entries_write on public.class_entries
  for all using (
    exists (
      select 1 from public.classes c where c.id = class_id
        and (
          public.has_show_permission(c.show_id, 'canEnterScores')
          or public.has_show_permission(c.show_id, 'canScratch')
          or public.has_show_permission(c.show_id, 'canSkip')
          or public.has_show_permission(c.show_id, 'canEliminate')
        )
    )
  )
  with check (
    exists (
      select 1 from public.classes c where c.id = class_id
        and (
          public.has_show_permission(c.show_id, 'canEnterScores')
          or public.has_show_permission(c.show_id, 'canScratch')
          or public.has_show_permission(c.show_id, 'canSkip')
          or public.has_show_permission(c.show_id, 'canEliminate')
        )
    )
  );
