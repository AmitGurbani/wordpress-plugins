# Headless Orders

REST API for authenticated customers to list their WooCommerce orders. Built with [wpts](../wpts/).

## Commands

- `pnpm build` — Build plugin to dist/
- `pnpm dev` — Watch mode rebuild
- `pnpm wp-env:start` — Start local WordPress (Docker required, http://localhost:8888, admin/password)
- `pnpm wp-env:stop` — Stop local WordPress

## Architecture

Minimal wpts plugin with 2 source files (no admin UI, no settings):

- `src/plugin.ts` — Entry file: @Plugin(`wooNotice: 'required'`), no @Setting or @AdminPage
- `src/order-routes.ts` — GET /orders endpoint with formatOrder helper

## REST API

Namespace: `headless-orders/v1`

| Method | Route | Permission | Purpose |
|--------|-------|-----------|---------|
| GET | `/orders` | public (JWT checked in handler) | List authenticated customer's orders |

Query params: `per_page` (int, default 20, max 100), `page` (int, default 1), `status` (string, optional filter).

Response headers: `X-WP-Total`, `X-WP-TotalPages`.

## Conventions

- **Auth**: `public: true` on @RestRoute + manual `getCurrentUserId()` check → 401 if unauthenticated. JWT resolved by headless-auth's `determine_current_user` filter.
- **Data source**: `wcGetOrders()` with `customer: userId` — never returns other customers' orders
- **Two queries**: page data query (with limit/page) + count query (with `return: 'ids'`, `limit: -1`) for pagination headers
- **Status validation**: allowlist checked via `.includes()` (→ `in_array()` in PHP)
- **Date format**: ISO 8601 via WC_DateTime `.date('c')`
