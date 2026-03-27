# Headless Google Analytics

Google Analytics (GA4) with WooCommerce integration and Measurement Protocol for headless WordPress stores. Built with [wpts](../wpts/).

## Commands

- `pnpm build` — Build plugin to dist/
- `pnpm dev` — Watch mode rebuild
- `pnpm wp-env:start` — Start local WordPress (Docker required, http://localhost:8888, admin/password)
- `pnpm wp-env:stop` — Stop local WordPress

## Architecture

Multi-file wpts plugin with 3 source files:

- `src/plugin.ts` — Entry file: @Plugin(`wooNotice: 'recommended'`), @AdminPage, 4 @Settings(`exposeInConfig`, `wooCurrencyDefault`), @Activate/@Deactivate
- `src/server-tracking.ts` — GA4 MP send helper + WooCommerce purchase hook (`woocommerce_order_status_changed`)
- `src/diagnostics-routes.ts` — @DiagnosticsRoute (auto last-error), POST /diagnostics/test-event (admin)
- `src/admin/index.tsx` — React settings page (General, Diagnostics tabs)

## Design: No /track Proxy

Unlike headless-meta-pixel, this plugin does **not** have a `/track` endpoint. This is intentional:

- Google states: "The intent of the Measurement Protocol is to **augment** automatic collection through gtag, **not to replace it**"
- GA4 has **no event deduplication** — proxying browser events would double-count them
- `user_id` can be set directly in gtag.js: `gtag('config', 'G-XXX', { user_id: '123' })`
- The Measurement Protocol is for **server-only events** (purchases) where no browser is involved

The frontend loads gtag.js directly and handles all browser-side tracking. WordPress only provides the Measurement ID (via `/config`) and fires purchase events server-side via WooCommerce hooks.

## Event Flow

1. Frontend fetches `GET /config` to get Measurement ID
2. Frontend loads gtag.js: `gtag('config', measurement_id)`
3. Browser-side tracking handled entirely by gtag.js (view_item, add_to_cart, etc.)
4. Purchase events fire automatically server-side via WooCommerce hooks — no frontend action needed
5. Server sends to `POST https://www.google-analytics.com/mp/collect` with purchase event data

## Conventions

- **Option keys**: `headless_google_analytics_` prefix (e.g., `headless_google_analytics_measurement_id`, `headless_google_analytics_api_secret`, `headless_google_analytics_enable_purchase`, `headless_google_analytics_last_error`)
- **Post meta**: `_headless_ga_sent` — flag on orders to prevent duplicate Purchase events across status transitions. Only set on successful send.
- **WooCommerce purchase tracking**: `woocommerce_order_status_changed` hook (priority 10, acceptedArgs 4). Tracked statuses: `processing`, `on-hold`, `completed`
- **No PII hashing**: Unlike Meta CAPI, GA4 MP does not require hashed PII. `user_id` is sent as plain WordPress user ID string.
- **GA4 MP endpoint**: `POST https://www.google-analytics.com/mp/collect?measurement_id={ID}&api_secret={SECRET}` — returns 2xx always, even for invalid payloads. Uses `wp_remote_post` (not `wp_safe_remote_post`) since URL is hardcoded.
- **Debug endpoint**: `POST https://www.google-analytics.com/debug/mp/collect?...` — returns `{ validationMessages: [{ fieldPath, description, validationCode }] }`. Used in diagnostics. Does NOT validate `api_secret`/`measurement_id`.
- **Currency default**: auto-generated via `@Setting({ wooCurrencyDefault: true })` — `default_option_headless_google_analytics_currency` filter returns WooCommerce currency when active
- **GA4 MP payload**: `{ client_id, user_id?, events: [{ name, params }] }`. `client_id` required (format: `123456.789012`); generated server-side for purchase hooks.
- **Numeric types**: GA4 MP requires `value`, `price`, `engagement_time_msec` as numbers (not strings). Uses `parseFloat()` → PHP `floatval()` for monetary values.
