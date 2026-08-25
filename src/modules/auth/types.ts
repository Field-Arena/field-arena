export type SignUpOutcome =
  | { status: 'verify'; email: string }
  /** Confirmation is off for this project, so the account is already usable. */
  | { status: 'done'; redirectTo: string }
  /** The address already has an account; offer sign-in rather than a code. */
  | { status: 'exists' }
  /** Something the visitor can act on: rate limit, mail transport, and so on. */
  | { status: 'error'; message: string };

export type VerifyOutcome =
  { status: 'done'; redirectTo: string } | { status: 'error'; message: string };

export type ResendOutcome = { status: 'sent' } | { status: 'error'; message: string };

export type LoginOutcome =
  { status: 'done'; redirectTo: string } | { status: 'error'; message: string };

export type SignInCodeOutcome = { status: 'sent' } | { status: 'error'; message: string };

export type SignUpStep = 'account' | 'verify';

export type LoginView = 'login' | 'forgot' | 'code';
