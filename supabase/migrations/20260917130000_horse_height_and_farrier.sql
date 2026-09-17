-- Client feedback: "Horse height and farrier also need to be added to the
-- rider entry information" — two more free-text fields alongside the
-- existing stable/trainer/trainer_phone, editable by the rider the same way.
alter table public.horses
  add column height text,
  add column farrier text;
