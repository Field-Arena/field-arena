import 'server-only';

// Public server-side surface of the organizations module.
//
// Other modules' data layers must import organizations queries/actions from here, never
// from `./data/*` directly. Keep this list small: only the operations another
// domain genuinely needs. Client-safe exports (hooks, components) belong in
// `./public.ts`.

export { addOrgMember } from './data/mutations';
