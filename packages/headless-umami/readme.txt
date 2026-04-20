=== Headless Umami ===
Contributors: amitgurbani
Tags: umami, analytics, woocommerce, headless, privacy
Requires at least: 6.0
Tested up to: 6.9
Requires PHP: 8.0
Stable tag: 1.2.0
License: GPL-2.0+
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Umami Analytics with WooCommerce purchase tracking for headless WordPress stores.

== Description ==

Headless Umami integrates your headless WordPress store with [Umami Analytics](https://umami.is), a privacy-focused, open-source analytics platform. It serves your Umami configuration to your headless frontend and automatically tracks WooCommerce purchases server-side.

In a headless setup, your frontend (Next.js, Nuxt, etc.) loads the Umami tracking script and handles all browser-side analytics — page views, custom events, and user identification. This plugin provides:

1. A REST endpoint your frontend uses to fetch the Umami URL and Website ID for script initialization.
2. Automatic server-side Purchase event tracking via WooCommerce order hooks — no frontend code needed.

**Privacy-first.** Umami does not collect personal information. No PII (email, name, address) is sent to Umami. No cookies are used by the tracking script.

**Headless-first design.** This plugin does not inject any JavaScript into your WordPress theme. It is intended for stores where the storefront is a separate application and WordPress/WooCommerce is used as a backend.

== Source Code ==

The full source code, including uncompiled JavaScript and build tooling, is available at:
https://github.com/AmitGurbani/wordpress-plugins/tree/main/packages/headless-umami

To build the admin JavaScript from source, clone the repository and run:

    pnpm install
    pnpm --filter headless-umami build

== Features ==

* REST endpoint to expose Umami URL and Website ID for frontend script initialization
* Automatic WooCommerce Purchase event tracking via `woocommerce_order_status_changed` hook
* Supports both Umami Cloud (cloud.umami.is) and self-hosted Umami instances
* Purchase deduplication to prevent double-sends across order status transitions
* Admin settings page with connection diagnostics
* No cookies, no PII collection — fully GDPR-friendly

== Requirements ==

* WordPress 6.0 or higher
* PHP 8.0 or higher
* WooCommerce (optional, but required for automatic Purchase event tracking)
* An Umami instance (cloud or self-hosted) with a Website ID

== Installation ==

1. Upload the plugin files to the `/wp-content/plugins/headless-umami` directory, or install the plugin through the WordPress plugins screen directly.
2. Activate the plugin through the **Plugins** screen in WordPress.
3. Go to **Umami Analytics** in the admin menu and enter your Umami URL and Website ID.
4. In your headless frontend, fetch `GET /wp-json/headless-umami/v1/config` and use the returned values to load the Umami tracking script.

== Frequently Asked Questions ==

= Does this work without a headless frontend? =

The WooCommerce Purchase tracking works with any WordPress setup. However, browser-side analytics (page views, custom events) require your frontend to load the Umami tracking script — this plugin does not inject JavaScript into WordPress themes.

= Do I need to fire Purchase events from the frontend? =

No. When WooCommerce is active and Purchase tracking is enabled, Purchase events fire automatically when an order reaches `processing`, `on-hold`, or `completed` status. No frontend code is needed for purchases.

= Does this work with self-hosted Umami? =

Yes. Enter your self-hosted Umami instance URL in the settings (e.g., `https://analytics.yourdomain.com`). For Umami Cloud, use `https://cloud.umami.is`.

= Is this GDPR compliant? =

Umami is designed to be privacy-friendly. It does not use cookies, does not collect personal information, and does not track users across websites. This plugin does not send any PII (email, phone, name, address) to Umami.

== Third Party Services ==

This plugin sends event data to your [Umami Analytics](https://umami.is) instance:

* **What is sent**: Event name and event data (product details, order value, currency). No PII (email, phone, name, address) is ever sent.
* **When**: On WooCommerce order status changes (Purchase events)
* **Where**: The Umami URL you configure in plugin settings (e.g., `https://cloud.umami.is` for Umami Cloud or your self-hosted instance)

No data is sent until you configure a Umami URL and Website ID. Umami is privacy-focused — no cookies, no personal data collection.

* [Umami Privacy Policy](https://umami.is/privacy)
* [Umami Terms of Service](https://umami.is/terms)

== Changelog ==

= 1.0.0 =
* Initial release
* REST endpoint: `GET /config` for Umami script initialization
* Automatic WooCommerce Purchase tracking via `woocommerce_order_status_changed` hook
* Admin settings page with General and Diagnostics tabs
* Connection test and error logging in Diagnostics tab
