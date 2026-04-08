# Integration Guide

Headless Wishlist provides a REST API for managing per-user product wishlists in headless WordPress/WooCommerce stores. Wishlist data is stored in WordPress user meta and all endpoints require JWT authentication via [Headless Auth](../../headless-auth/).

## Overview

```
Frontend (Next.js, React Native, etc.)     WordPress + WooCommerce
───────────────────────────────────────    ──────────────────────────────
POST /items  ────────────────────────────→ Add product to wishlist
GET  /items  ────────────────────────────→ List wishlist (auto-cleans stale)
DELETE /items/{product_id}  ─────────────→ Remove product
DELETE /items  ──────────────────────────→ Clear entire wishlist
GET  /analytics/popular  ────────────────→ Top wishlisted products (admin)
```

**Base URL:** `https://your-site.com/wp-json/headless-wishlist/v1`

If the site uses plain permalinks: `https://your-site.com/?rest_route=/headless-wishlist/v1`

**Key design points:**
- Per-user wishlists stored in `_headless_wishlist` user meta as a JSON array
- All `/items` endpoints require JWT — any logged-in user (`read` capability)
- Stale products (deleted or unpublished) are automatically removed on read
- Max 100 items per wishlist by default, configurable via `headless_wishlist_max_items` filter

---

## Authentication

All `/items` endpoints require a valid JWT token issued by the [Headless Auth](../../headless-auth/) plugin. Pass the token in the `Authorization` header:

```
Authorization: Bearer <JWT>
```

Any logged-in WordPress user can manage their own wishlist (requires `read` capability). The `/analytics/popular` endpoint requires `manage_options` (Administrator only).

See the [Headless Auth Integration Guide](../../headless-auth/docs/integration-guide.md) for how to obtain a JWT token.

---

## Quick Start

### 1. Add a product to the wishlist

```bash
curl -X POST https://your-site.com/wp-json/headless-wishlist/v1/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT" \
  -d '{"product_id": 123}'
```

### 2. Get the wishlist

```bash
curl https://your-site.com/wp-json/headless-wishlist/v1/items \
  -H "Authorization: Bearer $JWT"
```

### 3. Remove a product

```bash
curl -X DELETE https://your-site.com/wp-json/headless-wishlist/v1/items/123 \
  -H "Authorization: Bearer $JWT"
```

---

## API Reference

### GET /items

Returns the authenticated user's wishlist, ordered by most recently added. Products that no longer exist or are unpublished are automatically removed from the list and the cleaned result is persisted.

#### Request

```bash
curl https://your-site.com/wp-json/headless-wishlist/v1/items \
  -H "Authorization: Bearer $JWT"
```

#### Success Response (200)

```json
{
  "items": [
    { "product_id": 456, "slug": "brown-rice-5kg", "added_at": "2026-04-03T08:15:00+00:00" },
    { "product_id": 123, "slug": "organic-honey", "added_at": "2026-04-02T10:30:00+00:00" }
  ]
}
```

---

### POST /items

Add a product to the wishlist.

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `product_id` | number | Yes | WooCommerce product ID to add |

#### Request

```bash
curl -X POST https://your-site.com/wp-json/headless-wishlist/v1/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT" \
  -d '{"product_id": 123}'
```

#### Success Response (201)

```json
{
  "success": true,
  "item": { "product_id": 123, "slug": "organic-honey", "added_at": "2026-04-03T10:30:00+00:00" }
}
```

#### Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 400 | `missing_product_id` | `product_id` field is required |
| 404 | `product_not_found` | No published product with this ID exists |
| 409 | `already_exists` | Product is already in the wishlist |
| 400 | `wishlist_full` | Maximum wishlist size reached (default: 100) |

---

### DELETE /items/{product_id}

Remove a specific product from the wishlist.

#### Request

```bash
curl -X DELETE https://your-site.com/wp-json/headless-wishlist/v1/items/123 \
  -H "Authorization: Bearer $JWT"
```

#### Success Response (200)

```json
{
  "success": true
}
```

#### Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 404 | `not_found` | Product is not in the wishlist |

---

### DELETE /items

Clear the entire wishlist for the authenticated user.

#### Request

```bash
curl -X DELETE https://your-site.com/wp-json/headless-wishlist/v1/items \
  -H "Authorization: Bearer $JWT"
```

#### Success Response (200)

```json
{
  "success": true
}
```

---

### GET /analytics/popular (admin only)

Returns the most wishlisted products across all users. Requires `manage_options` capability (Administrator only). Returns the top 20 products, aggregated via `$wpdb` across all user meta.

#### Request

```bash
curl https://your-site.com/wp-json/headless-wishlist/v1/analytics/popular \
  -H "Authorization: Bearer $ADMIN_JWT"
```

#### Success Response (200)

```json
{
  "popular": [
    { "product_id": 123, "name": "Organic Honey", "slug": "organic-honey", "count": 42 },
    { "product_id": 456, "name": "Brown Rice 5kg", "slug": "brown-rice-5kg", "count": 31 }
  ],
  "total_users": 150,
  "total_items": 487
}
```

---

## Error Reference

All errors follow the WordPress REST API error format:

```json
{
  "code": "already_exists",
  "message": "This product is already in your wishlist.",
  "data": { "status": 409 }
}
```

| Code | Status | Description |
|------|--------|-------------|
| `missing_product_id` | 400 | `product_id` is required |
| `product_not_found` | 404 | No published product with this ID |
| `already_exists` | 409 | Product already in wishlist |
| `wishlist_full` | 400 | Maximum items per wishlist exceeded |
| `not_found` | 404 | Product not in wishlist |

---

## Extensibility

### `headless_wishlist_max_items` filter

Cap the maximum number of items per wishlist (default: 100).

```php
add_filter( 'headless_wishlist_max_items', function() { return 50; } );
```

---

## TypeScript / React Example

A complete wishlist client for a headless frontend:

```ts
// lib/wishlist.ts

const BASE = '/wp-json/headless-wishlist/v1';

interface WishlistItem {
  product_id: number;
  slug: string;
  added_at: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getJwtToken(); // Your JWT storage
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message ?? `HTTP ${res.status}`);
  }
  return res.json();
}

/** Get the current user's wishlist */
export function getWishlist() {
  return request<{ items: WishlistItem[] }>('/items');
}

/** Add a product to the wishlist */
export function addToWishlist(productId: number) {
  return request<{ success: boolean; item: WishlistItem }>('/items', {
    method: 'POST',
    body: JSON.stringify({ product_id: productId }),
  });
}

/** Remove a product from the wishlist */
export function removeFromWishlist(productId: number) {
  return request<{ success: boolean }>(`/items/${productId}`, {
    method: 'DELETE',
  });
}

/** Clear the entire wishlist */
export function clearWishlist() {
  return request<{ success: boolean }>('/items', {
    method: 'DELETE',
  });
}
```

Usage in a React component:

```tsx
import { useState, useEffect } from 'react';
import { getWishlist, addToWishlist, removeFromWishlist } from '@/lib/wishlist';

function WishlistButton({ productId }: { productId: number }) {
  const [inWishlist, setInWishlist] = useState(false);

  useEffect(() => {
    getWishlist().then(({ items }) => {
      setInWishlist(items.some((i) => i.product_id === productId));
    });
  }, [productId]);

  const toggle = async () => {
    if (inWishlist) {
      await removeFromWishlist(productId);
      setInWishlist(false);
    } else {
      await addToWishlist(productId);
      setInWishlist(true);
    }
  };

  return (
    <button onClick={toggle}>
      {inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
    </button>
  );
}
```
