=== Headless FuzzyFind ===
Contributors: amitgurbani
Tags: woocommerce, search, fuzzy search, autocomplete, headless
Requires at least: 6.2
Tested up to: 6.9
Requires PHP: 8.0
Stable tag: 1.0.0
License: GPL-2.0+
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Weighted, fuzzy WooCommerce product search with autocomplete, synonym expansion, and analytics.

== Description ==

Headless FuzzyFind replaces WooCommerce's default search with a FULLTEXT index-powered engine that understands relevance, handles typos, and returns results instantly via REST API.

Search results are ranked by a configurable weighted score across product title, SKU, description, attributes, categories, and tags. Fuzzy correction via Levenshtein distance catches misspellings automatically. Synonym expansion lets you define equivalent terms so customers find products regardless of how they phrase their search.

The plugin provides public REST API endpoints — designed for headless storefronts or custom search UIs. It does not modify the default WooCommerce search widget, making it safe to add to any site.

== Features ==

* FULLTEXT index with weighted relevance scoring across title, SKU, descriptions, attributes, categories, and tags
* Fuzzy correction — typos like "shrt" automatically match "shirt" (Levenshtein distance ≤ 2)
* Synonym expansion — define equivalent terms (e.g., "tee, t-shirt, tshirt") for broader matching
* Autocomplete endpoint for search-as-you-type UIs
* "Did you mean" suggestions when results are few or zero
* Search analytics — track popular searches and zero-result queries
* Automatic index updates when products are created, updated, or deleted

== Requirements ==

* WordPress 6.2 or higher
* PHP 8.0 or higher
* WooCommerce (required — search is WooCommerce product-specific)
* MySQL/MariaDB with InnoDB engine (required for FULLTEXT index)

== Installation ==

1. Upload the plugin files to the `/wp-content/plugins/headless-fuzzy-find` directory, or install the plugin through the WordPress plugins screen directly.
2. Activate the plugin through the **Plugins** screen in WordPress.
3. Go to **FuzzyFind** in the admin menu and click **Rebuild Index** to index your existing products.

New products are indexed automatically on create/update. Deleted products are removed automatically.

== Frequently Asked Questions ==

= Does this replace the default WooCommerce search? =

No. Headless FuzzyFind provides REST API endpoints (`/wp-json/headless-fuzzy-find/v1/search` and `/wp-json/headless-fuzzy-find/v1/autocomplete`) that you call from a custom search UI or headless frontend. The default WooCommerce search widget is unaffected.

= How do I build the search index for existing products? =

After activating, go to the **FuzzyFind** admin page and click **Rebuild Index**. For stores with 500+ products, the rebuild runs via WP-Cron in the background (within a few seconds).

= What is fuzzy matching? =

Fuzzy matching uses Levenshtein distance to correct single or double character errors. "shrt" matches "shirt", "bluee" matches "blue". Very short words (under 3 characters) and very large edit distances are not corrected.

= Can I configure which fields are weighted more heavily? =

Yes. The admin settings page lets you set individual weights for Title, SKU, and Content. Increasing the SKU weight is useful for stores where customers frequently search by part number.

== Changelog ==

= 1.0.0 =
* Initial release
* FULLTEXT search index with weighted scoring across title, SKU, description, attributes, categories, tags, and variation SKUs
* Fuzzy correction via Levenshtein distance
* Synonym expansion support
* REST API search endpoint with pagination and relevance/title sort
* REST API autocomplete endpoint
* "Did you mean" suggestions
* Search analytics (popular searches and zero-result queries)
* Automatic index sync on product create/update/delete
* Manual rebuild and index management in admin
