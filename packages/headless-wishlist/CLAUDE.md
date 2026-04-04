# Headless Wishlist

REST API wishlist for headless WordPress stores. Built with [wpts](../wpts/).

## Commands

- `pnpm build` — Build plugin to dist/
- `pnpm dev` — Watch mode rebuild
- `pnpm wp-env:start` — Start local WordPress (Docker required, http://localhost:8888, admin/password)
- `pnpm wp-env:stop` — Stop local WordPress

## Architecture

Multi-file wpts plugin with 3 source files:

- `src/plugin.ts` — Entry file: @Plugin(`wooNotice: 'required'`), @AdminPage, @Activate
- `src/wishlist-routes.ts` — GET/POST/DELETE /items endpoints, getWishlist/saveWishlist helpers
- `src/analytics-routes.ts` — GET /analytics/popular (admin-only, uses $wpdb for cross-user aggregation)
- `src/admin/` — React analytics page (standalone, no SettingsShell — plugin has no @Setting)

## Data Model

User meta key `_headless_wishlist` — JSON-encoded array of `{ product_id: int, added_at: string }`. One entry per user, stored via `get_user_meta`/`update_user_meta`.

Auto-cleanup: GET /items filters out products that no longer exist (deleted/unpublished) and persists the cleaned list.

## REST API

Namespace: `headless-wishlist/v1`

| Method | Route | Permission | Purpose |
|--------|-------|-----------|---------|
| GET | `/items` | read | List user's wishlist (auto-cleans stale products) |
| POST | `/items` | read | Add product (201, 409 duplicate, 404 invalid product) |
| DELETE | `/items/{product_id}` | read | Remove specific product |
| DELETE | `/items` | read | Clear entire wishlist |
| GET | `/analytics/popular` | manage_options | Top 20 most wishlisted products across all users |

## Conventions

- **Auth**: All `/items` endpoints require JWT (via headless-otp-auth's `determine_current_user` filter). `capability: 'read'` = any logged-in user
- **Option keys**: `headless_wishlist_version` (only option — no @Setting decorators)
- **User meta key**: `_headless_wishlist` (underscore-prefixed, hidden from custom fields UI)
- **Date storage**: ISO 8601 via `gmdate('c', time())`
- **Max items**: `headless_wishlist_max_items` filter (default 100) — extensible by themes/plugins
- **Analytics query**: Direct `$wpdb->usermeta` query with `$wpdb->prepare()` for cross-user aggregation. `arsort()` for descending count sort, `array_slice()` for top 20
- **Admin page**: Standalone React component (no SettingsShell/useSettings) since there are no configurable settings. Uses `FormSection` from admin-ui and WordPress `widefat striped` table
