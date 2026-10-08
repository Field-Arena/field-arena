-- Link existing classes to their official Scoring Catalog sheet.
--
-- Legacy saved the catalog id on every class added from an official test
-- (showbuilder.html saveBulkSelection → catalogId) and, when scoring a class
-- with no class_tests row, seeded it from that sheet — so official tests
-- never needed Test Builder; only custom / Test of Choice / independent
-- classes did. Our Select Events now sets classes.catalog_id on add
-- (addCatalogGroup → test-catalog.ts OFFICIAL_SHEETS); this backfills every
-- class created before that, across all shows.
--
-- Conservative and re-runnable:
--   * only classes whose catalog_id is still null are touched;
--   * Test of Choice and custom classes are skipped;
--   * a class matches by (group, test) parsed from "Group — Test[ — Division]",
--     else by its whole label (then display_name) as an exact normalized test
--     name — never a substring or fuzzy match;
--   * names shared by more than one official test (e.g. Sport Horse
--     "Prospect (in hand)", Individual vs Master Class) are left out of the
--     name table, so they only link when the group says which one;
--   * a sheet is used only when exactly one scoring_catalog row carries that
--     source_file and its def has something to score.
-- Normalization matches test-catalog.ts normalizeTestName: drop a trailing
-- " (YYYY)", collapse whitespace, trim, lower-case.
--
-- The tables below are generated from src/modules/shows/test-catalog.ts
-- (TEST_CATALOG + the FM_SETS USEF/USDF spellings); keep them in step.
-- A class_tests row (Test Builder assignment) still wins over catalog_id at
-- scoring time, so this never overrides a test an organizer assigned.

-- classes_write_permission checks the caller's show permissions, and a
-- migration has no signed-in caller, so it would refuse this backfill. The
-- trigger is switched off for this statement only and back on right after;
-- the migration runner applies the file in one transaction, so no other
-- write can slip through while it is off.
alter table public.classes disable trigger classes_write_permission_check;

