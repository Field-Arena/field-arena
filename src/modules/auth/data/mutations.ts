'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { createServerClient } from '@/shared/lib/supabase/server';
import {
  SESSION_PERSISTENCE_COOKIE,
  SESSION_PERSISTENCE_OFF,
} from '@/shared/lib/supabase/session-persistence';
import { env } from '@/shared/lib/env';
import { ROUTES } from '@/shared/constants/routes';
import { MAIL_UNREACHABLE_MESSAGE, NOT_PROVISIONED_MESSAGE } from '@/modules/auth/constants';
import {
  loginSchema,
  requestPasswordResetSchema,
  setPasswordSchema,
  signUpSchema,
  verifyEmailSchema,
  verifySignInCodeSchema,
} from '@/modules/auth/schemas';
import type {
  SignUpOutcome,
  VerifyOutcome,
  ResendOutcome,
  LoginOutcome,
  SignInCodeOutcome,
} from '@/modules/auth/types';

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
  run: () => Promise<T>,
): Promise<{ ok: true; value: T } | { ok: false; message: string }> {
  try {
    return { ok: true, value: await run() };
  } catch (cause) {
    console.error(`[auth] ${label} transport failure`, cause);
    return { ok: false, message: MAIL_UNREACHABLE_MESSAGE };
  }
}

export async function signInWithPassword(input: unknown): Promise<LoginOutcome> {
  const { email, password, remember = true } = loginSchema.parse(input);

  await recordSessionPersistence(remember);

  const supabase = await createServerClient({ persistSession: remember });
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { status: 'error', message: error.message };
  }

  const destination = await provisionedDestination(supabase, data.user.id);
  if (!destination) {
    await supabase.auth.signOut();
    return { status: 'error', message: NOT_PROVISIONED_MESSAGE };
  }
  revalidatePath('/', 'layout');
  return { status: 'done', redirectTo: destination };
}

async function recordSessionPersistence(remember: boolean): Promise<void> {
  const cookieStore = await cookies();

  if (remember) {
    cookieStore.delete(SESSION_PERSISTENCE_COOKIE);
    return;
  }

  cookieStore.set(SESSION_PERSISTENCE_COOKIE, SESSION_PERSISTENCE_OFF, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.siteUrl.startsWith('https://'),
    path: '/',
  });
}

type ServerClient = Awaited<ReturnType<typeof createServerClient>>;

async function provisionedDestination(
  supabase: ServerClient,
  userId: string,
): Promise<string | null> {
  const [{ data: staff }, { data: rider }] = await Promise.all([
    supabase.from('users').select('id').eq('id', userId).maybeSingle(),
    supabase.from('riders').select('id').eq('id', userId).maybeSingle(),
  ]);
  if (staff) return ROUTES.dashboard;

  if (rider) return ROUTES.rider;
  return null;
}

async function landAfterSignup(
  supabase: ServerClient,
  userId: string,
): Promise<{ status: 'done'; redirectTo: string }> {
  const destination = await provisionedDestination(supabase, userId);
  if (!destination) {
    await supabase.auth.signOut();

    return { status: 'done', redirectTo: `${ROUTES.home}?notice=pending_invite` };
  }
  revalidatePath('/', 'layout');
  return { status: 'done', redirectTo: destination };
}

export async function signUpWithPassword(input: unknown): Promise<SignUpOutcome> {
  const { email, password } = signUpSchema.parse(input);

  const supabase = await createServerClient();
  const attempt = await withMailTransport('sign-up', () =>
    supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${env.siteUrl}${ROUTES.authCallback}` },
    }),
  );
  if (!attempt.ok) return { status: 'error', message: attempt.message };

  const { data, error } = attempt.value;
  if (error) return { status: 'error', message: readableAuthError(error.message) };

  if (data.user && data.user.identities?.length === 0) {
    return { status: 'exists' };
  }

  if (!data.session || !data.user) {
    return { status: 'verify', email };
  }

  return landAfterSignup(supabase, data.user.id);
}

export async function setPassword(input: unknown): Promise<VerifyOutcome> {
  const { password } = setPasswordSchema.parse(input);

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      status: 'error',
      message: 'Your session has expired. Open the invite link again to continue.',
    };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { status: 'error', message: readableAuthError(error.message) };

  const metaNext: unknown = user.user_metadata.next;
  const next = typeof metaNext === 'string' ? metaNext : ROUTES.dashboard;

  revalidatePath('/', 'layout');
  return { status: 'done', redirectTo: next };
}

export async function verifyEmailCode(input: unknown): Promise<VerifyOutcome> {
  const { email, token } = verifyEmailSchema.parse(input);

  const supabase = await createServerClient();
  const attempt = await withMailTransport('verify-code', () =>
    supabase.auth.verifyOtp({ email, token, type: 'email' }),
  );
  if (!attempt.ok) return { status: 'error', message: attempt.message };

  const { data, error } = attempt.value;

  if (error) return { status: 'error', message: readableAuthError(error.message) };
  if (!data.user) {
    return { status: 'error', message: 'That code did not check out. Send a new one and retry.' };
  }

  return landAfterSignup(supabase, data.user.id);
}

export async function resendEmailCode(input: unknown): Promise<ResendOutcome> {
  const { email } = requestPasswordResetSchema.parse(input);

  const supabase = await createServerClient();
  const attempt = await withMailTransport('resend-code', () =>
    supabase.auth.resend({ type: 'signup', email }),
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
    }),
  );
  const error = attempt.ok ? attempt.value.error : new Error(attempt.message);

  if (error) {
    console.error('[auth] password reset request failed', error.message);
  }
}

export async function sendSignInCode(input: unknown): Promise<SignInCodeOutcome> {
  const { email } = requestPasswordResetSchema.parse(input);

  const supabase = await createServerClient();
  const attempt = await withMailTransport('sign-in-code', () =>
    supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${env.siteUrl}${ROUTES.authCallback}`,
      },
    }),
  );
  if (!attempt.ok) return { status: 'error', message: attempt.message };

  const { error } = attempt.value;

  if (error) {
    if (/rate limit/i.test(error.message)) {
      return { status: 'error', message: readableAuthError(error.message) };
    }
    console.error('[auth] sign-in code request failed', error.message);
  }
  return { status: 'sent' };
}

export async function verifySignInCode(input: unknown): Promise<LoginOutcome> {
  const { email, token, remember = true } = verifySignInCodeSchema.parse(input);

  await recordSessionPersistence(remember);

  const supabase = await createServerClient({ persistSession: remember });
  const attempt = await withMailTransport('verify-sign-in-code', () =>
    supabase.auth.verifyOtp({ email, token, type: 'email' }),
  );
  if (!attempt.ok) return { status: 'error', message: attempt.message };

  const { data, error } = attempt.value;
  if (error) return { status: 'error', message: readableAuthError(error.message) };
  if (!data.user) {
    return { status: 'error', message: 'That code did not check out. Send a new one and retry.' };
  }

  const destination = await provisionedDestination(supabase, data.user.id);
  if (!destination) {
    await supabase.auth.signOut();
    return { status: 'error', message: NOT_PROVISIONED_MESSAGE };
  }
  revalidatePath('/', 'layout');
  return { status: 'done', redirectTo: destination };
}
