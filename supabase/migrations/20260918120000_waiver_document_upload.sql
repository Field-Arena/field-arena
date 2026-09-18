-- Client feedback: the waiver text box doesn't fit/preserve a full USEF PDF
-- document when pasted. Lets an organizer attach the real document instead;
-- shown alongside the typed waiver text wherever a rider signs it.
alter table public.shows
  add column waiver_document_path text,
  add column waiver_document_name text;
