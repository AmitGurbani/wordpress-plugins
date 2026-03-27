# Headless Google Analytics

Google Analytics (GA4) with WooCommerce integration and Measurement Protocol for headless WordPress stores. The frontend handles all browser-side tracking via gtag.js; this plugin serves the GA4 Measurement ID and handles automatic server-side Purchase event tracking via WooCommerce hooks.

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
├── plugin.ts              # Entry — @Plugin, @AdminPage, 4 @Settings, @Activate
├── server-tracking.ts     # GA4 MP send helper + WooCommerce purchase hook
├── diagnostics-routes.ts  # @DiagnosticsRoute + POST /diagnostics/test-event
└── admin/
    ├── index.tsx           # React root
    ├── SettingsPage.tsx    # Main settings page with TabPanel
    ├── types.ts            # Settings interface, defaults, tabs
    └── tabs/
        ├── GeneralTab.tsx      # Measurement ID, API Secret, Currency, Purchase toggle
        └── DiagnosticsTab.tsx  # Test MP connection, view errors
```

Uses [wpts multi-file support](../wpts/README.md#multi-file-plugins) — `plugin.ts` is the entry file with `@Plugin`, other files contain decorated classes merged into the same plugin output.

## REST API Endpoints

All endpoints are under `/headless-google-analytics/v1/`.

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/config` | GET | Public | Returns `measurement_id` for frontend gtag.js initialization |
| `/settings` | GET | Admin | Get all plugin settings |
| `/settings` | POST | Admin | Update plugin settings |
| `/diagnostics/test-event` | POST | Admin | Send test event to GA4 debug endpoint for validation |
| `/diagnostics/last-error` | GET | Admin | Get the last error message |

### Why No /track Endpoint?

Unlike the Meta Pixel plugin, there is no `/track` proxy endpoint. Google explicitly states the Measurement Protocol is designed to "augment automatic collection through gtag, not to replace it." Browser events should be sent directly via gtag.js — proxying them through the server would risk double-counting (GA4 has no event deduplication like Meta CAPI).

### Frontend Integration

Fetch the Measurement ID and initialize gtag.js directly:

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
gtag('config', measurement_id, { user_id: loggedInUserId || undefined });
```

All browser events (view_item, add_to_cart, begin_checkout, search) are sent directly by gtag.js — no server proxy needed:

```js
gtag('event', 'view_item', {
  currency: 'USD',
  value: 29.99,
  items: [{ item_id: 'SKU_123', item_name: 'Blue T-Shirt', price: 29.99 }],
});
```

## Settings

Configured via WordPress admin page (Google Analytics menu):

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `measurement_id` | string | `''` | GA4 Measurement ID (G-XXXXXXXX) |
| `api_secret` | string | `''` | Measurement Protocol API secret |
| `currency` | string | `'USD'` | Default currency (ISO 4217, auto-detected from WooCommerce) |
| `enable_purchase` | boolean | `true` | Auto-send purchase events via WooCommerce hooks |

## Architecture

### Headless Design

```
Frontend (Next.js etc.)              WordPress/WooCommerce
────────────────────────             ──────────────────────────
GET /config  ──────────────────────→ Returns measurement_id
Load gtag.js, configure
gtag('event', 'view_item', data)     (direct to GA4, browser-side)
gtag('event', 'add_to_cart', data)   (direct to GA4, browser-side)

                                     Order status → processing/completed
                                     ──→ POST google-analytics.com/mp/collect
                                         (purchase event, server-side)
```

### WooCommerce Purchase Tracking

Purchase events are tracked automatically via the `woocommerce_order_status_changed` hook — no frontend action required. This is the correct use of the Measurement Protocol: server-only events where no browser is involved.

- **Online gateways** (Stripe, PayPal) → status `processing`
- **Cash on Delivery** → status `processing`
- **Bank transfer (BACS)** → status `on-hold`
- **Manual completion** → status `completed`

A `_headless_ga_sent` order meta flag prevents duplicate sends across status transitions. The flag is only set on successful delivery, allowing automatic retry if GA4 was temporarily unreachable.

### GA4 Measurement Protocol

Purchase events are sent to `POST https://www.google-analytics.com/mp/collect`:

```json
{
  "client_id": "1234567890.1711234567",
  "user_id": "42",
  "events": [{
    "name": "purchase",
    "params": {
      "currency": "USD",
      "value": 59.98,
      "transaction_id": "1234",
      "engagement_time_msec": 1,
      "items": [
        { "item_id": "SKU-123", "item_name": "Blue T-Shirt", "quantity": 1, "price": 29.99 }
      ]
    }
  }]
}
```

## License

GPL-2.0+
