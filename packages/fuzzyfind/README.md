# FuzzyFind for WooCommerce

Weighted FULLTEXT WooCommerce product search with autocomplete and analytics. Built with [wpts](../wpts/).

## Documentation

- [Integration Guide](./docs/integration-guide.md) — For frontend developers: autocomplete API, response format, code examples
- [Admin Guide](./docs/admin-guide.md) — For WordPress admins: installation, search weights, analytics, troubleshooting

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

- **Weighted search** — configurable relevance weights for title, SKU, and content
- **FULLTEXT index** — MySQL FULLTEXT with boolean mode for fast, relevance-sorted results
- **Fuzzy matching** — Levenshtein distance correction for misspellings and typos
- **Custom REST endpoints** — paginated search and autocomplete endpoints for headless storefronts
- **Synonym support** — configurable synonym groups for search term expansion
- **"Did you mean" suggestions** — suggests alternatives when results are few
- **Search analytics** — tracks popular searches and zero-result queries
- **Admin settings page** — React UI for configuring weights, feature toggles, and viewing analytics

## Architecture

4 TypeScript source files transpiled to a WordPress plugin via wpts:

| File | Purpose |
| ---- | ------- |
| `src/plugin.ts` | Plugin entry — settings, lifecycle, admin page |
| `src/search-routes.ts` | Public REST endpoints — search and autocomplete |
| `src/indexer.ts` | Product indexer — builds/maintains FULLTEXT index |
| `src/admin-routes.ts` | Admin REST endpoints for settings page |

## Settings

All settings are managed via the admin page and REST API.

### Search Weights (1-10)

| Setting | Default | Description |
| ------- | ------- | ----------- |
| Title Weight | 10 | Relevance weight for product title matches |
| SKU Weight | 8 | Relevance weight for SKU matches |
| Content Weight | 2 | Relevance weight for product description matches |

### Feature Toggles

| Setting | Default | Description |
| ------- | ------- | ----------- |
| Fuzzy Matching | On | Levenshtein distance correction for typos |
| Autocomplete | On | REST API autocomplete endpoint |
| Search Analytics | On | Track popular and zero-result searches |
| Min Query Length | 2 | Minimum characters to trigger search |
| Autocomplete Limit | 8 | Max autocomplete suggestions |
| "Did You Mean" Threshold | 3 | Show suggestions when results fewer than this |

## REST Endpoints

All endpoints are under `/fuzzyfind/v1`.

| Endpoint | Method | Auth | Description |
| -------- | ------ | ---- | ----------- |
| `/search?query=...&page=1&per_page=10&orderby=relevance` | GET | Public | Paginated product search with relevance scoring |
| `/autocomplete?query=...&limit=8` | GET | Public | Search-as-you-type suggestions |
| `/settings` | GET | `manage_options` | Read all settings |
| `/settings` | POST | `manage_options` | Update settings |
| `/index/status` | GET | `manage_options` | Index stats (total indexed, last indexed) |
| `/index/rebuild` | POST | `manage_options` | Trigger reindex (sync for <=500 products, WP-Cron for larger stores) |
| `/index/delete` | POST | `manage_options` | Clear all indexed data |
| `/analytics` | GET | `manage_options` | Popular searches and zero-result queries |
| `/analytics/clear` | POST | `manage_options` | Clear analytics data |

## Development

```bash
pnpm dev              # Watch mode — rebuild on changes
pnpm build            # Build plugin + zip
```

### Local Testing with wp-env

Requires [Docker](https://www.docker.com/products/docker-desktop/).

```bash
pnpm build                # Build first
pnpm wp-env:start         # Start WordPress at http://localhost:8888
pnpm wp-env:stop          # Stop the environment
pnpm wp-env:clean         # Reset everything (database, uploads, etc.)
```

Default credentials: `admin` / `password`

The plugin is auto-mounted from `dist/fuzzy-find-for-woo-commerce/`. WooCommerce is auto-installed. Rebuild with `pnpm build` after code changes (or use `pnpm dev` in a separate terminal).

## License

GPL-2.0+
