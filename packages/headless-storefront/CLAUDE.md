# Headless Storefront

Store branding and configuration for headless WordPress with WooCommerce. Stores all settings in a single WP option and exposes them via a public REST API for the Next.js frontend. Built with [wpts](../wpts/).

## Commands

- `pnpm build` — Build plugin to dist/
- `pnpm dev` — Watch mode rebuild
- `pnpm wp-env:start` — Start local WordPress (Docker required, http://localhost:8888, admin/password)
- `pnpm wp-env:stop` — Stop local WordPress

## Architecture

Multi-file wpts plugin with 3 source files:

- `src/plugin.ts` — Entry file: @Plugin(`wooNotice: 'required'`), @AdminPage(`parentSlug: 'options-general.php'`), @Activate/@Deactivate/@Uninstall
- `src/config-routes.ts` — GET /config (public), GET+POST /settings (admin), cache invalidation webhook on option update
- `src/search-tracking.ts` — WC Store API search tracking via `rest_pre_dispatch` filter, weekly cron cleanup, admin endpoints for popular searches
- `src/admin/index.tsx` — React settings page (8 tabs: Store Identity, Contact & Social, Footer Content, Product Page, Colors, Design Tokens, Popular Searches, Cache Settings)

## Key Design

- **Single option**: All settings stored in `headless_storefront_config` as JSON (no @Setting decorators)
- **Custom REST routes**: /config (public, nested response with WP/WC fallbacks) and /settings (admin, flat option read/write)
- **Search tracking**: Custom table `{prefix}_headless_search_queries` with aggregated counts, weekly cleanup of entries older than 90 days
- **Cache invalidation**: `update_option_headless_storefront_config` hook fires `POST {frontend_url}/api/revalidate` with body `{ "type": "storefront" }` and header `x-revalidate-secret: <secret>`. Uses `wp_safe_remote_post` (SSRF protection) with `blocking: false` and `timeout: 5` — fire-and-forget. Frontend handler must accept `type: "storefront"`.

## REST API

Namespace: `headless-storefront/v1`

| Method | Route | Permission | Purpose |
|--------|-------|-----------|---------|
| GET | `/config` | public | Full branding config with defaults and WP/WC fallbacks |
| GET | `/settings` | manage_options | Raw settings for admin UI (includes `_fallbacks`) |
| POST | `/settings` | manage_options | Update all settings |
| GET | `/admin/popular-searches` | manage_options | Current top search queries from tracking table |
| POST | `/admin/clear-searches` | manage_options | Truncate search tracking table |

## Conventions

- **Option key**: `headless_storefront_config` — single JSON option storing all settings
- **Database table**: `{prefix}_headless_search_queries` — aggregated search query counts
- **Cron hook**: `headless_storefront_search_cleanup` — weekly, prunes entries older than 90 days
- **WP/WC fallbacks** (in /config only): `app_name` → `blogname`, `tagline` → `blogdescription`, `contact.email` → `woocommerce_email_from_address`
- **Admin page**: Settings > Headless Storefront (submenu under Settings via `parentSlug: 'options-general.php'`)
