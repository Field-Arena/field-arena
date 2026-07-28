'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/shared/lib/supabase/server';
import { env } from '@/shared/lib/env';
import { ROUTES } from '@/shared/constants/routes';
import {
  loginSchema,
  requestPasswordResetSchema,
  signUpSchema,
  verifyEmailSchema,
} from '../schemas';
import type { SignUpOutcome, VerifyOutcome, ResendOutcome, LoginOutcome } from '../types';

/**
 * Runs a Supabase auth call that sends an email, turning a transport failure
 * into something the form can show.
 *
 * These calls block while Supabase's built-in mail service delivers: measured at
 * ~12.6s for sign-up against ~0.5s for a call that sends nothing. When that
 * delivery stalls, the request dies at the socket with "fetch failed" — which is
 * not a Supabase error object, so it escaped the `error` branch below, bubbled
 * out of the server action, and reached the browser as a bare 500 with no
 * message. The visitor saw a spinner stop and nothing else.
 *
 * The underlying slowness is a configuration problem, not a code one: the
 * project has no custom SMTP, so it is on Supabase's shared testing sender.
 * Until that is set, this at least fails legibly.
 */
const MAIL_UNREACHABLE =
  'We could not reach the email service just now. Wait a moment and try again.';

/**
 * Supabase's auth errors are written for a developer reading a log, not for
 * someone stuck on a form. Two come up constantly and both read as faults when
 * they are not, so they get plain wording; anything else is passed through
 * unchanged rather than guessed at.
 */
function readableAuthError(message: string): string {
  if (/rate limit/i.test(message)) {
    return 'Too many emails have gone to this address recently. Try again in an hour.';
  }
  if (/expired|invalid/i.test(message)) {
    return 'That code is wrong or has expired. Check the latest email, or send a new code.';
  }
  return message;
}

async function withMailTransport<T>(
  label: string,
  run: () => Promise<T>
): Promise<{ ok: true; value: T } | { ok: false; message: string }> {
  try {
    return { ok: true, value: await run() };
  } catch (cause) {
    console.error(`[auth] ${label} transport failure`, cause);
    return { ok: false, message: MAIL_UNREACHABLE };
  }
}

/**
 * Signs in with email and password.
 *
 * Returns the destination path rather than calling redirect() itself. Throwing
 * the NEXT_REDIRECT control-flow error from inside a Server Action invoked by a
 * TanStack mutation surfaces as an onError, so the caller would show a failure
 * toast for a successful login. The client navigates instead.
 */
export async function signInWithPassword(input: unknown): Promise<LoginOutcome> {
  const { email, password } = loginSchema.parse(input);

  const supabase = await createServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    /**
     * Supabase returns a deliberately vague "Invalid login credentials" for both
     * a wrong password and a non-existent account, so the form cannot be used to
     * enumerate which emails have accounts. That vagueness is preserved — it is
     * passed through rather than helpfully rewritten into something like
     * "no account with that email".
     */
    return { status: 'error', message: error.message };
  }

  /**
   * An authenticated user with no profile row cannot do anything: every RLS
   * policy resolves the caller's role through public.users or public.riders, so
   * a profile-less session sees zero rows everywhere and the dashboard renders
   * empty with no explanation. Detected here so the message is accurate.
   *
   * This is a real state, not a hypothetical: the six accounts that predate the
   * schema rebuild are all in it.
   */
  const userId = data.user.id;
  {
    const [{ data: staff }, { data: rider }] = await Promise.all([
      supabase.from('users').select('id').eq('id', userId).maybeSingle(),
      supabase.from('riders').select('id').eq('id', userId).maybeSingle(),
    ]);

    if (!staff && !rider) {
      await supabase.auth.signOut();
      return {
        status: 'error',
        message:
          'This account is not set up on Field & Arena yet. Ask your organizer or a platform admin to invite you.',
      };
    }

    if (rider) {
      revalidatePath('/', 'layout');
      return { status: 'done', redirectTo: ROUTES.home };
    }
  }

  revalidatePath('/', 'layout');
  return { status: 'done', redirectTo: ROUTES.dashboard };
}

/**
 * Ensures the signed-in account has a rider profile, and reports where to land.
 *
 * Self-service sign-up creates a RIDER, never staff. That is not an arbitrary
 * choice: signInWithPassword above signs out any account with no row in
 * public.users or public.riders, and staff rows carry an org and a platform role
 * that only an organizer or platform admin can legitimately grant. A public form
 * that minted staff accounts would let anyone assign themselves a role. Riders
 * are the self-provisioned identity — the legacy app drew the same line.
 *
 * Insert runs under the new user's own session, which is what
 * riders_insert_self (id = auth.uid()) requires; the service-role key is not
 * needed and is deliberately not used.
 */
