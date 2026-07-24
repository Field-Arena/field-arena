# Code Quality & Git Hooks

Strict tooling enforced via git hooks. Pushing code that doesn't pass these checks is impossible.

## ESLint (flat config)

`eslint.config.js` extends:

- `next/core-web-vitals`
- `typescript-eslint` strict + stylistic type-checked configs
- `eslint-plugin-react-hooks` (rules-of-hooks, exhaustive-deps as **error**, not warn)
- `eslint-plugin-tailwindcss` (class ordering)

Custom rules to enforce the architecture:

- `no-restricted-imports` — forbid importing from `data/` outside `hooks/`, Server Components, and other `data/` files
- `no-restricted-syntax` — ban `enum` keyword
- `@typescript-eslint/no-explicit-any` — error
- `@typescript-eslint/no-unsafe-*` — error
- `react-hooks/exhaustive-deps` — error

Run: `yarn lint`. Pre-commit runs only on staged files via `lint-staged`.

## Prettier

`.prettierrc.json`:

```json
{
  "printWidth": 100,
  "singleQuote": true,
  "semi": true,
  "trailingComma": "all",
  "arrowParens": "always",
  "tabWidth": 2,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

Format-on-save enabled in editor. CI fails if anything is unformatted.

## Conventional Commits + Commitlint

Every commit message follows [Conventional Commits](https://www.conventionalcommits.org/).

**Format:** `<type>(<scope>): <subject>`

**Types:** `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`, `style`, `build`, `ci`, `revert`.

**Scopes** (suggested): `organizations`, `venues`, `shows`, `showbuilder`, `catalog`, `entries`, `scoring`, `judging`, `announcements`, `vendors`, `riders`, `staff`, `payments`, `results`, `onboarding`, `admin`, `auth`, `ui`, `db`, `email`, `deps`, `release`.

**Examples:**

- `feat(entries): add multi-class registration`
- `fix(scoring): handle tie-break on equal totals`
- `refactor(payments): extract fee calculator to shared`
- `chore(deps): bump @tanstack/react-query to 5.50`
- `docs: clarify RLS policy comment style`

`.commitlintrc.json`:

```json
{
  "extends": ["@commitlint/config-conventional"],
  "rules": {
    "scope-enum": [
      2,
      "always",
      [
        "organizations",
        "venues",
        "shows",
        "showbuilder",
        "catalog",
        "entries",
        "scoring",
        "judging",
        "announcements",
        "vendors",
        "riders",
        "staff",
        "payments",
        "results",
        "onboarding",
        "admin",
        "auth",
        "ui",
        "db",
        "email",
        "deps",
        "release"
      ]
    ],
    "subject-case": [2, "always", "lower-case"],
    "header-max-length": [2, "always", 100]
  }
}
```

## Husky + lint-staged

`.husky/pre-commit`:

```sh
yarn lint-staged
yarn typecheck
```

`.husky/commit-msg`:

```sh
yarn commitlint --edit "$1"
```

`.lintstagedrc.json`:

```json
{
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{md,json,yml,yaml}": ["prettier --write"]
}
```

> **Note:** `*.sql` is intentionally excluded. `prettier-plugin-sql` does not
> handle Postgres plpgsql / RLS / `create policy` syntax — it crashes on our
> migrations. Migrations are hand-formatted; rely on Postgres parsing as the
> only authoritative validation.

## One-time setup

```bash
yarn add -D \
  eslint @eslint/js typescript-eslint \
  eslint-plugin-react-hooks eslint-plugin-tailwindcss \
  prettier prettier-plugin-tailwindcss prettier-plugin-sql \
  husky lint-staged \
  @commitlint/cli @commitlint/config-conventional

yarn dlx husky init
echo 'yarn lint-staged && yarn typecheck' > .husky/pre-commit
echo 'yarn commitlint --edit "$1"' > .husky/commit-msg
```
