=== Headless Clarity ===
Contributors: amitgurbani
Tags: clarity, microsoft, analytics, heatmaps, headless
Requires at least: 6.0
Tested up to: 6.9
Requires PHP: 8.0
Stable tag: 1.2.0
License: GPL-2.0+
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Microsoft Clarity session recordings and heatmaps for headless WordPress stores.

== Description ==

Headless Clarity integrates your headless WordPress store with [Microsoft Clarity](https://clarity.microsoft.com), a free behavioral analytics tool offering session recordings and heatmaps. It serves your Clarity configuration to your headless frontend via a REST endpoint.

In a headless setup, your frontend (Next.js, Nuxt, etc.) loads the Clarity tracking script and handles all browser-side analytics — session recordings, heatmaps, and custom events. This plugin provides:

1. A REST endpoint your frontend uses to fetch the Clarity Project ID for script initialization.
2. Optional user identity data (ID and display name) for Clarity's `identify()` API.

**Headless-first design.** This plugin does not inject any JavaScript into your WordPress theme. It is intended for stores where the storefront is a separate application and WordPress/WooCommerce is used as a backend.

**No server-side tracking.** Clarity is a client-side tool — session recordings and heatmaps require a browser. There is no server-side event API. All tracking is handled by your frontend via the Clarity JavaScript API.

== Source Code ==

The full source code, including uncompiled JavaScript and build tooling, is available at:
https://github.com/AmitGurbani/wordpress-plugins/tree/main/packages/headless-clarity

To build the admin JavaScript from source, clone the repository and run:

    pnpm install
    pnpm --filter headless-clarity build

== Features ==

* REST endpoint to expose Clarity Project ID for frontend script initialization
* Optional user identification for Clarity's `identify()` API
* Admin settings page with diagnostics
* Works alongside other analytics plugins (GA4, Meta Pixel, Umami)
* Clarity auto-detects GA4 eCommerce dataLayer events for product insights

== Requirements ==

* WordPress 6.0 or higher
* PHP 8.0 or higher
* A Microsoft Clarity project (free at clarity.microsoft.com)

== Installation ==

1. Upload the plugin files to the `/wp-content/plugins/headless-clarity` directory, or install the plugin through the WordPress plugins screen directly.
2. Activate the plugin through the **Plugins** screen in WordPress.
3. Go to **Microsoft Clarity** in the admin menu and enter your Clarity Project ID.
4. In your headless frontend, fetch `GET /wp-json/headless-clarity/v1/config` and use the returned `project_id` to load the Clarity tracking script.

== Frequently Asked Questions ==

= Where do I find my Clarity Project ID? =

Log in to [clarity.microsoft.com](https://clarity.microsoft.com), select your project, and go to Settings > Overview. The Project ID is a 10-character alphanumeric string.

= Does this track WooCommerce purchases? =

Clarity has no server-side event API, so purchases cannot be tracked server-side like GA4 or Meta Pixel. Instead, use `clarity("event", "purchase")` and `clarity("set", "order_value", "...")` on your frontend's order confirmation page. Clarity also auto-detects GA4 eCommerce dataLayer events if you use the Headless Google Analytics plugin.

= Does this work without a headless frontend? =

The plugin only provides REST API endpoints. It does not inject the Clarity script into WordPress themes. A headless frontend is required to load the Clarity tracking script.

= How does user identification work? =

When "Enable User Identification" is on, the `/config` endpoint includes the logged-in user's ID and display name. Your frontend can pass these to `clarity("identify", userId, null, null, displayName)` for cross-device user tracking in the Clarity dashboard.

== Changelog ==

= 1.0.0 =
* Initial release
* REST endpoint: `GET /config` for Clarity script initialization
* Optional user identity in `/config` for `identify()` API
* Admin settings page with General and Diagnostics tabs
