# Admin Guide

Setup guide for WordPress site administrators.

## Installation

1. Download the plugin zip file from [GitHub Releases](https://github.com/AmitGurbani/wordpress-plugins/releases)
2. Go to **Plugins > Add New > Upload Plugin** in WordPress admin
3. Upload the zip and click **Install Now**
4. Click **Activate**

**Required:**
- [WooCommerce](https://woocommerce.com/) must be installed and active. The plugin displays an admin notice if WooCommerce is missing.
- [Headless Auth](../../headless-auth/) must be installed and active for JWT authentication.

**Recommended:** Go to **Settings > Permalinks** and select "Post name" (or any option other than "Plain"). This enables clean REST API URLs (`/wp-json/...`). The API also works with plain permalinks using the `?rest_route=/headless-orders/v1/...` format.

## Zero Configuration

This plugin has no admin settings page and no configuration options. Once activated alongside WooCommerce and Headless Auth, the `/orders` endpoint is available immediately.

## How It Works

1. A customer's frontend sends `GET /wp-json/headless-orders/v1/orders` with a JWT Bearer token
2. Headless Auth resolves the JWT to a WordPress user ID
3. The plugin queries WooCommerce for that customer's orders via `wc_get_orders()`
4. Orders are returned as JSON with billing, shipping, and line item details

The plugin does not store any data of its own. It queries WooCommerce orders in real-time for the authenticated customer.

## Verifying the Setup

After installing and activating the plugin (along with WooCommerce and Headless Auth):

1. Confirm the plugin is active in the **Plugins** list
2. Test the API with a JWT token:

```bash
# Get orders (should return empty array if customer has no orders)
curl https://your-site.com/wp-json/headless-orders/v1/orders \
  -H "Authorization: Bearer $JWT"
```

Expected response:

```json
[]
```

Response headers will include `X-WP-Total: 0` and `X-WP-TotalPages: 1`.

## Troubleshooting

### 404 on API endpoints

1. If using pretty permalinks: go to **Settings > Permalinks** and click **Save Changes** (this flushes rewrite rules)
2. If using plain permalinks: replace `/wp-json/headless-orders/v1/...` with `?rest_route=/headless-orders/v1/...`
3. Confirm the plugin is activated in **Plugins** list

### 401 Unauthorized

The orders endpoint requires a valid JWT token from Headless Auth. Verify:
- Headless Auth plugin is installed and activated
- You have a valid, non-expired JWT token
- The token is passed in the `Authorization: Bearer <token>` header

### 503 "WooCommerce is not active"

WooCommerce must be installed and activated. The endpoint checks for WooCommerce at runtime and returns this error if it is missing.

### Empty orders list

- The endpoint only returns orders for the authenticated customer — verify the JWT belongs to a customer with orders
- Check the WooCommerce **Orders** page in admin to confirm orders exist for this customer
- If filtering by status, verify the status value is valid (`pending`, `processing`, `completed`, `cancelled`, `refunded`, `failed`, `on-hold`)
- Orders are returned newest first — older orders may be on later pages
