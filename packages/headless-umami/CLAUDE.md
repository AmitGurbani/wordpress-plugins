# Headless Umami

Umami Analytics with WooCommerce purchase tracking for headless WordPress stores. Built with [wpts](../wpts/).

## Commands

- `pnpm build` — Build plugin to dist/
- `pnpm dev` — Watch mode rebuild
- `pnpm wp-env:start` — Start local WordPress (Docker required, http://localhost:8888, admin/password)
- `pnpm wp-env:stop` — Stop local WordPress

## Architecture

Multi-file wpts plugin with 4 source files:

- `src/plugin.ts` — Entry file: @Plugin(`wooNotice: 'recommended'`), @AdminPage, 3 @Settings, @Activate/@Deactivate
- `src/server-tracking.ts` — Umami send helper + WooCommerce purchase hook (`woocommerce_order_status_changed`)
- `src/config-routes.ts` — GET /config (public) — returns umami_url + website_id for frontend script initialization
- `src/diagnostics-routes.ts` — @DiagnosticsRoute (auto last-error), POST /diagnostics/test-connection (admin)
- `src/admin/index.tsx` — React settings page (General, Diagnostics tabs)

## Event Flow

1. Frontend fetches `GET /config` to get Umami URL + Website ID
2. Frontend loads `<script defer src="{umami_url}/umami.js" data-website-id="{website_id}"></script>`
3. Browser-side tracking handled entirely by Umami JS script (`umami.track()`, `umami.identify()`)
4. Purchase events fire automatically server-side via WooCommerce hooks — no frontend action needed
5. Server sends `POST {umami_url}/api/send` with purchase event data using `wp_safe_remote_post`

## Conventions

- **Option keys**: `headless_umami_` prefix (e.g., `headless_umami_umami_url`, `headless_umami_website_id`, `headless_umami_enable_purchase`, `headless_umami_last_error`)
- **Post meta**: `_headless_umami_sent` — flag on orders to prevent duplicate Purchase events across status transitions. Only set on successful send.
- **WooCommerce purchase tracking**: `woocommerce_order_status_changed` hook (priority 10, acceptedArgs 4). Tracked statuses: `processing`, `on-hold`, `completed`
- **No PII**: Umami is privacy-focused — no email, phone, name, or address data is collected or sent
- **SSRF protection**: Uses `wp_safe_remote_post` (not `wp_remote_post`) for outbound requests since the Umami URL is user-configurable
- **User-Agent required**: Umami silently discards events without a valid User-Agent header. Server-side events use `Mozilla/5.0 (compatible; HeadlessUmami/1.0; +wordpress)`
- **Umami API**: `POST {umami_url}/api/send` with `{ type: "event", payload: { hostname, language, referrer, screen, title, url, website, name, data } }`
