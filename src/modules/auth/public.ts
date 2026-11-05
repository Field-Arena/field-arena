// Public, client-safe surface of the auth module.
//
// Other modules must import auth code from here (or from `./types` for
// type-only imports), never from its internals. Keep this list small: only
// what another domain genuinely needs. Server-only exports belong in
// `./index.ts`.

export { LoginDialog } from './ui/login-dialog';
export { LoginTrigger } from './ui/login-trigger';
export { useSignOut } from './hooks/use-auth-mutations';
