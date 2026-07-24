# FieldArena

FieldArena — an equestrian event-management platform, built with
[Next.js](https://nextjs.org) (App Router, TypeScript, Tailwind CSS v4). Commit,
tooling, and folder-structure conventions are documented in
[`CLAUDE.md`](./CLAUDE.md) and [`.claude/rules/`](./.claude/rules/).

## Getting started

```bash
# Node 22.13+ (see .nvmrc); yarn 4 via corepack (corepack enable)
yarn install
yarn dev
```

Open [http://localhost:3000](http://localhost:3000). Edit `src/app/page.tsx` and
the page auto-updates.

## Scripts

```bash
yarn dev          # start the dev server
yarn build        # production build
yarn start        # run the production build
yarn lint         # eslint
yarn format       # prettier --write .
yarn typecheck    # tsc --noEmit
```

Git hooks (Husky) run `lint-staged` + `typecheck` on pre-commit and validate
Conventional Commit messages. `yarn install` activates them (`prepare` → husky).

## Structure

```
src/app/          # App Router — layout, page, globals.css
.claude/rules/    # folder-structure + commit/tooling conventions to follow
```

Build features as vertical slices under `src/modules/` following
[`.claude/rules/folder-structure.md`](./.claude/rules/folder-structure.md).
