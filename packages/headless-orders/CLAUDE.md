# Headless Orders

REST API for authenticated customers to view their WooCommerce orders. Built with [wpts](../wpts/).

## Commands

- `pnpm build` — Build plugin to dist/
- `pnpm dev` — Watch mode rebuild
- `pnpm wp-env:start` — Start local WordPress (Docker required, http://localhost:8888, admin/password)
- `pnpm wp-env:stop` — Stop local WordPress

## Architecture

Minimal wpts plugin with 2 source files (no admin UI, no settings):

- `src/plugin.ts` — Entry file: @Plugin(`wooNotice: 'required'`), no @Setting or @AdminPage
- `src/order-routes.ts` — GET /orders and GET /orders/:id endpoints with formatOrder helper

## REST API

Namespace: `headless-orders/v1`

| Method | Route | Permission | Purpose |
|--------|-------|-----------|---------|
| GET | `/orders` | `read` capability | List authenticated customer's orders |
| GET | `/orders/:id` | `read` capability | Get single order for authenticated customer |

Query params: `per_page` (int, default 20, max 100), `page` (int, default 1), `status` (string, optional filter).

Response headers: `X-WP-Total`, `X-WP-TotalPages`.

## Conventions

- **Auth**: `capability: 'read'` on @RestRoute — WordPress enforces authentication via permission callback (`current_user_can('read')`). All WooCommerce Customer accounts have the `read` capability. JWT resolved by `determine_current_user` filter before the permission callback runs.
- **Data source**: `wcGetOrders()` / `wcGetOrder()` with customer scoping — never returns other customers' orders
- **Two queries**: page data query (with limit/page) + count query (with `return: 'ids'`, `limit: -1`) for pagination headers
- **Status validation**: allowlist checked via `.includes()` (→ `in_array()` in PHP)
- **Date format**: ISO 8601 via WC_DateTime `.date('c')`
