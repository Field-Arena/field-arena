// Public, client-safe surface of the organizations module.
//
// Other modules must import organizations code from here (or from `./types` for
// type-only imports), never from its internals. Keep this list small: only
// what another domain genuinely needs. Server-only exports belong in
// `./index.ts`.

export { useStartStripeConnect } from './hooks/use-stripe-connect';
