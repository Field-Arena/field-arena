# Git Workflow & Branching

This codebase uses a two-line release model with feature branches per milestone. The model exists because the platform handles rider payments, personal data, and official competition results — accidental writes to production are unrecoverable.

## Branch model

- **`prod`** — production. Auto-deploys to Vercel prod (when wired). Receives **only** PRs from `dev`. Never receives direct commits or feature merges. Protected.
- **`dev`** — integration / staging. Auto-deploys to Vercel preview, points at the `fieldarena-dev` Supabase project. All milestone PRs land here. **Default branch on GitHub.**
- **`feat/m{X.Y}-{slug}`** — per-milestone feature branch off `dev`. Examples: `feat/m1-1-auth-login`, `feat/m1-2-rider-registration`. Merged via squash PR back into `dev`.
- **`fix/{slug}`** — hotfix branches off `dev` (or `prod` for emergency). Squash-merged.
- **`chore/{slug}`** — tooling, deps, docs without behaviour change.

## Workflow

1. Pull latest `dev`. Branch: `git checkout -b feat/m1-2-rider-registration dev`.
2. Work on the feature. Commit often, locally — Conventional Commits format only. (See `tooling.md`.)
3. When the milestone meets the Definition of Done (ROADMAP §"Definition of Done"): push and open a PR `feat/... → dev`.
4. PR title matches the conventional commit format that the squash-merge will produce: `feat(shows): add show-builder wizard`.
5. PR body includes:
   - Milestone reference (`Closes M1.2`).
   - Summary of changes.
   - Migration list (if any).
   - Manual test plan (since we don't run E2E in CI yet).
6. After PR merges to `dev`, delete the feature branch.
7. **Releases to `prod`** happen at phase boundaries, not per-milestone. Open a PR `dev → prod` titled `release: phase-1` with a release-notes body. Tag the merged commit `v0.1.0`, etc.

## Hard rules

- **Never push directly to `prod`.** GitHub branch protection should enforce this; even if it isn't set, treat it as binding.
- **Never push directly to `dev` for milestone work.** Only `chore/` housekeeping (typo fix, dep bump) may go straight to `dev`.
- **Never `git push --force` on `prod` or `dev`.** Force-push is for personal feature branches only, before review begins.
- **Never `--no-verify`** to skip Husky hooks. If the hook fails, fix the cause.
- **Migrations are append-only across branches.** Never edit a migration file after it has been merged to `dev`. Add a new migration that corrects course.
- **One PR per milestone.** Don't bundle M1.2 + M1.3 in the same branch.
- **No AI / tool attribution in commits or PRs.** No `Co-Authored-By: Claude`, no "🤖 Generated with…" footer, no mention of Claude/Cursor/Copilot anywhere in commit messages, PR titles, or PR bodies. Commits attribute to the human author only.

## Commit message format

Per Conventional Commits and the scope-enum in `.commitlintrc.json`:

```
<type>(<scope>): <subject>
```

Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`, `style`, `build`, `ci`, `revert`.
Scopes: see `.claude/rules/tooling.md` §"Conventional Commits + Commitlint".

Examples:

- `feat(auth): wire login page and middleware route guard`
- `fix(scoring): handle tie-break on equal totals`
- `chore(deps): bump @tanstack/react-query to 5.50`
- `docs: add ROADMAP for phase 1`

Subject is lower-case, no trailing period, max 100 chars.

## Branch protection

> **Current state (2026-05):** GitHub free-tier private repos block both classic branch-protection rules and the newer Rulesets API. A GitHub Team plan ($4/user/month) is required to enforce these via the platform. **Until that upgrade is approved, the rules below are enforced by discipline only.** The hard rules at the top of this file are binding regardless.

When the upgrade lands, apply via API or dashboard:

On `prod`:

- Require PR before merging
- Require status checks: CI workflow (`typecheck + lint + tests`)
- Require linear history
- Restrict force-push, restrict deletion
- Require signed commits (optional, recommended)

On `dev`:

- Require PR before merging (allow self-merge for solo dev phase)
- Require status checks
- Allow force-push: off

CI itself runs on every PR via `.github/workflows/ci.yml` and produces the status check that the rules above will gate on once the upgrade lands.
