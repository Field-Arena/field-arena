-- Score Type parity with legacy's Scoring Catalog.
--
-- Legacy tagged any catalog sheet without an explicit governing body as USDF
-- when its title names a USDF-run class (sport horse / DSH, breeding,
-- prospects, Materiale, seat equitation/medal, handler, group and
-- championship classes), and USEF otherwise (superadmin.html:2761). Our
-- import tagged all of them USEF, so the USDF tab showed 0 instead of 13.
-- Same title rule, applied once to the non-FEI rows. Re-runnable.
update public.scoring_catalog
   set governing_body = 'USDF'
 where governing_body = 'USEF'
   and title ~* '(sport horse|dsh |breeding|prospect|materiale|seat|dse|dsm|handler|group class|championship)';
