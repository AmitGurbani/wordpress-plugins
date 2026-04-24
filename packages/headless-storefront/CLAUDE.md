# Headless Storefront

Store branding and configuration for headless WordPress with WooCommerce. Stores all settings in a single WP option and exposes them via a public REST API for the Next.js frontend. Built with [wpts](../wpts/).

## Commands

- `pnpm build` — Build plugin to dist/
- `pnpm dev` — Watch mode rebuild
- `pnpm wp-env:start` — Start local WordPress (Docker required, http://localhost:8888, admin/password)
- `pnpm wp-env:stop` — Stop local WordPress

## Architecture

Multi-file wpts plugin with 4 source files:

- `src/plugin.ts` — Entry file: @Plugin(`wooNotice: 'required'`), @AdminPage(`parentSlug: 'options-general.php'`), @Activate/@Deactivate/@Uninstall
- `src/config-routes.ts` — GET /config (public), GET /config/popular-searches (public), GET+POST /settings (admin), POST /admin/revalidate (admin manual re-push); holds its own `dispatch_revalidate` helper (lands in REST API PHP class)
- `src/revalidate-hooks.ts` — 4 `update_option_*` action handlers that fire the revalidation webhook; holds its own `dispatch_revalidate` helper (lands in Public PHP class). Split from config-routes because wpts places helpers into ONE class per source TS class: @RestRoute + @Action in the same class would leave action handlers unable to reach the helper.
- `src/search-tracking.ts` — WC Store API search tracking via `rest_pre_dispatch` filter, weekly cron cleanup, admin endpoints for popular searches
- `src/admin/index.tsx` — React settings page (7 tabs: Store Identity, Appearance, Contact & Social, Footer Content, Product Page, Popular Searches, Cache Settings)

## Key Design

- **Single option**: All branding settings stored in `headless_storefront_config` as JSON (no @Setting decorators)
- **Custom REST routes**: `/config` (public, nested response with WP/WC fallbacks, excludes popular searches), `/config/popular-searches` (public, returns `{ items: string[] }`), and `/settings` (admin, flat option read/write)
- **Search tracking**: Custom table `{prefix}_headless_search_queries` with aggregated counts, weekly cleanup of entries older than 90 days
- **Cache invalidation**: Four `update_option_*` hooks fire `POST {frontend_url}/api/revalidate` with body `{ "type": "storefront" }` and header `x-revalidate-secret: <secret>`:
  - `update_option_headless_storefront_config` (own settings)
  - `update_option_blogname` (Site Title fallback for app_name)
  - `update_option_blogdescription` (Tagline fallback)
  - `update_option_woocommerce_email_from_address` (contact email fallback)
  Uses `wp_safe_remote_post` (SSRF protection) with `blocking: false` and `timeout: 5` — fire-and-forget. Skipped when `defined('WP_CLI') && WP_CLI` is true. Also available as manual `POST /admin/revalidate` for the "Re-push storefront config" button. Frontend handler receives `type: "storefront"` and should invalidate both the `storefront` and `storefront-popular-searches` cache tags.

## REST API

Namespace: `headless-storefront/v1`

| Method | Route | Permission | Purpose |
|--------|-------|-----------|---------|
| GET | `/config` | public | Branding config (excludes popular searches) with defaults and WP/WC fallbacks |
| GET | `/config/popular-searches` | public | `{ items: string[] }` — overrides if set, else live query from tracking table |
| GET | `/settings` | manage_options | Raw settings for admin UI (includes `_fallbacks`) |
| POST | `/settings` | manage_options | Update all settings |
| POST | `/admin/revalidate` | manage_options | Fire the revalidation webhook manually; returns `{ dispatched: boolean }` |
| GET | `/admin/popular-searches` | manage_options | Current top search queries from tracking table |
| POST | `/admin/clear-searches` | manage_options | Truncate search tracking table |

## Conventions

- **Option key**: `headless_storefront_config` — single JSON option storing all settings
- **Database table**: `{prefix}_headless_search_queries` — aggregated search query counts
- **Cron hook**: `headless_storefront_search_cleanup` — weekly, prunes entries older than 90 days
- **WP/WC fallbacks** (in /config only): `app_name` → `blogname`, `tagline` → `blogdescription`, `contact.email` → `woocommerce_email_from_address`
- **Admin page**: Settings > Headless Storefront (submenu under Settings via `parentSlug: 'options-general.php'`)
