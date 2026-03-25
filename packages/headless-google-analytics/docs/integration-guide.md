# Integration Guide

Headless Google Analytics provides REST API endpoints for headless WordPress stores. The frontend handles browser-side tracking via gtag.js; this plugin provides the Measurement ID for initialization, proxies events to the GA4 Measurement Protocol with server-side enrichment, and fires WooCommerce purchase events automatically.

## Overview

```
Frontend (Next.js, Nuxt, etc.)           WordPress / WooCommerce
──────────────────────────────           ──────────────────────────────────
GET /config  ──────────────────────────→ returns { measurement_id }
gtag('config', measurementId)
gtag('event', 'view_item', data)         (browser-side, direct to GA4)
POST /track { event_name, params } ────→ enriches with user_id
                                         ──→ GA4 Measurement Protocol
                                         (Purchase also fires automatically
                                          via WooCommerce order hooks)
```

**Base URL:** `https://your-site.com/wp-json/headless-google-analytics/v1`

If the site uses plain permalinks: `https://your-site.com/?rest_route=/headless-google-analytics/v1`

---

## GET /config

Returns the Measurement ID for browser-side gtag.js initialization. Public — no authentication required.

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

### Usage

```ts
const res = await fetch('/wp-json/headless-google-analytics/v1/config');
const { measurement_id } = await res.json();

if (measurement_id) {
  gtag('config', measurement_id);
}
```

If `measurement_id` is empty, the plugin is not yet configured — skip initialization.

---

## POST /track

Proxies browser events to GA4 via the Measurement Protocol with server-side enrichment (adds `user_id` for logged-in users). Public — no authentication required.

### Request

```http
POST /wp-json/headless-google-analytics/v1/track
Content-Type: application/json
```

```json
{
  "event_name": "view_item",
  "client_id": "123456789.1711234567",
  "params": {
    "currency": "USD",
    "value": 29.99,
    "items": [
      { "item_id": "SKU-001", "item_name": "Blue T-Shirt", "price": 29.99, "quantity": 1 }
    ],
    "session_id": "1234567890",
    "engagement_time_msec": 100
  }
}
```

### Request Fields

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| `event_name` | string | Yes | Event type (see supported events below) |
| `client_id` | string | No | GA4 client ID from `_ga` cookie (format: `123456.789012`). Auto-generated if omitted |
| `params` | object | No | Event-specific parameters (see allowed keys below) |

### Supported Events

| `event_name` | Typical trigger | Key `params` |
| ------------ | --------------- | ------------ |
| `view_item` | Product page view | `currency`, `value`, `items` |
| `add_to_cart` | Add to cart button | `currency`, `value`, `items` |
| `begin_checkout` | Checkout page load | `currency`, `value`, `items` |
| `search` | Search results page | `search_term` |

**Note:** `purchase` is not accepted via `/track` — it is handled exclusively server-side via WooCommerce hooks to prevent fake conversion injection through the public endpoint.

### Allowed `params` Keys

Only these keys are forwarded to GA4 (all others are silently dropped to prevent analytics pollution via the public endpoint):

`currency`, `value`, `transaction_id`, `items`, `search_term`, `item_list_id`, `item_list_name`, `session_id`, `engagement_time_msec`

### Response

```json
{
  "success": true,
  "event_name": "view_item",
  "client_id": "123456789.1711234567"
}
```

### Error Responses

| Code | HTTP Status | Cause |
| ---- | ----------- | ----- |
| `missing_params` | 400 | `event_name` not provided |
| `invalid_event` | 400 | `event_name` is not one of the supported types |
| `event_disabled` | 403 | That specific event type is disabled in settings |

Error format:

```json
{
  "code": "invalid_event",
  "message": "Event name is not supported.",
  "data": { "status": 400 }
}
```

---

## Client ID

The `client_id` is a unique identifier for the user's browser session. GA4's gtag.js stores it in the `_ga` cookie in the format `GA1.1.123456789.1711234567` — the last two dot-separated numbers are the client ID (`123456789.1711234567`).

Read it from the cookie and pass to `/track`:

```ts
function getGaClientId(): string {
  const match = document.cookie.match(/_ga=GA\d+\.\d+\.(.+)/);
  return match ? match[1] : '';
}
```

If not provided, the plugin generates a random client ID. However, passing the real `_ga` cookie value is recommended for session stitching between browser-side and server-side events.

---

## Logged-In User Enrichment

When the request comes from a logged-in WordPress user (cookie-based session or JWT), the plugin automatically adds `user_id` (the WordPress user ID as a string) to the GA4 Measurement Protocol payload. No extra fields are needed in the `/track` request body.

Unlike Meta CAPI, GA4 does not require PII hashing — `user_id` is sent as a plain string.

---

## TypeScript / React Example

A complete helper for initializing gtag.js and firing events:

```ts
// lib/ga4.ts

let measurementId = '';

export async function initGA4(): Promise<void> {
  if (measurementId) return;

  const res = await fetch('/wp-json/headless-google-analytics/v1/config');
  const data = await res.json();
  if (!data.measurement_id) return;

  measurementId = data.measurement_id;

  // Load gtag.js
  const script = document.createElement('script');
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  script.async = true;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag(...args: any[]) { window.dataLayer.push(args); }
  gtag('js', new Date());
  gtag('config', measurementId);
}

export async function trackEvent(
  eventName: string,
  params: Record<string, unknown> = {}
): Promise<void> {
  // Browser-side via gtag
  if (window.gtag) {
    window.gtag('event', eventName, params);
  }

  // Server-side via Measurement Protocol
  await fetch('/wp-json/headless-google-analytics/v1/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event_name: eventName,
      client_id: getGaClientId(),
      params,
    }),
  });
}

function getGaClientId(): string {
  const match = document.cookie.match(/_ga=GA\d+\.\d+\.(.+)/);
  return match ? match[1] : '';
}
```

Usage:

```tsx
// pages/product/[slug].tsx
import { useEffect } from 'react';
import { initGA4, trackEvent } from '@/lib/ga4';

export default function ProductPage({ product }) {
  useEffect(() => {
    initGA4().then(() => {
      trackEvent('view_item', {
        currency: 'USD',
        value: product.price,
        items: [{ item_id: product.sku, item_name: product.name, price: product.price }],
      });
    });
  }, [product]);

  // ...
}
```

```tsx
// components/AddToCartButton.tsx
import { trackEvent } from '@/lib/ga4';

export function AddToCartButton({ product, onAdd }) {
  const handleClick = async () => {
    await onAdd();
    trackEvent('add_to_cart', {
      currency: 'USD',
      value: product.price,
      items: [{ item_id: product.sku, item_name: product.name, price: product.price }],
    });
  };

  return <button onClick={handleClick}>Add to Cart</button>;
}
```

---

## Purchase Events

You do **not** need to call `/track` for `purchase` — the plugin fires it automatically via the `woocommerce_order_status_changed` hook when an order reaches `processing`, `on-hold`, or `completed` status. This covers all payment methods without any frontend action.

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
