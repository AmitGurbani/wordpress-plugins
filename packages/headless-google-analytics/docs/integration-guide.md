# Integration Guide

Headless Google Analytics provides a REST API endpoint for headless WordPress stores to fetch the GA4 Measurement ID. The frontend handles all browser-side tracking directly via gtag.js. The plugin handles automatic server-side Purchase event tracking via WooCommerce hooks using the GA4 Measurement Protocol.

## Overview

```
Frontend (Next.js, Nuxt, etc.)           WordPress / WooCommerce
──────────────────────────────           ──────────────────────────────────
GET /config  ──────────────────────────→ returns { measurement_id }
Load gtag.js
gtag('event', 'view_item', data)         (direct to GA4, browser-side)
gtag('event', 'add_to_cart', data)       (direct to GA4, browser-side)

                                         Order status → processing/completed
                                         ──→ POST google-analytics.com/mp/collect
                                             (purchase event, server-side)
```

**Key design point:** There is no `/track` proxy endpoint. Google's Measurement Protocol is designed to "augment automatic collection through gtag, not to replace it." Browser events go directly to GA4 via gtag.js. The Measurement Protocol is used only for server-only events (purchases) where no browser is involved.

**Base URL:** `https://your-site.com/wp-json/headless-google-analytics/v1`

If the site uses plain permalinks: `https://your-site.com/?rest_route=/headless-google-analytics/v1`

---

## GET /config

Returns the Measurement ID for frontend gtag.js initialization. Public — no authentication required.

### Request

```http
GET /wp-json/headless-google-analytics/v1/config
```

### Response

```json
{
  "measurement_id": "G-XXXXXXXXXX"
}
```

If `measurement_id` is empty, the plugin is not yet configured — skip gtag.js initialization.

---

## Frontend Integration

### Loading gtag.js

```ts
const res = await fetch('/wp-json/headless-google-analytics/v1/config');
const { measurement_id } = await res.json();

if (measurement_id) {
  // Load gtag.js
  const script = document.createElement('script');
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurement_id}`;
  script.async = true;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag(...args: any[]) { window.dataLayer.push(args); }
  gtag('js', new Date());
  gtag('config', measurement_id);
}
```

### Setting user_id

If your frontend knows the WordPress user ID (e.g., from a JWT or auth endpoint), set it directly in gtag.js:

```ts
gtag('config', measurement_id, { user_id: String(userId) });
```

No server proxy is needed — gtag.js handles `user_id` natively for cross-device tracking.

### Tracking Events

All browser events are sent directly by gtag.js:

```ts
// Product page view
gtag('event', 'view_item', {
  currency: 'USD',
  value: 29.99,
  items: [{ item_id: 'SKU_123', item_name: 'Blue T-Shirt', price: 29.99 }],
});

// Add to cart
gtag('event', 'add_to_cart', {
  currency: 'USD',
  value: 29.99,
  items: [{ item_id: 'SKU_123', item_name: 'Blue T-Shirt', price: 29.99, quantity: 1 }],
});

// Begin checkout
gtag('event', 'begin_checkout', {
  currency: 'USD',
  value: 59.98,
  items: [/* cart items */],
});

// Search
gtag('event', 'search', { search_term: 'blue shirt' });
```

---

## TypeScript / React Example

```ts
// lib/ga4.ts

let measurementId = '';

export async function initGA4(userId?: string): Promise<void> {
  if (measurementId) return;

  const res = await fetch('/wp-json/headless-google-analytics/v1/config');
  const data = await res.json();
  if (!data.measurement_id) return;

  measurementId = data.measurement_id;

  const script = document.createElement('script');
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  script.async = true;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag(...args: any[]) { window.dataLayer.push(args); }
  gtag('js', new Date());
  gtag('config', measurementId, userId ? { user_id: userId } : {});
}
```

Usage:

```tsx
// app/layout.tsx
import { useEffect } from 'react';
import { initGA4 } from '@/lib/ga4';

export default function RootLayout({ children }) {
  const { user } = useAuth(); // your auth hook

  useEffect(() => {
    initGA4(user?.id ? String(user.id) : undefined);
  }, [user]);

  return <html><body>{children}</body></html>;
}
```

```tsx
// pages/product/[slug].tsx
export default function ProductPage({ product }) {
  useEffect(() => {
    if (window.gtag) {
      window.gtag('event', 'view_item', {
        currency: 'USD',
        value: product.price,
        items: [{ item_id: product.sku, item_name: product.name, price: product.price }],
      });
    }
  }, [product]);

  // ...
}
```

---

## Purchase Events

You do **not** need to track purchases from the frontend. The plugin fires purchase events automatically via the `woocommerce_order_status_changed` hook when an order reaches `processing`, `on-hold`, or `completed` status. This covers all payment methods without any frontend code.

The server-side purchase event includes:

| GA4 Parameter | Source |
| ------------- | ------ |
| `transaction_id` | WooCommerce order ID |
| `value` | Order total (as float) |
| `currency` | Order currency |
| `items[].item_id` | Product SKU (or product ID if no SKU) |
| `items[].item_name` | Product name |
| `items[].quantity` | Line item quantity |
| `items[].price` | Product price (as float) |
| `user_id` | WooCommerce customer ID (if logged in) |
| `client_id` | Auto-generated (no browser cookie available server-side) |

---

## Why No /track Proxy?

This is a deliberate design choice based on Google's official guidance:

1. **Google says**: "The intent of the Measurement Protocol is to augment automatic collection through gtag, not to replace it"
2. **No deduplication**: GA4 has no `event_id` deduplication mechanism (unlike Meta CAPI). Sending the same event from both browser and server would double-count it
3. **Session breaking**: If the `client_id` passed to the MP doesn't match the browser's `_ga` cookie, GA4 creates a separate session
4. **Metadata loss**: The MP doesn't capture referrer, page title, or screen resolution — gtag.js does this automatically
5. **For server-side tracking at scale**: Google recommends Server-Side GTM (sGTM), not custom MP bridging
