// Public, client-safe surface of the vendors module.
//
// Other modules must import vendors code from here (or from `./types` for
// type-only imports), never from its internals. Keep this list small: only
// what another domain genuinely needs. Server-only exports belong in
// `./index.ts`.

export { VendorApprovalActions } from './ui/vendor-approval-actions';