with key_map (group_key, test_key, source_file) as (
  values
    ('prix st. georges', 'prix st. georges', 's-Prix_St__Georges_2026'),
    ('intermediate a', 'intermediate a', 's-Intermediate_A_2026'),
    ('intermediate b', 'intermediate b', 's-Intermediate_B_2026'),
    ('intermediate i', 'intermediate i', 's-Intermediate_I_2026_0'),
    ('intermediate i', 'intermediate i freestyle', 's-Intermediate_I_Freestyle_2022'),
    ('grand prix', 'grand prix', 's-Grand_Prix_2026_0'),
    ('grand prix', 'grand prix freestyle', 's-Grand_Prix_Freestyle_2022'),
    ('introductory', 'introductory test a', 's-2023_Intro_A'),
    ('introductory', 'introductory test b', 's-2023_Intro_B'),
    ('introductory', 'introductory test c', 's-2023_Intro_C'),
    ('training level', 'training level test 1', 's-2023_Training_1_4_7'),
    ('training level', 'training level test 2', 's-2023_Training_2_4_7'),
    ('training level', 'training level test 3', 's-2023_Training_3_4_7'),
    ('first level', 'first level test 1', 's-2023_First_Level_Test_1_4_12'),
    ('first level', 'first level test 2', 's-2023_First_Level_Test_2_8_30'),
    ('first level', 'first level test 3', 's-2023_First_Level_Test_3_10_4'),
    ('second level', 'second level test 1', 's-2023_Second_Level_Test_1_8_30'),
    ('second level', 'second level test 2', 's-2023_Second_Level_Test_2_8_30'),
    ('second level', 'second level test 3', 's-2023_Second_Level_Test_3_4_20'),
    ('third level', 'third level test 1', 's-2023_Third_Level_Test_1_8_30'),
    ('third level', 'third level test 2', 's-2023_Third_Level_Test_2_4_20'),
    ('third level', 'third level test 3', 's-2023_Third_Level_Test_3'),
    ('fourth level', 'fourth level test 1', 's-2023_Fourth_Level_Test_1__8_30'),
    ('fourth level', 'fourth level test 2', 's-2023_Fourth_Level_Test_2'),
    ('fourth level', 'fourth level test 3', 's-2023_Fourth_Level_Test_3_10_1'),
    ('freestyle', 'training level', 's-2023_Freestyle_Training_Level'),
    ('freestyle', 'first level', 's-2023_Freestyle_First_Level'),
    ('freestyle', 'second level', 's-2023_Freestyle_Second_Level'),
    ('freestyle', 'third level', 's-2023_Freestyle_Third_Level'),
    ('freestyle', 'fourth level', 's-2023_Freestyle_Fourth_Level'),
    ('pas de deux', 'pas de deux', 's-2023_Pas_de_Deux'),
    ('quadrille', 'introductory level', 's-Quad_Introductory_Level_Test'),
    ('quadrille', 'training level', 's-Quad_Training_Level_Test'),
    ('quadrille', 'first level', 's-Quad_First_Level_Test'),
    ('quadrille', 'second level', 's-Quad_Second_Level_Test'),
    ('quadrille', 'third level', 's-Quad_Third_Level_Test'),
    ('quadrille', 'freestyle', 's-Quadrille_Freestyle'),
    ('individual class', 'prospect (in hand)', 's-2023_USDF_Dressage_Sport_Horse_Prospects_InHand'),
    ('individual class', 'breeding stock (in hand)', 's-2023_USDF_Dressage_Sport_Horse_Breeding_Stock_InHand'),
    ('individual class', 'group class (in hand)', 's-2023_USDF_Dressage_Sport_Horse_Group_Class'),
    ('individual class', 'prospect (under saddle)', 's-2023_USDF_Dressage_Sport_Horse_Prospects_Under_Saddle'),
    ('master class', 'prospect (in hand)', 's-2023_USDF_Dressage_Sport_Horse_Prospect_In_Hand_Master'),
    ('master class', 'breeding stock (in hand)', 's-2023_USDF_Dressage_Sport_Horse_Breeding_Stock_In_Hand_Master'),
    ('master class', 'group class (in hand)', 's-2023_USDF_Dressage_Sport_Horse_Group_Class_Master'),
    ('master class', 'prospect (under saddle)', 's-2023_USDF_Dressage_Sport_Horse_Prospect_Under_Saddle_Master'),
    ('championship', 'sport horse championship class', 's-2023_USDF_Dressage_Sport_Horse_Championship_Class_Sheet'),
    ('materiale', 'sport horse materiale class', 's-2023_Materiale_Scoresheet'),
    ('handler', 'amateur / junior / young rider handler', 's-2023_Amateur_Jr_YRHandler_scoresheet'),
    ('equitation', 'dressage seat equitation', 's-2023_DSE_Score_Sheet'),
    ('dressage seat medals', 'dressage seat medals', 's-2023_DSM_Score_Sheet'),
    ('young horse', 'four-year-old dressage test', 's-2023_FourYearOld_Dressage_test'),
    ('developing horse', 'prix st. georges, 7-9yo', 's-2023_Developing_Horse_Prix_St_George'),
    ('developing horse', 'grand prix, 8-10yo', 's-2023_Developing_Horse_Grand_Prix'),
    ('introductory', 'introductory level test a', 's-2023_Intro_A'),
    ('introductory', 'introductory level test b', 's-2023_Intro_B'),
    ('introductory', 'introductory level test c', 's-2023_Intro_C'),
    ('training', 'training level test 1', 's-2023_Training_1_4_7'),
    ('training', 'training level test 2', 's-2023_Training_2_4_7'),
    ('training', 'training level test 3', 's-2023_Training_3_4_7'),
    ('training', 'training level freestyle', 's-2023_Freestyle_Training_Level'),
    ('first', 'first level test 1', 's-2023_First_Level_Test_1_4_12'),
    ('first', 'first level test 2', 's-2023_First_Level_Test_2_8_30'),
    ('first', 'first level test 3', 's-2023_First_Level_Test_3_10_4'),
    ('first', 'first level freestyle', 's-2023_Freestyle_First_Level'),
    ('second', 'second level test 1', 's-2023_Second_Level_Test_1_8_30'),
    ('second', 'second level test 2', 's-2023_Second_Level_Test_2_8_30'),
    ('second', 'second level test 3', 's-2023_Second_Level_Test_3_4_20'),
    ('second', 'second level freestyle', 's-2023_Freestyle_Second_Level'),
    ('third', 'third level test 1', 's-2023_Third_Level_Test_1_8_30'),
    ('third', 'third level test 2', 's-2023_Third_Level_Test_2_4_20'),
    ('third', 'third level test 3', 's-2023_Third_Level_Test_3'),
    ('third', 'third level freestyle', 's-2023_Freestyle_Third_Level'),
    ('fourth', 'fourth level test 1', 's-2023_Fourth_Level_Test_1__8_30'),
    ('fourth', 'fourth level test 2', 's-2023_Fourth_Level_Test_2'),
    ('fourth', 'fourth level test 3', 's-2023_Fourth_Level_Test_3_10_1'),
    ('fourth', 'fourth level freestyle', 's-2023_Freestyle_Fourth_Level')
),
name_map (name_key, source_file) as (
  values
    ('prix st. georges', 's-Prix_St__Georges_2026'),
    ('intermediate a', 's-Intermediate_A_2026'),
    ('intermediate b', 's-Intermediate_B_2026'),
    ('intermediate i', 's-Intermediate_I_2026_0'),
    ('intermediate i freestyle', 's-Intermediate_I_Freestyle_2022'),
    ('grand prix', 's-Grand_Prix_2026_0'),
    ('grand prix freestyle', 's-Grand_Prix_Freestyle_2022'),
    ('introductory test a', 's-2023_Intro_A'),
    ('introductory test b', 's-2023_Intro_B'),
    ('introductory test c', 's-2023_Intro_C'),
    ('training level test 1', 's-2023_Training_1_4_7'),
    ('training level test 2', 's-2023_Training_2_4_7'),
    ('training level test 3', 's-2023_Training_3_4_7'),
    ('first level test 1', 's-2023_First_Level_Test_1_4_12'),
    ('first level test 2', 's-2023_First_Level_Test_2_8_30'),
    ('first level test 3', 's-2023_First_Level_Test_3_10_4'),
    ('second level test 1', 's-2023_Second_Level_Test_1_8_30'),
    ('second level test 2', 's-2023_Second_Level_Test_2_8_30'),
    ('second level test 3', 's-2023_Second_Level_Test_3_4_20'),
    ('third level test 1', 's-2023_Third_Level_Test_1_8_30'),
    ('third level test 2', 's-2023_Third_Level_Test_2_4_20'),
    ('third level test 3', 's-2023_Third_Level_Test_3'),
    ('fourth level test 1', 's-2023_Fourth_Level_Test_1__8_30'),
    ('fourth level test 2', 's-2023_Fourth_Level_Test_2'),
    ('fourth level test 3', 's-2023_Fourth_Level_Test_3_10_1'),
    ('training level freestyle', 's-2023_Freestyle_Training_Level'),
    ('first level freestyle', 's-2023_Freestyle_First_Level'),
    ('second level freestyle', 's-2023_Freestyle_Second_Level'),
    ('third level freestyle', 's-2023_Freestyle_Third_Level'),
    ('fourth level freestyle', 's-2023_Freestyle_Fourth_Level'),
    ('pas de deux', 's-2023_Pas_de_Deux'),
    ('quadrille introductory level', 's-Quad_Introductory_Level_Test'),
    ('quadrille training level', 's-Quad_Training_Level_Test'),
    ('quadrille first level', 's-Quad_First_Level_Test'),
    ('quadrille second level', 's-Quad_Second_Level_Test'),
    ('quadrille third level', 's-Quad_Third_Level_Test'),
    ('quadrille freestyle', 's-Quadrille_Freestyle'),
    ('prospect (in hand) · master class', 's-2023_USDF_Dressage_Sport_Horse_Prospect_In_Hand_Master'),
    ('breeding stock (in hand) · master class', 's-2023_USDF_Dressage_Sport_Horse_Breeding_Stock_In_Hand_Master'),
    ('group class (in hand) · master class', 's-2023_USDF_Dressage_Sport_Horse_Group_Class_Master'),
    ('prospect (under saddle) · master class', 's-2023_USDF_Dressage_Sport_Horse_Prospect_Under_Saddle_Master'),
    ('sport horse championship class', 's-2023_USDF_Dressage_Sport_Horse_Championship_Class_Sheet'),
    ('sport horse materiale class', 's-2023_Materiale_Scoresheet'),
    ('amateur / junior / young rider handler', 's-2023_Amateur_Jr_YRHandler_scoresheet'),
    ('dressage seat equitation', 's-2023_DSE_Score_Sheet'),
    ('dressage seat medals', 's-2023_DSM_Score_Sheet'),
    ('four-year-old dressage test', 's-2023_FourYearOld_Dressage_test'),
    ('developing horse prix st. georges, 7-9yo', 's-2023_Developing_Horse_Prix_St_George'),
    ('developing horse grand prix, 8-10yo', 's-2023_Developing_Horse_Grand_Prix'),
    ('introductory level test a', 's-2023_Intro_A'),
    ('introductory level test b', 's-2023_Intro_B'),
    ('introductory level test c', 's-2023_Intro_C')
),
scorable as (
  select sc.id, sc.source_file
    from public.scoring_catalog sc
   where sc.source_file is not null
     and exists (
       select 1
         from unnest(array['movements', 'collectives', 'technical', 'artistic',
                           'criteria', 'categories']) as k(key)
        where jsonb_typeof(sc.def -> k.key) = 'array'
          and jsonb_array_length(sc.def -> k.key) > 0
     )
),
sheets as (
  select s.source_file, min(s.id::text) as id
    from scorable s
   where (select count(*) from public.scoring_catalog x
           where x.source_file = s.source_file) = 1
   group by s.source_file
),
candidates as (
  select c.id,
         c.group_name,
         string_to_array(c.label, ' — ') as parts,
         lower(btrim(regexp_replace(regexp_replace(c.label, '\s*\(\d{4}\)\s*$', ''),
                                    '\s+', ' ', 'g'))) as label_key,
         lower(btrim(regexp_replace(regexp_replace(coalesce(c.display_name, ''),
                                                   '\s*\(\d{4}\)\s*$', ''),
                                    '\s+', ' ', 'g'))) as display_key
    from public.classes c
   where c.catalog_id is null
     and coalesce(c.event, '') not in ('TOC', 'Custom')
     and c.label not like 'Test of Choice — %'
     and c.label not like 'Custom classes — %'
     and (c.test_options is null
          or jsonb_typeof(c.test_options) <> 'array'
          or jsonb_array_length(c.test_options) = 0)
),
matched as (
  select cand.id,
         coalesce(
           (select km.source_file
              from key_map km
             where cand.group_name is not null
               and cand.parts[1] = cand.group_name
               and cand.parts[2] is not null
               and km.group_key = lower(cand.group_name)
               and km.test_key = lower(btrim(regexp_replace(
                     regexp_replace(cand.parts[2], '\s*\(\d{4}\)\s*$', ''), '\s+', ' ', 'g')))),
           (select nm.source_file from name_map nm where nm.name_key = cand.label_key),
           (select nm.source_file from name_map nm
             where cand.display_key <> '' and nm.name_key = cand.display_key)
         ) as source_file
    from candidates cand
)
update public.classes c
   set catalog_id = s.id
  from matched m
  join sheets s on s.source_file = m.source_file
 where c.id = m.id
   and c.catalog_id is null;

alter table public.classes enable trigger classes_write_permission_check;
