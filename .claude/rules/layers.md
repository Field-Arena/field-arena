# Layer Rules in Detail

## `constants.ts` — pure values

```ts
// modules/entries/constants.ts
export const ENTRY_STATUS = [
  'draft',
  'submitted',
  'confirmed',
  'scratched',
  'withdrawn',
] as const;
export const DISCIPLINES = ['dressage', 'eventing', 'hunter-jumper', 'western'] as const;
export const MAX_CLASSES_PER_ENTRY = 8;
```

- `as const` on every array/object so types narrow correctly.
- No imports of runtime code. Importing types is fine.

## `types.ts` — TypeScript types only

```ts
// modules/entries/types.ts
import type { Database } from '@/shared/types/database.types';
import type { ENTRY_STATUS, DISCIPLINES } from './constants';

export type EntryRow = Database['public']['Tables']['entries']['Row'];
export type EntryStatus = (typeof ENTRY_STATUS)[number];
export type Discipline = (typeof DISCIPLINES)[number];
```

- No `enum` keyword. Use `as const` arrays + indexed types.
- Prefer deriving DB types from the generated `database.types.ts`.

## `schemas.ts` — Zod

```ts
// modules/entries/schemas.ts
import { z } from 'zod';
import { DISCIPLINES } from './constants';

export const createEntrySchema = z
  .object({
    showId: z.string().uuid(),
    discipline: z.enum(DISCIPLINES),
    horseName: z.string().min(2).max(80),
    classIds: z.array(z.string().uuid()).min(1).max(8),
    riderNotes: z.string().max(500).optional(),
  })
  .refine((d) => new Set(d.classIds).size === d.classIds.length, {
    message: 'A class cannot be entered twice',
    path: ['classIds'],
  });

export type CreateEntryInput = z.infer<typeof createEntrySchema>;
```

- Every form has a Zod schema.
- Every Server Action validates input against a Zod schema before doing anything else.
- Use `z.infer` to derive types — never write the type by hand alongside the schema.

## `data/` — Supabase access only

**Queries are `'server-only'` and called from Server Components. Mutations are `'use server'` and called from client hooks.** Never call a `'server-only'` function from a `'use client'` component (bundle error). Never wrap a `'use server'` function in `useSuspenseQuery` — Next.js fires a Router refresh on every Server Action call, which collides with React render and throws "Cannot update Router while rendering."

```ts
// modules/entries/data/queries.ts
import 'server-only';
import { createServerClient } from '@/shared/lib/supabase/server';
import type { EntryRow } from '../types';

export async function getEntriesForRider(riderId: string): Promise<EntryRow[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('rider_id', riderId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}
```

```ts
// modules/entries/data/mutations.ts
'use server';
import { createServerClient } from '@/shared/lib/supabase/server';
import { createEntrySchema } from '../schemas';
import { revalidatePath } from 'next/cache';

export async function createEntry(input: unknown) {
  const parsed = createEntrySchema.parse(input);
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('entries')
    .insert({ ...parsed, status: 'draft' })
    .select()
    .single();
  if (error) throw error;
  revalidatePath('/entries');
  return data;
}
```

- **`queries.ts` starts with `'server-only'`.** Server Components `await` it directly: `const rows = await listX(...)`. Pass the result to client components via props.
- **`mutations.ts` starts with `'use server'`.** Each export becomes a callable RPC; client `useMutation` hooks invoke it. After write, call `revalidatePath()` — Next.js re-renders the Server Component and fresh data flows to the client via props. No manual TanStack cache invalidation for queries.
- **`'use server'` files may only export async functions.** Type-only exports go in `types.ts`; constants in `constants.ts`.
- **No `useSuspenseQuery` for query reads.** That pattern was tried, hit the Router-update-during-render bug, and removed. Pass props from the Server Component instead.
- **API routes (`app/api/*`)** are the right tool only when client-side polling / refetching is genuinely needed (search-as-you-type, live scoring / running-order widgets). None in Phase 1.
- **RLS is the security boundary.** `'use server'` exports are publicly callable — every read and write must be safe under the caller's role.
- **Throw on errors** — let the Server Component or `useMutation`'s `onError` surface them. Don't return `{ data, error }` tuples.

## `data/keys.ts` — query key factory

```ts
// modules/entries/data/keys.ts
export const entryKeys = {
  all: ['entries'] as const,
  lists: () => [...entryKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...entryKeys.lists(), filters] as const,
  details: () => [...entryKeys.all, 'detail'] as const,
  detail: (id: string) => [...entryKeys.details(), id] as const,
  byRider: (riderId: string) => [...entryKeys.all, 'rider', riderId] as const,
};
```

- Every module has a `keys.ts`. **Never** write inline string array query keys in hooks.
- Invalidate by the broadest matching key after mutations.

## `hooks/` — TanStack Query mutation wrappers

Hooks are the entry point for **mutations** from client components. Reads come from Server Component props.

```ts
// modules/entries/hooks/use-entry-mutations.ts
'use client';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createEntry } from '../data/mutations';
import type { CreateEntryInput } from '../schemas';

export function useCreateEntry() {
  return useMutation({
    mutationFn: (input: CreateEntryInput) => createEntry(input),
    onSuccess: () => toast.success('Entry submitted'),
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Could not submit'),
  });
}
```

- **No query hooks for server data.** `useSuspenseQuery`/`useQuery` against `data/queries` files breaks at runtime — Server Actions trigger Router updates that conflict with render. Server Components fetch and pass via props instead. (See `data-fetching.md`.)
- **Mutation hooks call `data/mutations.ts` Server Actions.** The mutation calls `revalidatePath()` server-side; Next.js re-renders the Server Component automatically — no manual cache invalidation needed for the resource itself.
- **TanStack Query is still useful** for: optimistic UI on the same component (use `useOptimistic` from React 19), and for any future client-side polling once it's needed (paired with API routes, not Server Actions).
- **Toasts and side effects live in mutation hooks**, not in UI.

## `ui/` — presentational only

```tsx
// modules/entries/ui/entry-form.tsx
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createEntrySchema, type CreateEntryInput } from '../schemas';
import { useCreateEntry } from '../hooks/use-entry-mutations';

export function EntryForm({ onSuccess }: { onSuccess?: () => void }) {
  const form = useForm<CreateEntryInput>({
    resolver: zodResolver(createEntrySchema),
  });
  const { mutate, isPending } = useCreateEntry();

  return <form onSubmit={form.handleSubmit((v) => mutate(v, { onSuccess }))}>{/* fields */}</form>;
}
```

- A UI file's imports tell you whether it's clean. If you see an import from `data/`, it's broken.
- Loading and error states are derived from hooks, not duplicated as local state.
