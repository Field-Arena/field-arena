'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/shared/lib/supabase/server';
import { env } from '@/shared/lib/env';
import { ROUTES } from '@/shared/constants/routes';
import { loginSchema, requestPasswordResetSchema } from '../schemas';

/**
 * Signs in with email and password.
 *
 * Returns the destination path rather than calling redirect() itself. Throwing
 * the NEXT_REDIRECT control-flow error from inside a Server Action invoked by a
 * TanStack mutation surfaces as an onError, so the caller would show a failure
 * toast for a successful login. The client navigates instead.
 */
export async function signInWithPassword(input: unknown): Promise<{ redirectTo: string }> {
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
    throw new Error(error.message);
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
      throw new Error(
        'This account is not set up on Field & Arena yet. Ask your organizer or a platform admin to invite you.'
      );
    }

    if (rider) {
      revalidatePath('/', 'layout');
      return { redirectTo: ROUTES.home };
    }
  }

  revalidatePath('/', 'layout');
  return { redirectTo: ROUTES.dashboard };
}

export async function signOut(): Promise<void> {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
}

export async function requestPasswordReset(input: unknown): Promise<void> {
  const { email } = requestPasswordResetSchema.parse(input);

  const supabase = await createServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${env.siteUrl}${ROUTES.authCallback}?next=/dashboard`,
  });

  /**
   * Errors are swallowed on purpose. Reporting "no such user" here would turn
   * this endpoint into an account-enumeration oracle, so the caller always sees
   * the same "check your inbox" outcome whether or not the address exists.
   */
  if (error) {
    console.error('[auth] password reset request failed', error.message);
  }
}
