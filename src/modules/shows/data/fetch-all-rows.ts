import 'server-only';

// PostgREST caps every response at max_rows (1000). A show-wide class_entries
// read passes that easily, and the cap truncates silently — no error, just
// missing riders. Page through with .range() until a short page comes back.
// The query MUST have a deterministic .order() (end it with a unique column
// such as 'id') or rows can repeat/skip between pages.
const PAGE_SIZE = 1000;

interface RangeableQuery<T> {
  range: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>;
}

export async function fetchAllRows<T>(build: () => RangeableQuery<T>): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await build().range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    const page = data ?? [];
    rows.push(...page);
    if (page.length < PAGE_SIZE) return rows;
  }
}
