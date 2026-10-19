// Public, client-safe surface of the superadmin module.
//
// Other modules must import superadmin code from here (or `./types`), never
// from its internals. Keep this list small: only what another domain genuinely
// needs. Server-only exports belong in `./index.ts`.

export {
  useEnterAsOrganizer,
  useExitOrganizerView,
  useSetPreviewShow,
  useSetRailRole,
} from './hooks/use-session-mutations';
