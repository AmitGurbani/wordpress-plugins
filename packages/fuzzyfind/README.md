# FuzzyFind for WooCommerce

Weighted FULLTEXT WooCommerce product search with autocomplete and analytics. Built with [wpts](../wpts/).

## Requirements

- WordPress 6.0+
- PHP 8.0+
- WooCommerce (active)
- MySQL/MariaDB with InnoDB (for FULLTEXT indexes)

## Install

```bash
pnpm build
```

Upload the generated `dist/fuzzy-find-for-woo-commerce.zip` via **WordPress Admin > Plugins > Add New > Upload Plugin**.

On activation the plugin creates two database tables (`wp_ff_search_index` and `wp_ff_search_log`) and is ready to use.

## Features

- **Weighted search** — configurable relevance weights for title, SKU, categories, attributes, tags, and content
- **FULLTEXT index** — MySQL FULLTEXT with boolean mode for fast, relevance-sorted results
- **Fuzzy matching** — SOUNDEX phonetic matching for misspellings and typos
- **Autocomplete** — public REST endpoint for search-as-you-type UI
- **"Did you mean" suggestions** — suggests alternatives when results are few
- **Search analytics** — tracks popular searches and zero-result queries
- **Admin settings page** — React UI for configuring weights, feature toggles, and viewing analytics

## Architecture

5 TypeScript source files transpiled to a WordPress plugin via wpts:

| File | Purpose |
|------|---------|
| `src/plugin.ts` | Plugin entry — settings, lifecycle, admin page |
| `src/search.ts` | WP_Query integration — hooks into `posts_clauses` |
| `src/indexer.ts` | Product indexer — builds/maintains FULLTEXT index |
| `src/autocomplete.ts` | Public REST endpoint for autocomplete |
| `src/admin-routes.ts` | Admin REST endpoints for settings page |

## Settings

All settings are managed via the admin page and REST API.

### Search Weights (1-10)

| Setting | Default | Description |
|---------|---------|-------------|
| Title Weight | 10 | Relevance weight for product title matches |
| SKU Weight | 8 | Relevance weight for SKU matches |
| Category Weight | 6 | Relevance weight for category name matches |
| Attribute Weight | 5 | Relevance weight for product attribute matches |
| Tag Weight | 4 | Relevance weight for product tag matches |
| Content Weight | 2 | Relevance weight for product description matches |

### Feature Toggles

| Setting | Default | Description |
|---------|---------|-------------|
| Fuzzy Matching | On | SOUNDEX phonetic matching for typos |
| Autocomplete | On | REST API autocomplete endpoint |
| Search Analytics | On | Track popular and zero-result searches |
| Min Query Length | 2 | Minimum characters to trigger search |
| Autocomplete Limit | 8 | Max autocomplete suggestions |
| "Did You Mean" Threshold | 3 | Show suggestions when results fewer than this |

## REST Endpoints

All endpoints are under `/fuzzyfind/v1`.

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/autocomplete?query=...&limit=8` | GET | Public | Search-as-you-type suggestions |
| `/settings` | GET | `manage_options` | Read all settings |
| `/settings` | POST | `manage_options` | Update settings |
| `/index/status` | GET | `manage_options` | Index stats (total indexed, last indexed) |
| `/index/rebuild` | POST | `manage_options` | Trigger reindex (sync for <=500 products, WP-Cron for larger stores) |
| `/analytics` | GET | `manage_options` | Popular searches and zero-result queries |
| `/analytics/clear` | POST | `manage_options` | Clear analytics data |

## Development

```bash
pnpm dev              # Watch mode — rebuild on changes
pnpm build            # Build plugin + zip
pnpm wp-env:start     # Start local WordPress environment
pnpm wp-env:stop      # Stop local WordPress environment
```

## License

GPL-2.0+
