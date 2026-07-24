# FieldArena — CLAUDE.md

FieldArena is an equestrian event-management platform — organizations, venues,
shows, entries, judging, scoring, announcements, vendors, and riders. This file
captures the **conventions** we follow: the folder structure and commit/tooling
setup. The app is being rebuilt in Next.js; feature code lands module by module.

## Stack

- **Next.js 16** (App Router, React 19) · **TypeScript** (strict)
- **Tailwind CSS v4**
- **ESLint** (flat config) + **Prettier**
- **Husky** + **lint-staged** + **commitlint** (Conventional Commits)
- **yarn** (v4, via corepack)

> Additional libraries (data layer, state, UI kit, backend, etc.) are added
> deliberately as features need them — not up front.

## Conventions

- @.claude/rules/folder-structure.md — how the `src/` tree is organised
- @.claude/rules/architecture.md — module / layer separation principles
- @.claude/rules/layers.md — `constants → types → schemas → data → hooks → ui`
- @.claude/rules/naming.md — files, components, hooks, types
- @.claude/rules/tooling.md — ESLint / Prettier / Husky / commitlint
- @.claude/rules/git-workflow.md — branching, PRs, commit message format

> These rule files describe the target module structure and may reference tools
> (Supabase, TanStack, Zustand) that aren't installed yet. Treat them as the
> pattern to follow when you build those features — install the dependency at
> that point.

## Commit format (Conventional Commits)

`<type>(<scope>): <subject>` — e.g. `feat(shows): add show-builder wizard`.
Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`, `style`,
`build`, `ci`, `revert`. Subject lower-case, no trailing period, ≤100 chars.
Enforced by commitlint on commit; hooks run lint-staged + typecheck on
pre-commit.

## Common commands

```bash
yarn dev          # http://localhost:3000
yarn build        # production build
yarn lint         # eslint
yarn format       # prettier --write .
yarn typecheck    # tsc --noEmit
```
