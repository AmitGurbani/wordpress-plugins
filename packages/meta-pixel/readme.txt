=== Meta Pixel ===
Contributors: wpts
Tags: meta pixel, facebook pixel, conversions api, capi, woocommerce, headless
Requires at least: 6.0
Tested up to: 6.7
Requires PHP: 8.0
Stable tag: 1.0.0
License: GPL-2.0+
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Meta Pixel with WooCommerce integration and Conversions API (CAPI) for headless WordPress stores.

== Description ==

Meta Pixel adds server-side Conversions API (CAPI) support for headless WordPress stores. In a headless setup, your frontend (Next.js, Nuxt, etc.) loads the Meta Pixel JS and fires browser-side `fbq()` calls — this plugin provides the server-side counterpart that forwards events to Meta's CAPI with enriched server data.

The plugin provides REST endpoints your frontend uses to initialize the pixel (fetching the Pixel ID) and proxy events to CAPI. Both sides fire the same event ID so Meta can deduplicate across browser and server, improving attribution accuracy.

For WooCommerce stores, Purchase events are tracked automatically server-side via order status hooks — no frontend action required. All PII (email, name, address) sent to CAPI is SHA-256 hashed following Meta's requirements.

**Headless-first design.** This plugin does not inject any JavaScript into your WordPress theme. It is intended for stores where the storefront is a separate application and WordPress/WooCommerce is used as a backend.

== Features ==

* REST endpoint to expose Pixel ID for frontend `fbq('init')` initialization
* REST endpoint to proxy browser events to CAPI with server-side enrichment (IP address, User-Agent, logged-in user data)
* Automatic Purchase event tracking via WooCommerce order hooks — covers all payment methods
* SHA-256 hashing of all PII (email, name, phone, address) before sending to CAPI
* Event deduplication using matching `event_id` in browser pixel and CAPI calls
* Per-event toggles to enable/disable individual event types
* Test event code support for verifying CAPI connection via Meta Events Manager
* Diagnostics tab to test CAPI connection and view last error from the WordPress admin

== Requirements ==

* WordPress 6.0 or higher
* PHP 8.0 or higher
* WooCommerce (optional, but required for automatic Purchase event tracking)
* A Meta Pixel and Conversions API access token from Meta Events Manager

== Installation ==

1. Upload the plugin files to the `/wp-content/plugins/meta-pixel` directory, or install the plugin through the WordPress plugins screen directly.
2. Activate the plugin through the **Plugins** screen in WordPress.
3. Go to **Settings > Permalinks** and click **Save Changes** to flush rewrite rules (recommended).
4. Go to **Meta Pixel** in the admin menu and enter your Pixel ID and Conversions API Access Token.

== Frequently Asked Questions ==

= Does this work without a headless frontend? =

The CAPI forwarding and WooCommerce Purchase tracking work with any WordPress setup. However, the browser-side pixel (ViewContent, AddToCart, etc.) must be fired by your frontend application — this plugin does not inject the Meta Pixel JS into WordPress themes.

= Do I need to fire Purchase events from the frontend? =

No. When WooCommerce is active and the Track Purchase setting is enabled, Purchase events fire automatically when an order reaches `processing`, `on-hold`, or `completed` status. No frontend code is needed for purchases.

= What is the Test Event Code for? =

During development, set a Test Event Code from Meta Events Manager to verify your CAPI connection. Events sent with a test code appear in the Test Events tool in Events Manager without affecting your real conversion data. Remove the test event code before going to production.

= How does event deduplication work? =

Your frontend generates a UUID and passes it to both `fbq('track', eventName, data, { eventID: uuid })` and to the `/track` endpoint as `event_id`. Meta automatically deduplicates when it receives the same `event_name` + `event_id` pair from both browser and server within 48 hours.

== Changelog ==

= 1.0.0 =
* Initial release
* REST endpoints: `GET /config` for pixel initialization, `POST /track` for event proxying
* Server-side CAPI forwarding with IP, User-Agent, and logged-in user data enrichment
* Automatic WooCommerce Purchase tracking via `woocommerce_order_status_changed` hook
* SHA-256 PII hashing for order and user data
* Admin settings page with General, Events, and Diagnostics tabs
* Test event code support and CAPI connection test in Diagnostics tab
