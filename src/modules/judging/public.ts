// Public, client-safe surface of the judging module.
//
// Other modules must import judging code from here (or from `./types` for
// type-only imports), never from its internals. Keep this list small: only
// what another domain genuinely needs. Server-only exports belong in
// `./index.ts`.

export { AssignJudgesDialog } from './ui/assign-judges-dialog';
