# Headless FuzzyFind

Weighted, fuzzy WooCommerce product search with autocomplete and analytics. Built with [wpts](../wpts/).

## Commands

- `pnpm build` — Build plugin to dist/
- `pnpm dev` — Watch mode rebuild
- `pnpm wp-env:start` — Start local WordPress (Docker required, http://localhost:8888, admin/password)
- `pnpm wp-env:stop` — Stop local WordPress

## Architecture

Multi-file wpts plugin with 4 source files:

- `src/plugin.ts` — Entry file: @Plugin, @AdminPage, 10 @Settings, @Activate/@Deactivate
- `src/search-routes.ts` — GET /search (public, paginated), GET /autocomplete (public). Boolean query builder, Levenshtein fuzzy correction, "Did You Mean" suggestions, analytics logging
- `src/indexer.ts` — Real-time product indexing via WooCommerce hooks, batch reindex via `headless_fuzzyfind_do_reindex` action
- `src/admin-routes.ts` — Admin REST endpoints: index status/rebuild/delete, analytics retrieval/clear
- `src/admin/index.tsx` — React settings page (Weights, Features, Index, Analytics tabs)

## Search Behavior

1. **FULLTEXT** (primary) — MySQL BOOLEAN MODE on `(title, sku, short_desc, attributes, categories, tags, variation_skus)`. Prefix wildcard: `+word*`. Synonym expansion: `+(word1* synonym1* synonym2*)`
2. **Fuzzy correction** — On zero results, Levenshtein distance (≤2) corrects each word against indexed titles, retries search
3. **LIKE fallback** — For queries < 3 chars (below MySQL `ft_min_word_len`), `%query%` on title and SKU
4. **"Did You Mean"** — When results < threshold, shows corrected query suggestions (limit 5)
5. **Weighted scoring** — `(MATCH(title) * wTitle) + (MATCH(sku) * wSku) + (MATCH(all) * wContent)`, sorted DESC

## Conventions

- **Option keys (two prefixes)**:
  - `headless_fuzzy_find_*` — @Setting-derived (wpts auto-prefix from plugin name). e.g., `headless_fuzzy_find_weight_title`, `headless_fuzzy_find_fuzzy_enabled`, `headless_fuzzy_find_synonyms`
  - `headless_fuzzyfind_*` — Manual options. e.g., `headless_fuzzyfind_index_table`, `headless_fuzzyfind_log_table`, `headless_fuzzyfind_db_version`, `headless_fuzzyfind_last_indexed`, `headless_fuzzyfind_reindex_in_progress`, `headless_fuzzyfind_reindex_started`
- **Database tables**: `{prefix}ff_search_index` (FULLTEXT index), `{prefix}ff_search_log` (analytics). Created on activation, table names stored in options
- **Index sync hooks**: `woocommerce_new_product` (priority 20), `woocommerce_update_product` (priority 20), `woocommerce_new_product_variation`, `woocommerce_update_product_variation`, `before_delete_post`, `wp_trash_post`, `untrashed_post`. Skips unpublished, hidden, or catalog-only products
- **Custom action**: `headless_fuzzyfind_do_reindex` — batch reindex all published products. Fired synchronously for ≤500 products, scheduled via `wp_schedule_single_event` for larger stores
- **Reindex guard**: `headless_fuzzyfind_reindex_in_progress` flag with 10-minute staleness timeout prevents concurrent reindexes
