# Headless POS Sessions

POS register session storage with REST API for headless WordPress. Built with [wpts](../wpts/).

## Commands

- `pnpm build` — Build plugin to dist/
- `pnpm dev` — Watch mode rebuild
- `pnpm wp-env:start` — Start local WordPress (Docker required, http://localhost:8888, admin/password)
- `pnpm wp-env:stop` — Stop local WordPress

## Architecture

Multi-file wpts plugin with 3 source files:

- `src/plugin.ts` — Entry file: @Plugin, @CustomPostType, @AdminPage, 2 @Settings, @Activate/@Deactivate, cron scheduling via @Action('init')
- `src/session-routes.ts` — POST/GET/PUT/DELETE /sessions endpoints, formatSession helper
- `src/cron-tasks.ts` — @Action('hps_daily_cleanup'), @Action('hps_daily_auto_close')
- `src/admin/` — React settings page (not transpiled, bundled by wp-scripts)

## Data Model

Custom Post Type `pos_session` with `post_status: 'publish'`. Session state tracked in `_session_status` meta (open/closed).

Meta fields: `_session_uuid`, `_terminal_id`, `_session_status`, `_opened_at`, `_closed_at`, `_opening_balance`, `_closing_balance`, `_expected_balance`, `_cash_in`, `_cash_out`, `_order_count`, `_order_ids` (JSON array), `_notes`, `_cashier_id`

## REST API

Namespace: `headless-pos-sessions/v1`

| Method | Route | Permission | Purpose |
|--------|-------|-----------|---------|
| POST | `/sessions` | edit_shop_orders | Create session (409 on duplicate UUID) |
| GET | `/sessions` | edit_shop_orders | List with pagination/filtering/sorting |
| GET | `/sessions/:id` | edit_shop_orders | Get single session |
| PUT | `/sessions/:id` | edit_shop_orders | Partial update |
| DELETE | `/sessions/:id` | manage_woocommerce | Delete session (admin-only) |
| GET | `/settings` | manage_options | Fetch settings |
| POST | `/settings` | manage_options | Update settings |

## Conventions

- **Option keys**: `headless_pos_sessions_` prefix (e.g., `headless_pos_sessions_retention_days`)
- **Meta keys**: Underscore-prefixed (hidden from custom fields UI): `_session_uuid`, `_terminal_id`, etc.
- **Cron hooks**: `hps_daily_cleanup` (retention cleanup), `hps_daily_auto_close` (orphan auto-close)
- **UUID deduplication**: `session_uuid` field enables idempotent syncing — POST returns 409 Conflict on duplicate
- **Balance storage**: Stored as strings in post meta, returned as floats via `floatval()` in API responses
- **Date storage**: ISO 8601 strings, lexicographically sortable for meta_query comparisons
- **Post access**: Use `getPost(id, 'ARRAY_A')` for array access (wpts transpiles property access to `$post['key']`, not `$post->key`)
