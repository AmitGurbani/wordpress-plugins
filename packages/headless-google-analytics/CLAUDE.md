# Headless Google Analytics

Google Analytics (GA4) with WooCommerce integration and Measurement Protocol for headless WordPress stores. Built with [wpts](../wpts/).

## Commands

- `pnpm build` — Build plugin to dist/
- `pnpm dev` — Watch mode rebuild
- `pnpm wp-env:start` — Start local WordPress (Docker required, http://localhost:8888, admin/password)
- `pnpm wp-env:stop` — Stop local WordPress

## Architecture

Multi-file wpts plugin with 5 source files:

- `src/plugin.ts` — Entry file: @Plugin, @AdminPage, 8 @Settings, @Activate/@Deactivate, WooCommerce notice, currency default filter
- `src/server-tracking.ts` — GA4 MP send helper + WooCommerce purchase hook (`woocommerce_order_status_changed`)
- `src/config-routes.ts` — GET /config (public) — returns measurement_id for frontend gtag.js initialization
- `src/track-routes.ts` — POST /track (public) — GA4 MP proxy for browser events with user_id enrichment
- `src/diagnostics-routes.ts` — POST /diagnostics/test-event (admin), GET /diagnostics/last-error (admin)
- `src/admin/index.tsx` — React settings page (General, Events, Diagnostics tabs)

## Event Flow

1. Frontend fetches `GET /config` to get Measurement ID
2. Frontend loads gtag.js: `gtag('config', measurement_id)`
3. Browser-side tracking handled by gtag.js; server-side proxy available via `POST /track`
4. `/track` validates event name against allowed list, whitelists params, adds `user_id` if logged in, forwards to GA4 MP
5. Purchase events fire automatically server-side via WooCommerce hooks — no frontend action needed
6. Server sends `POST https://www.google-analytics.com/mp/collect` with purchase event data

## Conventions

- **Option keys**: `headless_google_analytics_` prefix (e.g., `headless_google_analytics_measurement_id`, `headless_google_analytics_api_secret`, `headless_google_analytics_enable_purchase`, `headless_google_analytics_last_error`)
- **Post meta**: `_headless_ga_sent` — flag on orders to prevent duplicate Purchase events across status transitions. Only set on successful send.
- **WooCommerce purchase tracking**: `woocommerce_order_status_changed` hook (priority 10, acceptedArgs 4). Tracked statuses: `processing`, `on-hold`, `completed`
- **No PII hashing**: Unlike Meta CAPI, GA4 MP does not require hashed PII. `user_id` is sent as plain WordPress user ID string.
- **GA4 MP endpoint**: `POST https://www.google-analytics.com/mp/collect?measurement_id={ID}&api_secret={SECRET}` — returns 2xx always, even for invalid payloads. Uses `wp_remote_post` (not `wp_safe_remote_post`) since URL is hardcoded.
- **Debug endpoint**: `POST https://www.google-analytics.com/debug/mp/collect?...` — returns `{ validationMessages: [{ fieldPath, description, validationCode }] }`. Used in diagnostics. Does NOT validate `api_secret`/`measurement_id`.
- **Allowed events** on `/track`: `view_item`, `add_to_cart`, `begin_checkout`, `purchase`, `search` — each has an independent enable/disable setting
- **Whitelisted params** on `/track`: `currency`, `value`, `transaction_id`, `items`, `search_term`, `item_list_id`, `item_list_name`, `session_id`, `engagement_time_msec`. All others silently dropped.
- **Currency default**: `default_option_headless_google_analytics_currency` filter returns WooCommerce currency when WooCommerce is active
- **GA4 MP payload**: `{ client_id, user_id?, events: [{ name, params }] }`. `client_id` required (format: `123456.789012`); generated server-side for purchase hooks.
