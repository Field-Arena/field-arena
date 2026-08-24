export type SignUpOutcome =
  | { status: 'verify'; email: string }
  | { status: 'done'; redirectTo: string }
  | { status: 'exists' }
  | { status: 'error'; message: string };

export type VerifyOutcome =
  { status: 'done'; redirectTo: string } | { status: 'error'; message: string };

export type ResendOutcome = { status: 'sent' } | { status: 'error'; message: string };

export type LoginOutcome =
  { status: 'done'; redirectTo: string } | { status: 'error'; message: string };

export type SignInCodeOutcome = { status: 'sent' } | { status: 'error'; message: string };

export type SignUpStep = 'account' | 'verify';

export type LoginView = 'login' | 'forgot' | 'code';
