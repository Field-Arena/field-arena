import 'server-only';

// Public server-side surface of the shows module.
//
// Other modules' data layers must import shows queries/actions from here, never
// from `./data/*` directly. Keep this list small: only the operations another
// domain genuinely needs. Client-safe exports (hooks, components) belong in
// `./public.ts`.

export { listShowsForOrg } from './data/queries';
export { verifyHorseDocument } from './data/horses-mutations';
