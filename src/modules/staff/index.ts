import 'server-only';

// Public server-side surface of the staff module.
//
// Other modules' data layers must import staff queries/actions from here, never
// from `./data/*` directly. Keep this list small: only the operations another
// domain genuinely needs. Client-safe exports (hooks, components) belong in
// `./public.ts`.

export { getSelectedOrg } from './data/org-selection-queries';
export { getOrgAccessBlock } from './data/org-access-queries';
