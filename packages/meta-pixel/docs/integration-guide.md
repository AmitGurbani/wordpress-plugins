# Integration Guide

Meta Pixel provides REST API endpoints for headless WordPress stores. The frontend handles browser-side pixel JS (`fbq()` calls); this plugin handles server-side Conversions API (CAPI) forwarding with server data enrichment. Both sides fire the same `event_id` so Meta can deduplicate automatically.

## Overview

```
Frontend (Next.js, Nuxt, etc.)           WordPress / WooCommerce
──────────────────────────────           ──────────────────────────────────
GET /config  ──────────────────────────→ returns { pixel_id }
fbq('init', pixelId)
fbq('track', 'ViewContent', data, { eventID: uuid })
POST /track { event_name, event_id: uuid, ... } ──→ CAPI
                                         (Purchase also fires automatically
                                          via WooCommerce order hooks)
```

**Base URL:** `https://your-site.com/wp-json/meta-pixel/v1`

If the site uses plain permalinks: `https://your-site.com/?rest_route=/meta-pixel/v1`

---

## GET /config

Returns the Pixel ID for browser-side initialization. Public — no authentication required.

### Request

```http
GET /wp-json/meta-pixel/v1/config
```

### Response

```json
{
  "pixel_id": "1234567890123456"
}
```

### Usage

```ts
const res = await fetch('/wp-json/meta-pixel/v1/config');
const { pixel_id } = await res.json();

fbq('init', pixel_id);
fbq('track', 'PageView');
```

If `pixel_id` is empty, the plugin is not yet configured — skip initialization.

---

## POST /track

Proxies browser events to Meta's Conversions API with server-side data enrichment. Public — no authentication required.

### Request

```http
POST /wp-json/meta-pixel/v1/track
Content-Type: application/json
```

```json
{
  "event_name": "ViewContent",
  "event_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "event_source_url": "https://store.com/product/blue-shirt",
  "custom_data": {
    "content_ids": ["SHIRT-001"],
    "content_type": "product",
    "value": 29.99,
    "currency": "USD"
  },
  "_fbp": "fb.1.1708123456789.987654321",
  "_fbc": "fb.1.1708123456789.AbCdEfGh"
}
```

### Request Fields

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| `event_name` | string | Yes | Event type (see supported events below) |
| `event_id` | string | Yes | UUID matching the `eventID` in your `fbq()` call — used for deduplication |
| `event_source_url` | string | No | Full URL of the page where the event occurred |
| `custom_data` | object | No | Event-specific data (see allowed keys below) |
| `_fbp` | string | No | Meta browser cookie value (`_fbp`) |
| `_fbc` | string | No | Meta click ID cookie value (`_fbc`) |

### Supported Events

| `event_name` | Typical trigger | `custom_data` fields |
| ------------ | --------------- | -------------------- |
| `ViewContent` | Product page view | `content_ids`, `content_type`, `value`, `currency` |
| `AddToCart` | Add to cart button | `content_ids`, `content_type`, `value`, `currency`, `contents` |
| `InitiateCheckout` | Checkout page load | `value`, `currency`, `num_items` |
| `Purchase` | Order confirmation | `value`, `currency`, `order_id`, `content_ids`, `contents` |
| `Search` | Search results page | `search_string` |

### Allowed `custom_data` Keys

Only these keys are forwarded to CAPI (all others are silently dropped to prevent data pollution via the public endpoint):

`currency`, `value`, `content_type`, `contents`, `content_ids`, `search_string`, `num_items`, `order_id`

### Response

```json
{
  "success": true,
  "event_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

The `event_id` echo lets you confirm which event was processed.

### Error Responses

| Code | HTTP Status | Cause |
| ---- | ----------- | ----- |
| `capi_disabled` | 403 | CAPI master toggle is off in settings |
| `missing_params` | 400 | `event_name` or `event_id` not provided |
| `invalid_event` | 400 | `event_name` is not one of the five supported types |
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

## Event Deduplication

Meta automatically deduplicates when it receives the same `event_name` + `event_id` pair from both the browser pixel and the Conversions API within a 48-hour window.

**Your responsibility:** generate a UUID on the frontend and pass it to both `fbq()` and `/track`:

```ts
const eventId = crypto.randomUUID(); // or use uuid package

