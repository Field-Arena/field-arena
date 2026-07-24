# Naming Conventions

| Thing               | Convention                                | Example                          |
| ------------------- | ----------------------------------------- | -------------------------------- |
| Files               | `kebab-case.ts` / `kebab-case.tsx`        | `entry-form.tsx`                 |
| React components    | `PascalCase`                              | `EntryForm`                      |
| Functions           | `camelCase`                               | `getEntryFees`                   |
| Hooks               | `use-{thing}.ts`, `useThing`              | `useRiderEntries`                |
| Constants           | `UPPER_SNAKE_CASE`                        | `MAX_CLASSES_PER_ENTRY`          |
| Types               | `PascalCase`                              | `Entry`, `EntryStatus`           |
| Zod schemas         | `camelCase` ending in `Schema`            | `createEntrySchema`              |
| Zustand stores      | `use{Name}Store` or `use{Name}`           | `useUIStore`, `useShowBuilder`   |
| DB tables           | `snake_case` plural                       | `entries`                        |
| DB columns          | `snake_case`                              | `created_at`, `rider_id`         |
| TanStack query keys | factory pattern (see `layers.md`)         | `entryKeys.byRider(id)`          |
| Routes              | kebab-case URL, group by `()` for layouts | `/(dashboard)/entries/new`       |
