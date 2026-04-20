# Headless Meta Pixel

Meta Pixel with WooCommerce integration and Conversions API (CAPI) for headless WordPress stores. Built with [wpts](../wpts/).

## Commands

- `pnpm build` — Build plugin to dist/
- `pnpm dev` — Watch mode rebuild
- `pnpm wp-env:start` — Start local WordPress (Docker required, http://localhost:8888, admin/password)
- `pnpm wp-env:stop` — Stop local WordPress

## Architecture

Multi-file wpts plugin with 4 source files:

- `src/plugin.ts` — Entry file: @Plugin(`wooNotice: 'recommended'`), @AdminPage, 10 @Settings(`exposeInConfig`, `wooCurrencyDefault`), @Activate/@Deactivate
- `src/capi.ts` — CAPI helper methods + WooCommerce purchase hook (`woocommerce_order_status_changed`)
- `src/track-routes.ts` — POST /track (public) — CAPI proxy for browser events with server-side enrichment
- `src/diagnostics-routes.ts` — @DiagnosticsRoute(`errorOptionSuffix: 'last_capi_error'`), POST /diagnostics/test-capi (admin)
- `src/admin/index.tsx` — React settings page (General, Events, Diagnostics tabs)

## CAPI Event Flow

1. Frontend sends event to `POST /track` with `event_name`, `event_id`, `event_source_url`, `custom_data`, `_fbp`, `_fbc`
2. Server validates event type against enabled settings
3. Server enriches `user_data` with client IP, User-Agent from headers
4. If user is logged in, adds SHA-256 hashed PII (email, first_name, last_name, external_id)
5. Sends to Meta CAPI v25.0 endpoint with `test_event_code` if configured
6. Purchase events fire automatically via WooCommerce hooks — no frontend action needed

## Conventions

- **Option keys**: `headless_meta_pixel_` prefix (e.g., `headless_meta_pixel_pixel_id`, `headless_meta_pixel_access_token`, `headless_meta_pixel_enable_capi`, `headless_meta_pixel_last_capi_error`)
- **Post meta**: `_headless_meta_pixel_capi_sent` — flag on orders to prevent duplicate Purchase events across status transitions. Only set on successful CAPI delivery, allowing automatic retry on next status change if CAPI was unreachable.
- **WooCommerce purchase tracking**: `woocommerce_order_status_changed` hook (priority 10, acceptedArgs 4). Tracked statuses: `processing`, `on-hold`, `completed`. Event ID: `order_<orderId>`
- **PII hashing**: SHA-256 with normalize (lowercase + trim) before hashing. Applied to: `em`, `ph`, `fn`, `ln`, `ct`, `st`, `zp`, `country`, `external_id`
- **Event deduplication**: Frontend generates UUID, passes to both `fbq('track', ..., { eventID })` and `/track` `event_id`. Meta deduplicates same `event_name` + `event_id` from browser + server within 48h
- **Allowed custom_data keys** (whitelist on `/track`): `currency`, `value`, `content_type`, `contents`, `content_ids`, `search_string`, `num_items`, `order_id`. All others silently dropped
- **Supported events**: `ViewContent`, `AddToCart`, `InitiateCheckout`, `Purchase`, `Search` — each has an independent enable/disable setting
- **Currency default**: auto-generated via `@Setting({ wooCurrencyDefault: true })` — `default_option_headless_meta_pixel_currency` filter returns WooCommerce currency when active
- **Rate limiting**: `/track` endpoint is rate-limited to 60 requests/minute per client IP using WordPress transients. Uses `X-Forwarded-For` header for real client IP (supports reverse proxy/CDN setups). Transient key: `headless_meta_pixel_rl_` + MD5(IP), 60s TTL.
- **Sensitive settings**: `access_token` uses `sensitive: true` on @Setting — GET /settings returns `'********'` instead of the raw token
- **Array type validation**: `contents` and `content_ids` in `/track` custom_data are validated with `is_array()` and dropped if not arrays
