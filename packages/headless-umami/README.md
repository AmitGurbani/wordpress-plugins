# Headless Umami

Umami Analytics with WooCommerce purchase tracking for headless WordPress stores. The frontend handles browser-side tracking via the Umami JS script; this plugin serves the Umami configuration and handles automatic server-side Purchase event tracking via WooCommerce hooks.

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

The plugin is auto-mounted from `dist/headless-umami/`. Rebuild with `pnpm build` after code changes (or use `pnpm dev` in a separate terminal).

## Project Structure

```
src/
├── plugin.ts              # Entry — @Plugin, @AdminPage, 3 @Settings, @Activate
├── server-tracking.ts     # Umami send helper + WooCommerce purchase hook
├── config-routes.ts       # GET /config — umami_url + website_id for frontend
├── diagnostics-routes.ts  # POST /diagnostics/test-connection, GET /diagnostics/last-error
└── admin/index.tsx        # React settings UI (General, Diagnostics tabs)
```

Uses [wpts multi-file support](../wpts/README.md#multi-file-plugins) — `plugin.ts` is the entry file with `@Plugin`, other files contain decorated classes merged into the same plugin output.

## REST API Endpoints

All endpoints are under `/headless-umami/v1/`.

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/config` | GET | Public | Returns `umami_url` and `website_id` for frontend script initialization |
| `/settings` | GET | Admin | Get all plugin settings |
| `/settings` | POST | Admin | Update plugin settings |
| `/diagnostics/test-connection` | POST | Admin | Send a test event to verify Umami connection |
| `/diagnostics/last-error` | GET | Admin | Get the last error message |

### Frontend Script Initialization

The frontend fetches `/config` and uses the response to load the Umami tracking script:

```html
<script defer src="{umami_url}/umami.js" data-website-id="{website_id}"></script>
```

## Settings

Configured via WordPress admin page (Umami Analytics menu):

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `umami_url` | string | `''` | Umami instance URL (e.g., `https://cloud.umami.is` or self-hosted) |
| `website_id` | string | `''` | Umami website ID (UUID from your Umami dashboard) |
| `enable_purchase` | boolean | `true` | Auto-send purchase events via WooCommerce hook |

## Architecture

### Headless Design

The plugin is designed for **headless stores** where the storefront (Next.js, Nuxt, etc.) is separate from WordPress/WooCommerce. The frontend handles all browser-side analytics via the Umami JS script. The plugin provides server-side configuration and purchase tracking.

```
Frontend (Next.js etc.)              WordPress/WooCommerce
────────────────────────             ──────────────────────────
GET /config  ──────────────────────→ Returns umami_url + website_id
Load umami.js script
umami.track('view_product', data)    (direct to Umami, not via WP)

                                     Order status → processing/completed
                                     ──→ POST {umami_url}/api/send (purchase event)
```

### WooCommerce Purchase Tracking

Purchase events are tracked automatically via the `woocommerce_order_status_changed` hook — no frontend action required. This catches all payment methods:

- **Online gateways** (Stripe, PayPal) → status `processing`
- **Cash on Delivery** → status `processing`
- **Bank transfer (BACS)** → status `on-hold`
- **Manual completion** → status `completed`

A `_headless_umami_sent` order meta flag prevents duplicate sends across status transitions. The flag is only set on successful delivery to Umami, allowing automatic retry on the next status change if Umami was temporarily unreachable.

### Privacy

Umami is a privacy-focused analytics platform. This plugin:

- Does **not** collect or send any PII (email, phone, name, address) to Umami
- Does **not** use cookies
- Does **not** inject any JavaScript into WordPress themes
- Uses `wp_safe_remote_post` for all outbound requests (blocks requests to private/loopback IP ranges)

### Umami API

Events are sent to `POST {umami_url}/api/send` with the following payload:

```json
{
  "type": "event",
  "payload": {
    "hostname": "store.example.com",
    "language": "",
    "referrer": "",
    "screen": "1920x1080",
    "title": "Purchase - Order #1234",
    "url": "/checkout/order-received/1234/",
    "website": "website-id-uuid",
    "name": "purchase",
    "data": {
      "order_id": "1234",
      "revenue": "59.98",
      "currency": "USD",
      "products": [
        { "id": "SKU-123", "name": "Blue T-Shirt", "quantity": 1, "price": "29.99" }
      ]
    }
  }
}
```

No authentication token is required — Umami identifies the site via the `website` ID.

## License

GPL-2.0+
