-- Legacy's Scoring Catalog seeds "Freestyle — RGD" (superadmin.html:1208,
-- source 2023_FS_RGD_final_10_24.pdf) as an unassigned stub; our import
-- skipped it, so the catalog had 89 sheets instead of legacy's 90. Added as
-- the same stub (no governing body in legacy → USEF by its title rule).
-- Re-runnable.
insert into public.scoring_catalog
  (title, level, discipline, family, governing_body, source, source_file, def)
select 'Freestyle — RGD', 'Freestyle', 'Dressage', 'unassigned', 'USEF',
       'legacy-import', 's-2023_FS_RGD_final_10_24', '{}'::jsonb
 where not exists (
   select 1 from public.scoring_catalog where source_file = 's-2023_FS_RGD_final_10_24'
 );
