/**
 * Results for the sign-up flow.
 *
 * These are RETURNED, not thrown. A Server Action that throws produces a 500,
 * and Next.js redacts the message in production — so every expected failure
 * (wrong code, address already registered, mail service unreachable) would reach
 * the browser as a generic error with the real reason stripped. Only genuinely
 * unexpected faults throw; anything the visitor can act on comes back as data.
 */
export type SignUpOutcome =
  /** Account created, confirmation code sent — show the verify step. */
  | { status: 'verify'; email: string }
  /** Confirmation is off for this project, so the account is already usable. */
  | { status: 'done'; redirectTo: string }
  /** The address already has an account; offer sign-in rather than a code. */
  | { status: 'exists' }
  /** Something the visitor can act on: rate limit, mail transport, and so on. */
  | { status: 'error'; message: string };

export type VerifyOutcome =
  | { status: 'done'; redirectTo: string }
  | { status: 'error'; message: string };

export type ResendOutcome = { status: 'sent' } | { status: 'error'; message: string };

export type LoginOutcome =
  | { status: 'done'; redirectTo: string }
  | { status: 'error'; message: string };

/**
 * Sending a one-time sign-in code.
 *
 * 'sent' is returned even for an address with no account. Saying so would turn
 * this into an account-enumeration oracle, exactly as it would on the password
 * reset beside it — see requestPasswordReset. Only faults the visitor can act on
 * (rate limit, mail transport) come back as 'error'.
 */
export type SignInCodeOutcome = { status: 'sent' } | { status: 'error'; message: string };

/** Which panel the sign-up screen is showing. */
export type SignUpStep = 'account' | 'verify';

/**
 * Which panel the sign-in screen is showing.
 *
 * 'login' and 'forgot' are both in the design. 'code' is authored: the reference
 * prototype stops at "One-time code sent", which would leave a visitor holding a
 * code with nowhere to type it.
 */
export type LoginView = 'login' | 'forgot' | 'code';
