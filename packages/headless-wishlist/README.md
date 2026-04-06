# Headless Wishlist

REST API wishlist plugin for headless WordPress/WooCommerce stores. Stores wishlisted product IDs per user in WordPress user meta and exposes CRUD endpoints authenticated via JWT.

## Requirements

- WordPress 6.0+
- PHP 8.0+
- WooCommerce (required)
- [Headless Auth](../headless-auth/) for JWT authentication

## API Reference

All endpoints require `Authorization: Bearer <JWT>` header (issued by headless-auth). Returns 401 if missing or invalid.

### `GET /wp-json/headless-wishlist/v1/items`

Returns the authenticated user's wishlist, ordered by most recently added.

```json
{
  "items": [
    { "product_id": 456, "slug": "brown-rice-5kg", "added_at": "2026-04-03T08:15:00+00:00" },
    { "product_id": 123, "slug": "organic-honey", "added_at": "2026-04-02T10:30:00+00:00" }
  ]
}
```

Products that no longer exist or are unpublished are automatically removed from the list.

### `POST /wp-json/headless-wishlist/v1/items`

Add a product to the wishlist.

**Request:** `{ "product_id": 123 }`

**Response (201):** `{ "success": true, "item": { "product_id": 123, "slug": "organic-honey", "added_at": "..." } }`

**Errors:** 400 (missing product_id), 404 (product not found), 409 (already in wishlist)

### `DELETE /wp-json/headless-wishlist/v1/items/{product_id}`

Remove a product from the wishlist.

**Response (200):** `{ "success": true }`

**Errors:** 404 (not in wishlist)

### `DELETE /wp-json/headless-wishlist/v1/items`

Clear the entire wishlist.

**Response (200):** `{ "success": true }`

### `GET /wp-json/headless-wishlist/v1/analytics/popular` (admin only)

Returns the most wishlisted products across all users. Requires `manage_options` capability.

```json
{
  "popular": [
    { "product_id": 123, "name": "Organic Honey", "slug": "organic-honey", "count": 42 }
  ],
  "total_users": 150,
  "total_items": 487
}
```

## Admin Page

WordPress admin menu item "Wishlist" (dashicons-heart) shows an analytics dashboard with:
- Summary cards: users with wishlists, total wishlisted items
- Table: most wishlisted products ranked by count

## Extensibility

**`headless_wishlist_max_items`** filter — cap the maximum number of items per wishlist (default: 100).

```php
add_filter( 'headless_wishlist_max_items', function() { return 50; } );
```

## Development

```bash
pnpm build          # Build plugin to dist/
pnpm dev            # Watch mode
pnpm wp-env:start   # Local WordPress (Docker, http://localhost:8888)
```

Built with [wpts](../wpts/) — TypeScript source in `src/`, generated PHP in `dist/`.
