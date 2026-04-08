# Admin Guide

Setup and configuration guide for WordPress site administrators.

## Installation

1. Download the plugin zip file from [GitHub Releases](https://github.com/AmitGurbani/wordpress-plugins/releases)
2. Go to **Plugins > Add New > Upload Plugin** in WordPress admin
3. Upload the zip and click **Install Now**
4. Click **Activate**

**Required:**
- [WooCommerce](https://woocommerce.com/) must be installed and active. The plugin displays an admin notice if WooCommerce is missing.
- [Headless Auth](../../headless-auth/) must be installed and active for JWT authentication.

**Recommended:** Go to **Settings > Permalinks** and select "Post name" (or any option other than "Plain"). This enables clean REST API URLs (`/wp-json/...`). The API also works with plain permalinks using the `?rest_route=/headless-wishlist/v1/...` format.

After activation, a **Wishlist** menu item (heart icon) appears in the WordPress admin sidebar.

## Admin Page

The admin page shows an analytics dashboard with:

- **Summary cards** — Number of users with wishlists and total wishlisted items across all users
- **Popular products table** — Most wishlisted products ranked by count, showing product name and number of users who wishlisted it

This dashboard queries across all user meta to aggregate wishlist data. It is read-only — there are no configurable settings for this plugin.

## Data Storage

Wishlists are stored in WordPress user meta under the key `_headless_wishlist`. Each user's wishlist is a JSON-encoded array:

```json
[
  { "product_id": 123, "added_at": "2026-04-03T10:30:00+00:00" },
  { "product_id": 456, "added_at": "2026-04-02T08:15:00+00:00" }
]
```

- One meta entry per user via `get_user_meta` / `update_user_meta`
- The underscore prefix (`_`) hides it from the WordPress custom fields UI
- Dates are stored in ISO 8601 format using `gmdate('c', time())`
- Auto-cleanup: When a user fetches their wishlist (`GET /items`), any products that no longer exist or are unpublished are automatically removed and the cleaned list is saved back

All wishlist data is removed on plugin uninstall.

## Verifying the Setup

After installing and activating the plugin (along with WooCommerce and Headless Auth):

1. In WordPress admin: confirm the **Wishlist** menu item appears in the sidebar
2. Test the API with a JWT token:

```bash
# Get wishlist (should return empty list for a new user)
curl https://your-site.com/wp-json/headless-wishlist/v1/items \
  -H "Authorization: Bearer $JWT"
```

Expected response:

```json
{
  "items": []
}
```

3. Add a test product (use a valid WooCommerce product ID):

```bash
curl -X POST https://your-site.com/wp-json/headless-wishlist/v1/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT" \
  -d '{"product_id": 123}'
```

## Troubleshooting

### 404 on API endpoints

1. If using pretty permalinks: go to **Settings > Permalinks** and click **Save Changes** (this flushes rewrite rules)
2. If using plain permalinks: replace `/wp-json/headless-wishlist/v1/...` with `?rest_route=/headless-wishlist/v1/...`
3. Confirm the plugin is activated in **Plugins** list

### 401 Unauthorized

All wishlist endpoints require a valid JWT token from Headless Auth. Verify:
- Headless Auth plugin is installed and activated
- You have a valid, non-expired JWT token
- The token is passed in the `Authorization: Bearer <token>` header

### "WooCommerce is required" notice

The plugin requires WooCommerce for product validation. Install and activate WooCommerce, then reactivate this plugin.

### Products not appearing in wishlist

- Only published WooCommerce products (`post_type: product`, `post_status: publish`) can be added
- Products that are deleted or unpublished after being wishlisted are automatically removed on the next `GET /items` call
- Check the product ID exists: visit `/wp-json/wc/v3/products/{id}` to verify

### Wishlist full error

The default maximum is 100 items per user. This can be changed via the `headless_wishlist_max_items` filter in a custom plugin or theme's `functions.php`:

```php
add_filter( 'headless_wishlist_max_items', function() { return 50; } );
```
