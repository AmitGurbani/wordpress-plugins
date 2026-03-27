# Headless Meta Pixel

Headless Meta Pixel with WooCommerce integration and Conversions API (CAPI) for headless WordPress stores. The frontend handles browser-side pixel JS; this plugin handles server-side CAPI forwarding, settings, and automatic Purchase tracking via WooCommerce hooks.

Built with [wpts](../wpts/) (TypeScript-to-WordPress-Plugin transpiler).

## Development

```bash
pnpm build         # Build plugin to dist/
pnpm dev           # Watch mode — rebuild on file changes
```

### Local Testing with wp-env

Requires [Docker](https://www.docker.com/products/docker-desktop/).

```bash
pnpm build                # Build first
pnpm wp-env:start         # Start WordPress + WooCommerce at http://localhost:8888
pnpm wp-env:stop          # Stop the environment
pnpm wp-env:clean         # Reset everything (database, uploads, etc.)
```

Default credentials: `admin` / `password`

The plugin is auto-mounted from `dist/headless-meta-pixel/`. Rebuild with `pnpm build` after code changes (or use `pnpm dev` in a separate terminal).

## Project Structure

```
src/
├── plugin.ts            # Entry — @Plugin, @AdminPage, 10 @Settings, @Activate
├── capi.ts              # CAPI helper methods + WooCommerce purchase hook
├── track-routes.ts      # POST /track — CAPI proxy for browser events
├── diagnostics-routes.ts# @DiagnosticsRoute + POST /diagnostics/test-capi
└── admin/index.tsx      # React settings UI (General, Events, Diagnostics tabs)
```

Uses [wpts multi-file support](../wpts/README.md#multi-file-plugins) — `plugin.ts` is the entry file with `@Plugin`, other files contain decorated classes merged into the same plugin output.

## REST API Endpoints

All endpoints are under `/headless-meta-pixel/v1/`.

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/config` | GET | Public | Returns `pixel_id` for frontend `fbq('init', pixelId)` |
| `/track` | POST | Public | Proxy browser events to Meta CAPI with server-side enrichment |
| `/settings` | GET | Admin | Get all plugin settings |
| `/settings` | POST | Admin | Update plugin settings |
| `/diagnostics/test-capi` | POST | Admin | Send a test PageView event to verify CAPI connection |
| `/diagnostics/last-error` | GET | Admin | Get the last CAPI error message |

### `/track` Request Body

```json
{
  "event_name": "AddToCart",
  "event_id": "uuid-from-frontend",
  "event_source_url": "https://store.com/product/shirt",
  "custom_data": {
    "content_ids": ["sku_123"],
    "content_type": "product",
    "value": 29.99,
    "currency": "USD"
  },
  "_fbp": "fb.1.123456789.987654321",
  "_fbc": "fb.1.123456789.abcdef"
}
```

Supported `event_name` values: `ViewContent`, `AddToCart`, `InitiateCheckout`, `Purchase`, `Search`

## Settings

Configured via WordPress admin page (Headless Meta Pixel menu):

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `pixel_id` | string | `''` | Meta Pixel ID from Events Manager |
| `access_token` | string | `''` | CAPI access token (server-side only, never sent to browser) |
| `test_event_code` | string | `''` | Test event code from Meta Events Manager — remove for production |
| `currency` | string | `'USD'` | Default currency; auto-set to WooCommerce currency if active |
| `enable_view_content` | boolean | `true` | Accept ViewContent events via `/track` |
| `enable_add_to_cart` | boolean | `true` | Accept AddToCart events via `/track` |
| `enable_initiate_checkout` | boolean | `true` | Accept InitiateCheckout events via `/track` |
| `enable_purchase` | boolean | `true` | Auto-send Purchase events via WooCommerce hook |
| `enable_search` | boolean | `true` | Accept Search events via `/track` |
| `enable_capi` | boolean | `true` | Master toggle for all CAPI sending |

## Architecture

### Headless Design

The plugin is designed for **headless stores** where the storefront (Next.js, Nuxt, etc.) is separate from WordPress/WooCommerce. The frontend is responsible for loading the Meta Pixel JS and firing browser-side `fbq()` calls. The plugin provides the server-side CAPI counterpart.

```
Frontend (Next.js etc.)           WordPress/WooCommerce
────────────────────────          ──────────────────────────
fbq('init', pixelId)   ←── GET /config ───────────────────
fbq('track', 'ViewContent', data, {eventID: uuid})
POST /track {event_name, event_id: uuid, ...}  ──→  CAPI
```

### Event Deduplication

Both the browser pixel and the server CAPI call use the same `event_id`. Meta automatically deduplicates when it receives the same `event_name` + `event_id` from both channels within 48 hours.

### WooCommerce Purchase Tracking

Purchase events are tracked automatically via the `woocommerce_order_status_changed` hook — no frontend action required. This catches all payment methods:

- **Online gateways** (Stripe, PayPal) → status `processing`
- **Cash on Delivery** → status `processing`
- **Bank transfer (BACS)** → status `on-hold`
- **Manual completion** → status `completed`

A `_headless_meta_pixel_capi_sent` order meta flag prevents duplicate sends across status transitions. The flag is only set on successful CAPI delivery, allowing automatic retry on the next status change if CAPI was unreachable.

### User Data Hashing

All PII sent to CAPI is SHA-256 hashed (normalized to lowercase + trimmed before hashing), following Meta's requirements:
- From orders: `em`, `ph`, `fn`, `ln`, `ct`, `st`, `zp`, `country`, `external_id`
- From logged-in WP users (via `/track`): `em`, `fn`, `ln`, `external_id`
- Not hashed: `client_ip_address`, `client_user_agent`, `fbp`, `fbc`

## License

GPL-2.0+
