=== Headless Storefront ===
Contributors: amitgurbani
Tags: headless, woocommerce, branding, storefront, rest-api
Requires at least: 6.8
Tested up to: 6.9
Requires PHP: 8.2
Stable tag: 1.7.0
License: GPL-2.0+
License URI: http://www.gnu.org/licenses/gpl-2.0.txt

Store branding and configuration REST API for headless WordPress with WooCommerce.

== Description ==

Store branding and configuration REST API for headless WordPress with WooCommerce.

Exposes a public `/config` endpoint that returns the full set of branding, identity, and merchant-policy fields used by Astro / Next.js storefronts, with automatic WordPress and WooCommerce fallbacks for app name, tagline, and contact email.

Includes a `template` selector (kirana, megamart, bakery, quickcommerce, ecommerce, fooddelivery) and a namespaced `template_config` blob so vertical-specific settings (bakery occasions, quickcommerce ETA bands, food-delivery filters, e-commerce returns window) live in one plugin without leaking across templates.

== Installation ==

1. Upload the plugin files to the `/wp-content/plugins/headless-storefront` directory, or install the plugin through the WordPress plugins screen directly.
2. Activate the plugin through the 'Plugins' screen in WordPress.
3. Configure the plugin settings from Settings → Headless Storefront.

== Extending ==

The public `/config` response is filterable so sibling plugins or theme code can add fields without owning the option blob:

`add_filter( 'headless_storefront_config_response', function ( $response ) {
    $response['custom_field'] = 'value';
    return $response;
} );`

The filter runs after the plugin assembles the response (including all v1.8 additions). For known verticals, prefer adding fields to `template_config.<vertical>` rather than via the filter so the admin UI can manage them.

== Field Ownership ==

`mov` (minimum order value) and `delivery_fee` are commerce policy, not pure branding. They live in this plugin pragmatically because no separate checkout plugin exists in the same line-up. If a `headless-checkout` plugin ships later, these fields can migrate cleanly because the entire config is one serialized option (`headless_storefront_config`).

`hours_text` and `delivery_area_text` are free-text fields kept first-class. Storefronts that need machine-readable hours or coverage grids should consume `delivery_areas` (string array) and wait for a future structured `hours` field rather than parsing the free-text versions.

== Changelog ==

= 0.1.0 =
* Initial release.
