import 'server-only';

const PAGE_SIZE = 1000;

/* PostgREST caps every response at max_rows (1000). A platform-wide
 * aggregate that reads rows into JS must page through them, or totals
 * silently stop growing once the table passes 1000 rows. `page` must apply a
 * stable .order() so consecutive ranges neither skip nor repeat rows. */
export async function fetchAllRows<T>(
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: Error | null }>,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await page(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    const chunk = data ?? [];
    rows.push(...chunk);
    if (chunk.length < PAGE_SIZE) return rows;
  }
}
