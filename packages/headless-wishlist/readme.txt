=== Headless Wishlist ===
Contributors: amitgurbani
Tags: woocommerce, wishlist, rest-api, headless, ecommerce
Requires at least: 6.0
Tested up to: 6.9
Requires PHP: 8.0
Stable tag: 1.0.0
License: GPL-2.0+
License URI: https://www.gnu.org/licenses/gpl-2.0.html

REST API wishlist for headless WordPress stores.

== Description ==

Headless Wishlist provides a REST API for managing per-user product wishlists in headless WooCommerce stores. Users can add, remove, and list wishlist items via REST endpoints — designed for headless storefronts and mobile apps.

Wishlist data is stored in user meta as a JSON array. Stale products (deleted or unpublished) are automatically cleaned on read. An admin-only analytics endpoint shows the most wishlisted products across all users.

**Headless-first design.** This plugin does not add wishlist buttons or pages to your WordPress theme. Your frontend application (Next.js, React Native, etc.) calls the REST endpoints directly.

== Features ==

* REST API endpoints to add, remove, list, and clear wishlist items
* Per-user wishlists stored in user meta (no custom tables)
* Automatic stale product cleanup on read (removes deleted or unpublished products)
* Configurable max items per wishlist (default 100, filterable via `headless_wishlist_max_items`)
* Admin-only analytics endpoint showing top 20 most wishlisted products across all users
* React admin page displaying wishlist analytics
* Duplicate detection (409 Conflict when adding an already-wishlisted product)

== Requirements ==

* WordPress 6.0 or higher
* PHP 8.0 or higher
* WooCommerce (required)

== Installation ==

1. Upload the plugin files to the `/wp-content/plugins/headless-wishlist` directory, or install the plugin through the WordPress plugins screen directly.
2. Activate the plugin through the **Plugins** screen in WordPress.
3. Use the REST API endpoints from your headless frontend to manage wishlists.

== Frequently Asked Questions ==

= How are wishlists stored? =

Each user's wishlist is stored as a JSON array in the `_headless_wishlist` user meta field. Each entry contains a `product_id` and `added_at` timestamp.

= What happens when a product is deleted? =

When a user fetches their wishlist via `GET /items`, any products that no longer exist or are unpublished are automatically removed from the list. The cleaned list is persisted back to user meta.

= Is there a maximum wishlist size? =

Yes, the default limit is 100 items per user. You can change this with the `headless_wishlist_max_items` filter in your theme or another plugin.

= What authentication is required? =

All wishlist endpoints require an authenticated user (JWT via headless-auth or any WordPress authentication). The `read` capability is sufficient — any logged-in user can manage their own wishlist.

== Changelog ==

= 1.0.0 =
* Initial release
* REST endpoints: GET/POST/DELETE /items for wishlist management
* Admin-only GET /analytics/popular endpoint
* Automatic stale product cleanup on read
* React admin analytics page
