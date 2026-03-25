# Integration Guide

Headless Umami provides REST API endpoints for headless WordPress stores. The frontend handles all browser-side tracking via the Umami JS script; this plugin serves the Umami configuration (URL + Website ID) and handles automatic server-side Purchase event tracking via WooCommerce hooks.

## Overview

```
Frontend (Next.js, Nuxt, etc.)           WordPress / WooCommerce
──────────────────────────────           ──────────────────────────────────
GET /config  ──────────────────────────→ returns { umami_url, website_id }
Load umami.js script
umami.track('view_product', data)        (direct to Umami, not via WP)
umami.identify({ email })                (direct to Umami, not via WP)

                                         Order status → processing/completed
                                         ──→ POST {umami_url}/api/send
                                             (purchase event, server-side)
```

**Key design point:** Unlike Meta Pixel or GA4 plugins, there is no `/track` proxy endpoint. The Umami JS script communicates directly with the Umami server. WordPress only provides the configuration and handles server-side purchase tracking.

**Base URL:** `https://your-site.com/wp-json/headless-umami/v1`

If the site uses plain permalinks: `https://your-site.com/?rest_route=/headless-umami/v1`

---

## GET /config

Returns the Umami URL and Website ID for frontend script initialization. Public — no authentication required.

### Request

```http
GET /wp-json/headless-umami/v1/config
```

### Response

```json
{
  "umami_url": "https://cloud.umami.is",
  "website_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

### Usage

```ts
const res = await fetch('/wp-json/headless-umami/v1/config');
const { umami_url, website_id } = await res.json();
```

If either value is empty, the plugin is not yet configured — skip script loading.

---

## Frontend Script Initialization

Load the Umami tracking script using the values from `/config`:

```html
<script defer src="{umami_url}/script.js" data-website-id="{website_id}"></script>
```

Or dynamically in JavaScript:

```ts
const script = document.createElement('script');
script.src = `${umami_url}/script.js`;
script.defer = true;
script.dataset.websiteId = website_id;
document.head.appendChild(script);
```

Once loaded, the global `umami` object is available for tracking.

---

## Browser-Side Tracking

All browser-side tracking is handled directly by the Umami JS script — events go straight to the Umami server, not through WordPress.

### Page Views

Umami automatically tracks page views. For SPAs (Next.js, Nuxt), configure the script with `data-auto-track="true"` or manually track navigation:

```ts
// On route change
umami.track();
```

### Custom Events

```ts
umami.track('view_product', {
  product_id: 'SKU-123',
  product_name: 'Blue T-Shirt',
  price: 29.99,
  currency: 'USD',
});

umami.track('add_to_cart', {
  product_id: 'SKU-123',
  quantity: 1,
  value: 29.99,
});

umami.track('search', {
  query: 'blue shirt',
  results: 12,
});
```

### User Identification

```ts
umami.identify({
  email: 'user@example.com',
  name: 'John Doe',
});
```

See the [Umami documentation](https://umami.is/docs) for the full tracking API.

---

## TypeScript / React Example

A complete helper for initializing Umami and tracking events:

```ts
// lib/umami.ts

let initialized = false;

export async function initUmami(): Promise<void> {
  if (initialized) return;

  const res = await fetch('/wp-json/headless-umami/v1/config');
  const { umami_url, website_id } = await res.json();
  if (!umami_url || !website_id) return;

  const script = document.createElement('script');
  script.src = `${umami_url}/script.js`;
  script.defer = true;
  script.dataset.websiteId = website_id;
  document.head.appendChild(script);

  initialized = true;
}
```

Usage in a Next.js app:

```tsx
// app/layout.tsx (or _app.tsx)
import { useEffect } from 'react';
import { initUmami } from '@/lib/umami';

export default function RootLayout({ children }) {
  useEffect(() => {
    initUmami();
  }, []);

  return <html><body>{children}</body></html>;
}
```

```tsx
// pages/product/[slug].tsx
import { useEffect } from 'react';

export default function ProductPage({ product }) {
  useEffect(() => {
    if (window.umami) {
      window.umami.track('view_product', {
        product_id: product.sku,
        product_name: product.name,
        price: product.price,
      });
    }
  }, [product]);

  // ...
}
```

---

## Purchase Events

You do **not** need to track purchases from the frontend — the plugin fires purchase events automatically via the `woocommerce_order_status_changed` hook when an order reaches `processing`, `on-hold`, or `completed` status. This covers all payment methods without any frontend action.

The server-side purchase event includes:

| Umami Data Field | Source |
| ---------------- | ------ |
| `order_id` | WooCommerce order ID |
| `revenue` | Order total |
| `currency` | Order currency |
| `products[].id` | Product SKU (or product ID if no SKU) |
| `products[].name` | Product name |
| `products[].quantity` | Line item quantity |
| `products[].price` | Product price |

### Umami API Payload

Events are sent to `POST {umami_url}/api/send`:

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
    "website": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
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

---

## Privacy

Umami is a privacy-focused analytics platform. This plugin:

- Does **not** collect or send any PII (email, phone, name, address) to Umami
- Does **not** use cookies
- Does **not** inject any JavaScript into WordPress themes
- Uses `wp_safe_remote_post` for all outbound requests (blocks requests to private/loopback IP ranges)
