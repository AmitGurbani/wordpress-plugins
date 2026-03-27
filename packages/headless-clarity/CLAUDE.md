# Headless Clarity

Microsoft Clarity session recordings and heatmaps for headless WordPress stores. Built with [wpts](../wpts/).

## Commands

- `pnpm build` — Build plugin to dist/
- `pnpm dev` — Watch mode rebuild
- `pnpm wp-env:start` — Start local WordPress (Docker required, http://localhost:8888, admin/password)
- `pnpm wp-env:stop` — Stop local WordPress

## Architecture

Multi-file wpts plugin with 3 source files:

- `src/plugin.ts` — Entry file: @Plugin, @AdminPage, 2 @Settings, @Activate/@Deactivate
- `src/config-routes.ts` — GET /config (public) — returns project_id and optional user identity for frontend Clarity initialization
- `src/diagnostics-routes.ts` — @DiagnosticsRoute (auto-generates GET /diagnostics/last-error)
- `src/admin/index.tsx` — React settings page (General, Diagnostics tabs)

## Design: No Server-Side Tracking

Unlike GA4, Meta Pixel, or Umami, Clarity has **no server-side event API**. It is a purely client-side tool for session recordings and heatmaps. There is:

- **No `server-tracking.ts`** — no Measurement Protocol or CAPI equivalent
- **No `track-routes.ts`** — no event proxy needed
- **No WooCommerce hooks** — purchases must be tracked client-side via `clarity("set", ...)` tags

The plugin's sole purpose is serving configuration to the headless frontend.

## Event Flow

1. Frontend fetches `GET /config` to get Project ID (and optional user identity)
2. Frontend loads Clarity script: `https://www.clarity.ms/tag/{project_id}`
3. Frontend calls `clarity("identify", userId, null, null, displayName)` if user data is available
4. All browser-side tracking handled by Clarity JS: `clarity("set", ...)`, `clarity("event", ...)`, `clarity("upgrade", ...)`
5. Purchase tracking done client-side: `clarity("event", "purchase")` + `clarity("set", "order_value", "...")` on order confirmation page

## Conventions

- **Option keys**: `headless_clarity_` prefix (e.g., `headless_clarity_project_id`, `headless_clarity_enable_identify`, `headless_clarity_last_error`)
- **No post meta**: No server-side event tracking, so no deduplication flags needed
- **No PII**: Clarity hashes the custom-id client-side before transmission
- **Project ID format**: 10-character alphanumeric string (e.g., `abcdefghij`)
- **Clarity JS API**: `set` (custom tags), `event` (smart events), `identify` (user ID), `consentv2` (cookie consent), `upgrade` (prioritize recording)
