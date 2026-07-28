'use client';

import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * TanStack Query provider.
 *
 * Per layers.md this exists for *mutations*, not reads: query hooks against the
 * data layer were tried in this codebase and removed, because a Server Action
 * triggers a Router refresh that collides with React render and throws "Cannot
 * update Router while rendering". Reads come from Server Components as props.
 *
 * The client is created inside useState rather than at module scope. A
 * module-level client is shared across every request on the server, which on a
 * multi-tenant app means one user's cached data can be served to another.
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          mutations: {
            retry: false,
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
