# Architectural Principles — Read Before Writing Code

## Monolith with vertical slices

Single Next.js codebase. **Do not** create separate API services, microservices, or extract packages into a monorepo. All modules live in `src/modules/{name}/` as vertical slices.

## Strict layer separation

Every module is split into these layers. **A layer may only depend on the layers above it in this list.**

```
constants  →  pure values, no imports allowed
types      →  TypeScript types only, no runtime code
schemas    →  Zod schemas, may import types
data       →  Supabase queries/mutations, may import types/schemas/constants
store      →  Zustand stores (when needed), may import types/constants
hooks      →  TanStack Query + custom hooks, may import all above
ui         →  components, may import hooks/store/types/constants/schemas — NEVER data
```

**This is not a suggestion.** Violating it is a bug.

## The UI Layer is Logic-Free

UI components do exactly four things:

1. Accept props
2. Call hooks (queries, mutations, store selectors, form hooks, router hooks)
3. Render JSX
4. Hand events to handlers from hooks or props

UI components **must not**:

- Call Supabase directly
- Import from any `data/` folder
- Compute business logic (scoring math, placings, entry-fee totals, etc.)
- Format dates/currency inline (use util functions from `shared/lib/format`)
- Hold "smart" state beyond local UI state (open/closed, hover, focus)

If you find yourself reaching for business logic inside a UI file, **stop** and put it in a hook or a pure utility function in the module.

## RLS is the Security Boundary

Permission checks happen in Postgres via RLS policies. Application-layer permission checks are a UX optimization (hide buttons the user can't use), not a security boundary. **Never** rely solely on conditional rendering to enforce access — always pair it with an RLS policy.

## Server Actions for Mutations

All mutations go through Next.js Server Actions, which call into the `data/` layer. Client-side code never touches Supabase directly for writes. Reads may use either Server Components or TanStack Query, depending on whether the data needs to be reactive on the client.
