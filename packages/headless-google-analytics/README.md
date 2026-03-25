# Headless Google Analytics

Google Analytics (GA4) with WooCommerce integration and Measurement Protocol for headless WordPress stores. The frontend handles browser-side tracking via gtag.js; this plugin serves the GA4 configuration, proxies events to the Measurement Protocol, and handles automatic server-side Purchase event tracking via WooCommerce hooks.

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

The plugin is auto-mounted from `dist/headless-google-analytics/`. Rebuild with `pnpm build` after code changes (or use `pnpm dev` in a separate terminal).

## Project Structure

```
src/
├── plugin.ts              # Entry — @Plugin, @AdminPage, 8 @Settings, @Activate
├── server-tracking.ts     # GA4 MP send helper + WooCommerce purchase hook
├── config-routes.ts       # GET /config — measurement_id for frontend
├── track-routes.ts        # POST /track — GA4 MP proxy with validation + enrichment
├── diagnostics-routes.ts  # POST /diagnostics/test-event, GET /diagnostics/last-error
└── admin/
    ├── index.tsx           # React root
    ├── SettingsPage.tsx    # Main settings page with TabPanel
    ├── types.ts            # Settings interface, defaults, tabs
    └── tabs/
        ├── GeneralTab.tsx      # Measurement ID, API Secret, Currency
        ├── EventsTab.tsx       # Event type toggles
        └── DiagnosticsTab.tsx  # Test MP connection, view errors
```

Uses [wpts multi-file support](../wpts/README.md#multi-file-plugins) — `plugin.ts` is the entry file with `@Plugin`, other files contain decorated classes merged into the same plugin output.

## REST API Endpoints

All endpoints are under `/headless-google-analytics/v1/`.

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/config` | GET | Public | Returns `measurement_id` for frontend gtag.js initialization |
| `/track` | POST | Public | Proxy frontend events to GA4 Measurement Protocol |
| `/settings` | GET | Admin | Get all plugin settings |
| `/settings` | POST | Admin | Update plugin settings |
| `/diagnostics/test-event` | POST | Admin | Send test event to GA4 debug endpoint for validation |
| `/diagnostics/last-error` | GET | Admin | Get the last error message |

### Frontend Integration

Fetch the Measurement ID and initialize gtag.js:

```js
// 1. Get config from WordPress
const res = await fetch('/wp-json/headless-google-analytics/v1/config');
const { measurement_id } = await res.json();

// 2. Load gtag.js
const script = document.createElement('script');
script.src = `https://www.googletagmanager.com/gtag/js?id=${measurement_id}`;
script.async = true;
document.head.appendChild(script);

window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }
gtag('js', new Date());
gtag('config', measurement_id);
```

Proxy events through the `/track` endpoint for server-side enrichment:

```js
await fetch('/wp-json/headless-google-analytics/v1/track', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    event_name: 'view_item',
    client_id: getGaClientId(), // from _ga cookie
    params: {
      currency: 'USD',
      value: 29.99,
      items: [{ item_id: 'SKU_123', item_name: 'Blue T-Shirt', price: 29.99 }],
    },
  }),
});
```

### POST /track Request

```json
{
  "event_name": "view_item | add_to_cart | begin_checkout | purchase | search",
  "client_id": "123456.789012",
  "params": {
    "currency": "USD",
    "value": 29.99,
    "items": [{ "item_id": "SKU_123", "item_name": "Blue T-Shirt", "price": 29.99 }],
    "transaction_id": "1234",
    "search_term": "blue shirt",
    "session_id": "12345678",
    "engagement_time_msec": "100"
  }
}
```

Only whitelisted param keys are forwarded: `currency`, `value`, `transaction_id`, `items`, `search_term`, `item_list_id`, `item_list_name`, `session_id`, `engagement_time_msec`.

## Settings

Configured via WordPress admin page (Google Analytics menu):

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `measurement_id` | string | `''` | GA4 Measurement ID (G-XXXXXXXX) |
| `api_secret` | string | `''` | Measurement Protocol API secret |
| `currency` | string | `'USD'` | Default currency (ISO 4217, auto-detected from WooCommerce) |
| `enable_view_item` | boolean | `true` | Accept view_item events via /track |
| `enable_add_to_cart` | boolean | `true` | Accept add_to_cart events via /track |
| `enable_begin_checkout` | boolean | `true` | Accept begin_checkout events via /track |
| `enable_purchase` | boolean | `true` | Auto-send purchase events via WooCommerce hooks |
| `enable_search` | boolean | `true` | Accept search events via /track |

## Architecture

### Headless Design

The plugin is designed for **headless stores** where the storefront (Next.js, Nuxt, etc.) is separate from WordPress/WooCommerce. The frontend handles browser-side analytics via gtag.js. The plugin provides server-side configuration, event proxying, and purchase tracking.

```
Frontend (Next.js etc.)              WordPress/WooCommerce
────────────────────────             ──────────────────────────
GET /config  ──────────────────────→ Returns measurement_id
Load gtag.js, configure
gtag('event', 'view_item', data)     (direct to GA4, browser-side)

POST /track { event, params }  ────→ Validates, enriches with user_id
                                     ──→ POST google-analytics.com/mp/collect

                                     Order status → processing/completed
                                     ──→ POST google-analytics.com/mp/collect
                                         (purchase event, server-side)
```

### WooCommerce Purchase Tracking

Purchase events are tracked automatically via the `woocommerce_order_status_changed` hook — no frontend action required. This catches all payment methods:

- **Online gateways** (Stripe, PayPal) → status `processing`
- **Cash on Delivery** → status `processing`
- **Bank transfer (BACS)** → status `on-hold`
- **Manual completion** → status `completed`

A `_headless_ga_sent` order meta flag prevents duplicate sends across status transitions. The flag is only set on successful delivery, allowing automatic retry on the next status change if GA4 was temporarily unreachable.

### GA4 Measurement Protocol

Events are sent to `POST https://www.google-analytics.com/mp/collect` with the following payload:

```json
{
  "client_id": "66f1a2b3c4d5e.1711234567",
  "user_id": "42",
  "events": [{
    "name": "purchase",
    "params": {
      "currency": "USD",
      "value": "59.98",
      "transaction_id": "1234",
      "engagement_time_msec": "1",
      "items": [
        { "item_id": "SKU-123", "item_name": "Blue T-Shirt", "quantity": 1, "price": "29.99" }
      ]
    }
  }]
}
```

The Measurement ID and API Secret are passed as query parameters (not in the body). The production endpoint always returns 2xx — payload validation is only available via the debug endpoint at `/debug/mp/collect`, which is used in the Diagnostics tab.

## License

GPL-2.0+