// Browser pixel
fbq('track', 'ViewContent', customData, { eventID: eventId });

// Server-side CAPI (same eventId)
await fetch('/wp-json/meta-pixel/v1/track', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    event_name: 'ViewContent',
    event_id: eventId,
    event_source_url: window.location.href,
    custom_data: customData,
    _fbp: getCookie('_fbp'),
    _fbc: getCookie('_fbc'),
  }),
});
```

---

## Cookie Fields

Meta sets two cookies on your storefront domain that improve attribution accuracy:

| Cookie | Description |
| ------ | ----------- |
| `_fbp` | Meta browser ID — set when the Meta Pixel JS loads on your site |
| `_fbc` | Click ID — set when a user clicks a Meta ad with `fbclid` in the URL |

Read them client-side:

```ts
function getCookie(name: string): string {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : '';
}
```

Pass both to `/track`. If a cookie doesn't exist, omit the field (the plugin skips empty values).

---

## Logged-In User Enrichment

When the request comes from a logged-in WordPress user, the plugin automatically adds hashed PII from the user's account to the CAPI payload — no extra fields needed in the `/track` request body:

| CAPI field | Source |
| ---------- | ------ |
| `em` | User email (SHA-256, lowercased) |
| `fn` | First name (SHA-256, lowercased) |
| `ln` | Last name (SHA-256, lowercased) |
| `external_id` | WordPress user ID (SHA-256) |

This works for any authenticated request (cookie-based sessions or JWT via headless auth plugins).

---

## TypeScript / React Example

A complete helper for initializing the pixel and firing events:

```tsx
// lib/meta-pixel.ts

let initialized = false;

export async function initPixel(): Promise<void> {
  if (initialized) return;
  const res = await fetch('/wp-json/meta-pixel/v1/config');
  const { pixel_id } = await res.json();
  if (!pixel_id) return;

  fbq('init', pixel_id);
  fbq('track', 'PageView');
  initialized = true;
}

export async function trackEvent(
  eventName: string,
  customData: Record<string, unknown> = {},
  sourceUrl?: string
): Promise<void> {
  const eventId = crypto.randomUUID();

  // Browser pixel
  fbq('track', eventName, customData, { eventID: eventId });

  // Server-side CAPI
  await fetch('/wp-json/meta-pixel/v1/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event_name: eventName,
      event_id: eventId,
      event_source_url: sourceUrl ?? window.location.href,
      custom_data: customData,
      _fbp: getCookie('_fbp'),
      _fbc: getCookie('_fbc'),
    }),
  });
}

function getCookie(name: string): string {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : '';
}
```

Usage:

```tsx
// pages/product/[slug].tsx
import { useEffect } from 'react';
import { initPixel, trackEvent } from '@/lib/meta-pixel';

export default function ProductPage({ product }) {
  useEffect(() => {
    initPixel().then(() => {
      trackEvent('ViewContent', {
        content_ids: [product.sku],
        content_type: 'product',
        value: product.price,
        currency: 'USD',
      });
    });
  }, [product]);

  // ...
}
```

```tsx
// components/AddToCartButton.tsx
import { trackEvent } from '@/lib/meta-pixel';

export function AddToCartButton({ product, onAdd }) {
  const handleClick = async () => {
    await onAdd();
    trackEvent('AddToCart', {
      content_ids: [product.sku],
      content_type: 'product',
      value: product.price,
      currency: 'USD',
    });
  };

  return <button onClick={handleClick}>Add to Cart</button>;
}
```

---

## Purchase Events

You do **not** need to call `/track` for `Purchase` — the plugin fires it automatically via the `woocommerce_order_status_changed` hook when an order reaches `processing`, `on-hold`, or `completed` status. This covers all payment methods without any frontend action.

If your frontend also fires a `Purchase` event via `/track` (e.g., on the order confirmation page), use the WooCommerce order ID as the `event_id` prefix — e.g., `order_12345` — to match the server-side event ID and let Meta deduplicate.
