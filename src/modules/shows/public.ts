// Public, client-safe surface of the shows module.
//
// Other modules must import shows code from here (or from `./types` for
// type-only imports), never from its internals. Keep this list small: only
// what another domain genuinely needs. Server-only exports belong in
// `./index.ts`.

export { NewShowButton } from './ui/show-manager/new-show-button';
export { DeleteShowButton } from './ui/show-manager/delete-show-button';
export type { VerifyHorseDocumentInput } from './schemas';
