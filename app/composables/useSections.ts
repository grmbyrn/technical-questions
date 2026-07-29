/**
 * The ordered section list, shared by the sidebar and the pager.
 *
 * Both callers must use the same key *and* the same handler, or Nuxt warns
 * about incompatible options for the key — hence a single composable rather
 * than two copies of the query.
 *
 * Metadata only: selecting bodies here would serialise every section into
 * every page's payload.
 */
export function useSections() {
  return useAsyncData("sections", () =>
    queryCollection("sections")
      .order("order", "ASC")
      .select("slug", "order", "number", "group", "title", "status")
      .all(),
  );
}
