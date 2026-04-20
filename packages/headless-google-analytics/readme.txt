=== Headless Google Analytics ===
Contributors: amitgurbani
Tags: google analytics, ga4, measurement protocol, woocommerce, headless
Requires at least: 6.0
Tested up to: 6.9
Requires PHP: 8.0
Stable tag: 1.2.0
License: GPL-2.0+
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Google Analytics (GA4) with WooCommerce integration and Measurement Protocol for headless WordPress stores.

== Description ==

Headless Google Analytics adds server-side GA4 Measurement Protocol support for headless WordPress stores. In a headless setup, your frontend (Next.js, Nuxt, etc.) loads gtag.js and fires browser-side events — this plugin provides the server-side counterpart that forwards events to GA4 via the Measurement Protocol.

The plugin provides REST endpoints your frontend uses to initialize gtag.js (fetching the Measurement ID) and proxy events to GA4. For WooCommerce stores, Purchase events are tracked automatically server-side via order status hooks — no frontend action required.

**Headless-first design.** This plugin does not inject any JavaScript into your WordPress theme. It is intended for stores where the storefront is a separate application and WordPress/WooCommerce is used as a backend.

== Source Code ==

The full source code, including uncompiled JavaScript and build tooling, is available at:
https://github.com/AmitGurbani/wordpress-plugins/tree/main/packages/headless-google-analytics

To build the admin JavaScript from source, clone the repository and run:

    pnpm install
    pnpm --filter headless-google-analytics build

== Features ==

* REST endpoint to expose Measurement ID for frontend gtag.js initialization
* REST endpoint to proxy browser events to GA4 Measurement Protocol with server-side enrichment
* Automatic Purchase event tracking via WooCommerce order hooks — covers all payment methods
* Per-event toggles to enable/disable individual event types
* Diagnostics tab using GA4 debug endpoint for real-time payload validation
* User ID enrichment for logged-in WordPress users

== Requirements ==

* WordPress 6.0 or higher
* PHP 8.0 or higher
* WooCommerce (optional, but required for automatic Purchase event tracking)
* A GA4 property with a Measurement Protocol API secret

== Installation ==

1. Upload the plugin files to the `/wp-content/plugins/headless-google-analytics` directory, or install the plugin through the WordPress plugins screen directly.
2. Activate the plugin through the **Plugins** screen in WordPress.
3. Go to **Settings > Permalinks** and click **Save Changes** to flush rewrite rules (recommended).
4. Go to **Google Analytics** in the admin menu and enter your GA4 Measurement ID and API Secret.

== Frequently Asked Questions ==

= Does this work without a headless frontend? =

The Measurement Protocol forwarding and WooCommerce Purchase tracking work with any WordPress setup. However, browser-side events (view_item, add_to_cart, etc.) must be fired by your frontend application — this plugin does not inject gtag.js into WordPress themes.

= Do I need to fire Purchase events from the frontend? =

No. When WooCommerce is active and the Track Purchase setting is enabled, Purchase events fire automatically when an order reaches `processing`, `on-hold`, or `completed` status. No frontend code is needed for purchases.

= Where do I find the API Secret? =

In Google Analytics, go to Admin > Data Streams > select your web stream > Measurement Protocol API secrets. Create a new secret if you don't have one.

= How do I verify my configuration? =

Use the Diagnostics tab in the plugin settings. The "Test Measurement Protocol" button sends a test event to GA4's debug endpoint, which validates your payload structure and returns any errors.

== Third Party Services ==

This plugin sends event data to Google Analytics via the [Measurement Protocol](https://developers.google.com/analytics/devguides/collection/protocol/ga4):

* **What is sent**: Event name, event parameters (product details, order value, currency), client ID, and WordPress user ID for logged-in users
* **When**: On WooCommerce order status changes (Purchase events) and when your frontend proxies events via the `/track` endpoint (if implemented)
* **Where**: `https://www.google-analytics.com/mp/collect` (Google's Measurement Protocol endpoint)

No data is sent until you configure a Measurement ID and API Secret. No PII (email, name, address) is sent to Google.

* [Google Analytics Terms of Service](https://marketingplatform.google.com/about/analytics/terms/us/)
* [Google Privacy Policy](https://policies.google.com/privacy)

== Changelog ==

= 1.0.0 =
* Initial release
* REST endpoints: `GET /config` for gtag.js initialization, `POST /track` for event proxying
* Server-side Measurement Protocol forwarding with user_id enrichment for logged-in users
* Automatic WooCommerce Purchase tracking via `woocommerce_order_status_changed` hook
* Admin settings page with General, Events, and Diagnostics tabs
* GA4 debug endpoint integration for payload validation in Diagnostics tab