async function ensureRiderProfile(userId: string, email: string): Promise<string> {
  const supabase = await createServerClient();

  const { data: existingStaff } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  // An invited staff member who happens to sign up with the same address keeps
  // their staff account — creating a rider row alongside it would give one
  // person two identities and an ambiguous landing page.
  if (existingStaff) {
    revalidatePath('/', 'layout');
    return ROUTES.dashboard;
  }

  const { data: existingRider } = await supabase
    .from('riders')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (!existingRider) {
    const { error } = await supabase.from('riders').insert({ id: userId, email });
    if (error) throw new Error(error.message);
  }

  revalidatePath('/', 'layout');
  return ROUTES.home;
}

/**
 * Creates an account with email and password.
 *
 * Whether a session comes back depends on the project's email-confirmation
 * setting, so both outcomes are handled rather than assumed — see SignUpOutcome.
 */
export async function signUpWithPassword(input: unknown): Promise<SignUpOutcome> {
  const { email, password } = signUpSchema.parse(input);

  const supabase = await createServerClient();
  const attempt = await withMailTransport('sign-up', () =>
    supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${env.siteUrl}${ROUTES.authCallback}` },
    })
  );
  if (!attempt.ok) return { status: 'error', message: attempt.message };

  const { data, error } = attempt.value;
  if (error) return { status: 'error', message: readableAuthError(error.message) };

  /**
   * An address that already has an account.
   *
   * Supabase does not say so outright — that would let this form be used to
   * discover which addresses are registered. It returns a normal-looking user
   * with an EMPTY identities array instead, and sends nothing. Without this
   * check the flow advanced to the verify step and waited for a code that was
   * never sent, which reads as a broken product rather than "you already have
   * an account". Nothing is leaked by handling it: the caller supplied the
   * address, and the message offers sign-in rather than confirming anything a
   * stranger could use.
   */
  if (data.user && data.user.identities?.length === 0) {
    return { status: 'exists' };
  }

  if (!data.session || !data.user) {
    return { status: 'verify', email };
  }

  return { status: 'done', redirectTo: await ensureRiderProfile(data.user.id, email) };
}

/** Exchanges the six-digit email code for a session. */
export async function verifyEmailCode(input: unknown): Promise<VerifyOutcome> {
  const { email, token } = verifyEmailSchema.parse(input);

  const supabase = await createServerClient();
  const attempt = await withMailTransport('verify-code', () =>
    supabase.auth.verifyOtp({ email, token, type: 'email' })
  );
  if (!attempt.ok) return { status: 'error', message: attempt.message };

  const { data, error } = attempt.value;

  /**
   * A wrong or stale code is the single most likely outcome here, so it gets
   * plain wording rather than Supabase's "Token has expired or is invalid",
   * which does not tell someone who mistyped one digit what to do next.
   */
  if (error) return { status: 'error', message: readableAuthError(error.message) };
  if (!data.user) {
    return { status: 'error', message: 'That code did not check out. Send a new one and retry.' };
  }

  return { status: 'done', redirectTo: await ensureRiderProfile(data.user.id, email) };
}

/** Sends a fresh six-digit code to an account that has not confirmed yet. */
export async function resendEmailCode(input: unknown): Promise<ResendOutcome> {
  const { email } = requestPasswordResetSchema.parse(input);

  const supabase = await createServerClient();
  const attempt = await withMailTransport('resend-code', () =>
    supabase.auth.resend({ type: 'signup', email })
  );
  if (!attempt.ok) return { status: 'error', message: attempt.message };

  const { error } = attempt.value;
  if (error) return { status: 'error', message: readableAuthError(error.message) };
  return { status: 'sent' };
}

export async function signOut(): Promise<void> {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
}

export async function requestPasswordReset(input: unknown): Promise<void> {
  const { email } = requestPasswordResetSchema.parse(input);

  const supabase = await createServerClient();
  const attempt = await withMailTransport('password-reset', () =>
    supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${env.siteUrl}${ROUTES.authCallback}?next=/dashboard`,
    })
  );
  const error = attempt.ok ? attempt.value.error : new Error(attempt.message);

  /**
   * Errors are swallowed on purpose. Reporting "no such user" here would turn
   * this endpoint into an account-enumeration oracle, so the caller always sees
   * the same "check your inbox" outcome whether or not the address exists.
   */
  if (error) {
    console.error('[auth] password reset request failed', error.message);
  }
}
