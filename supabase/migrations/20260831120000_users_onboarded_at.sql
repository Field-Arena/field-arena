-- Onboard status must mean "finished setting a password," not "clicked the
-- invite link." /auth/confirm calls verifyOtp() to establish a session before
-- the set-password screen ever renders, which sets auth.users.last_sign_in_at
-- immediately on click — so every screen that read last_sign_in_at as a proxy
-- for "onboarded" showed a person as onboard before they had actually set
-- anything up. This column is the real signal: only setPassword() sets it.
alter table public.users add column onboarded_at timestamptz;

comment on column public.users.onboarded_at is
  'Set once the account holder actually finishes setPassword() from an invite/reset flow. Not the same as auth.users.last_sign_in_at, which is set the moment an invite link is clicked (verifyOtp) even if the person never sets a password.';
