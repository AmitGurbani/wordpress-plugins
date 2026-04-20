=== Headless Media Cleanup ===
Contributors: amitgurbani
Tags: woocommerce, media, cleanup, images, orphan
Requires at least: 6.2
Tested up to: 6.9
Requires PHP: 8.0
Stable tag: 1.1.0
Requires Plugins: woocommerce
License: GPL-2.0+
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Auto-delete orphaned WooCommerce media when images are removed from products, variations, and taxonomy terms.

== Description ==

WooCommerce does not clean up media files when images are removed from products
or taxonomy terms. This plugin automatically deletes media from the WordPress
Media Library when images are removed — but only if the image is not used
anywhere else.

**Automatic cleanup covers:**

* Product featured images and gallery images
* Product variation images
* Category, tag, and brand thumbnails
* Product deletion (images orphaned by deleted products)
* Taxonomy term deletion

**Safety features:**

* Orphan check — only deletes images with zero remaining WooCommerce references
* Image-only — never touches downloadable files or non-image attachments
* Filters for disabling cleanup globally or per-attachment
* Debug logging when WP_DEBUG_LOG is enabled

**REST API endpoints (admin only):**

* `GET /wp-json/headless-media-cleanup/v1/orphans` — List orphaned images
* `POST /wp-json/headless-media-cleanup/v1/orphans/cleanup` — Delete all orphans

== Source Code ==

The full source code, including uncompiled JavaScript and build tooling, is available at:
https://github.com/AmitGurbani/wordpress-plugins/tree/main/packages/headless-media-cleanup

To build the admin JavaScript from source, clone the repository and run:

    pnpm install
    pnpm --filter headless-media-cleanup build

== Installation ==

1. Upload the `headless-media-cleanup` folder to `/wp-content/plugins/`.
2. Activate the plugin through the **Plugins** menu in WordPress.
3. Ensure **WooCommerce** is installed and active.
4. The plugin works automatically — no configuration needed.

== Frequently Asked Questions ==

= Does this plugin require WooCommerce? =

Yes. WooCommerce must be installed and active.

= Will it delete images used by blog posts? =

The orphan check only covers WooCommerce entities (products, variations,
categories, tags, brands). Images embedded in post content via `<img>` tags are
not tracked. Use the `headless_media_cleanup_should_delete` filter to add custom
checks if needed.

= Can I disable it temporarily? =

Yes. Add this to your theme or a mu-plugin:
`add_filter( 'headless_media_cleanup_enabled', '__return_false' );`

= Can I skip specific images? =

Yes. Use the `headless_media_cleanup_should_delete` filter:
`add_filter( 'headless_media_cleanup_should_delete', function( $should, $id ) { return $id !== 42; }, 10, 2 );`

== Changelog ==

= 1.0.0 =
* Initial release.
