=== Headless Orders ===
Contributors: amitgurbani
Tags: woocommerce, orders, rest-api, headless, jwt
Requires at least: 6.2
Tested up to: 6.9
Requires PHP: 8.0
Stable tag: 1.0.0
Requires Plugins: woocommerce
License: GPL-2.0+
License URI: https://www.gnu.org/licenses/gpl-2.0.html

REST API for authenticated customers to list their WooCommerce orders.

== Description ==

Headless Orders adds a single REST endpoint that lets authenticated customers
retrieve their own WooCommerce orders. It pairs with the existing WooCommerce
Store API single-order endpoint (`/wc/store/v1/order/{id}`) to provide a
complete order-browsing experience for headless storefronts.

**Endpoint:** `GET /wp-json/headless-orders/v1/orders`

**Features:**

* JWT Bearer-token authentication (via Headless Auth plugin)
* Pagination with `per_page` and `page` query parameters
* Filter by order status (pending, processing, completed, etc.)
* Returns billing/shipping addresses, line items, totals, and currency
* `X-WP-Total` and `X-WP-TotalPages` response headers
* Customers can only access their own orders — never other customers' data

== Installation ==

1. Upload the `headless-orders` folder to `/wp-content/plugins/`.
2. Activate the plugin through the **Plugins** menu in WordPress.
3. Ensure **WooCommerce** is installed and active.
4. Ensure a JWT authentication plugin (e.g., Headless Auth) is active.
5. Make authenticated `GET` requests to `/wp-json/headless-orders/v1/orders`.

== Frequently Asked Questions ==

= Does this plugin require WooCommerce? =

Yes. WooCommerce must be installed and active for the orders endpoint to work.

= How does authentication work? =

The plugin relies on JWT authentication provided by a companion plugin (e.g.,
Headless Auth). The JWT token must be sent as a `Bearer` token in the
`Authorization` header. The plugin itself does not issue tokens.

= Can a customer see other customers' orders? =

No. The endpoint strictly filters by the authenticated user's ID. There is no
way for one customer to access another's orders.

== Changelog ==

= 1.0.0 =
* Initial release.
