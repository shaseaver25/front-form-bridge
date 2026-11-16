const PAGE_SIZE = 1000;

type PagedQuery<T> = {
  order: (column: string, options?: { ascending?: boolean }) => PagedQuery<T>;
  range: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>;
};

/**
 * Fetches every row of a list query, paging past Supabase's 1,000-row default cap.
 * `buildQuery` must return a fresh query builder on each call.
 */
export async function fetchAllRows<T>(
  buildQuery: () => unknown,
  orderColumns: string[] = ["name", "id"],
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    let query = buildQuery() as PagedQuery<T>;
    for (const column of orderColumns) {
      query = query.order(column);
    }
    const { data, error } = await query.range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    const page = data ?? [];
    rows.push(...page);
    if (page.length < PAGE_SIZE) return rows;
  }
}
