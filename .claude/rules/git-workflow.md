# Git Workflow & Branching

The platform handles rider payments, personal data, and official competition results — accidental writes to production are unrecoverable. Every change reaches production through a reviewed pull request and a Vercel preview.

## Branch model (as it actually is, 2026-10)

- **`main`** — production. Vercel's Git integration auto-deploys every push to `main` to www.field-arena.com. There is **no `prod` branch**; older docs that mention one are wrong.
- **Feature branches** — `feat/{slug}`, `fix/{slug}`, `chore/{slug}` (milestone work may keep the `feat/m{X.Y}-{slug}` form). Branched from `main`, merged back into `main` through a PR.
- **`dev`** — the former integration branch and still GitHub's default branch. It carried the 2026-10-02 audit fixes that were later synced into `main`. Whether to keep it as a staging line (with regular `dev → main` release PRs) or retire it is an owner decision; until then, don't land new work only on `dev`.
- **`production`** — dead (last commit 2026-07-30). Do not use.

## Workflow

1. Update `main` and branch from it: `git checkout -b fix/short-name origin/main`.
2. Commit in Conventional Commits format (see `tooling.md`). Husky runs lint-staged, typecheck and commitlint locally; CI (`.github/workflows/ci.yml`) re-runs typecheck, lint and build on the PR.
3. Push and open a PR into `main`. The PR title matches the squash-merge commit: `fix(scoring): handle tie-break on equal totals`.
4. Vercel builds a **Preview URL** for the PR. Test there — log in as each affected role; use Stripe test cards for payments. Previews must point at a non-production Supabase project and Stripe **test** keys (Vercel → Settings → Environment Variables → Preview).
5. PR body includes: summary of changes, migration list (if any), manual test plan, anything the owner must decide or do.
6. **Database changes:** add a new migration file in the PR. Apply it to the non-production project first and test on the preview; apply it to production immediately before merging, and record that it was applied.
7. After review, merge to `main` → Vercel deploys → spot-check the live site. Delete the branch.
8. **Rollback:** Vercel → Deployments → previous deployment → "Promote to Production". That rolls back code only; a migration needs its own corrective migration.

## Hard rules

- **Never push directly to `main`.** Everything goes through a PR with a passing CI run and a tested preview.
- **Never `git push --force` on `main` or `dev`.** Force-push is for personal feature branches only, before review begins.
- **Never `--no-verify`** to skip Husky hooks. If the hook fails, fix the cause.
- **Migrations are append-only.** Never edit a migration file once it has been merged or applied anywhere. Add a new migration that corrects course.
- **Never run `scripts/apply-sql.mjs`, `scripts/seed-*.mjs`, `scripts/apply-demo-seed.sh` or `scripts/import-legacy-catalog.mjs` against production.** They refuse to unless the target is local or an allowlisted scratch project (`scripts/lib/target-guard.mjs`); never add the production ref to `FA_SCRIPT_ALLOWED_PROJECT_REFS`.
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

> **Current state (2026-10):** not enabled. Until it is, the rules above are enforced by discipline only.

Owner to-do — on `main` (GitHub → Settings → Branches, or Rulesets):

- Require a pull request before merging (allow self-approval only while there is a single developer)
- Require the `CI` status check to pass
- Block force-pushes and branch deletion
- Require linear history (squash merges)

Private repos on the GitHub Free plan can't enforce these rules; GitHub Team (or making the repo public) is required.
