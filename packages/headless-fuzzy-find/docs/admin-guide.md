# Admin Guide

Setup and configuration guide for WordPress site administrators.

## Installation

1. Download the plugin zip file (`headless-fuzzy-find.zip`)
2. Go to **Plugins > Add New > Upload Plugin** in WordPress admin
3. Upload the zip and click **Install Now**
4. Click **Activate**

The plugin creates two database tables on activation (`wp_headless_fuzzy_find_search_index` and `wp_headless_fuzzy_find_search_log`) and is ready to use immediately.

**Requirements:**
- WordPress 6.0+
- PHP 8.0+
- WooCommerce (must be active)
- MySQL/MariaDB with InnoDB engine

If WooCommerce is not active, the plugin displays an admin notice and search enhancement is disabled.

## Initial Setup

1. Navigate to **Fuzzy Find** in the WordPress admin menu
2. Click **Rebuild Index** to index all existing products
3. Search is now enhanced — try searching for a product in your WooCommerce store

New products are automatically indexed when created or updated. Deleted products are automatically removed from the index.

### REST API Endpoints

Headless Fuzzy Find provides custom REST endpoints for search:

- **Search** — `GET /wp-json/headless-fuzzy-find/v1/search?query=...` (public, paginated, weighted relevance scoring)
- **Autocomplete** — `GET /wp-json/headless-fuzzy-find/v1/autocomplete?query=...` (public, lightweight suggestions for search-as-you-type)
- **Popular Searches** — `GET /wp-json/headless-fuzzy-find/v1/popular-searches?limit=12` (public, trending terms for storefront UIs)

See the [Integration Guide](./integration-guide.md) for full endpoint documentation and frontend examples.

## Search Weights

Search weights control how much each field contributes to the relevance score. Higher weight means matches in that field rank higher in results.

| Setting | Default | What It Matches |
| ------- | ------- | --------------- |
| Title Weight | 10 | Product name |
| SKU Weight | 8 | Product SKU and variation SKUs |
| Content Weight | 2 | Product description |

The index covers all product fields (title, SKU, description, attributes, categories, tags, variation SKUs) for matching. The weights above control the relevance ranking of results.

### Common Configurations

**Parts/industrial store** (customers search by part number):

- SKU Weight: 10, Title Weight: 8

**General store** (balanced):

- Keep defaults — title and SKU are prioritized, descriptions contribute less noise

## Feature Settings

| Setting | Default | Description |
| ------- | ------- | ----------- |
| Enable Fuzzy Matching | On | Levenshtein distance matching for typos and misspellings. "shrt" finds "shirt" |
| Enable Autocomplete | On | Public REST endpoint for search-as-you-type UIs |
| Enable Search Analytics | On | Track popular searches and zero-result queries |
| Minimum Query Length | 2 | Characters required before search kicks in |
| Autocomplete Result Limit | 8 | Max suggestions returned by the autocomplete endpoint |
| "Did You Mean" Threshold | 3 | Show alternative suggestions when results are fewer than this |

## Index Management

### Automatic Indexing

The index stays in sync automatically:
- **Product created/updated** — indexed immediately via `woocommerce_new_product` and `woocommerce_update_product` hooks
- **Product deleted** — removed from index via `before_delete_post` hook
- **Product unpublished, hidden, or set to "Catalog only" visibility** — removed from index

### Manual Rebuild

Use **Rebuild Index** in the admin page when:
- You've just installed the plugin (existing products aren't indexed yet)
- You suspect the index is out of sync
- You've made bulk changes to products

Rebuild re-indexes all current products and removes stale entries for deleted products.

Rebuild behavior:
- **500 products or fewer** — runs immediately (synchronous)
- **More than 500 products** — scheduled via WP-Cron (runs in the background within a few seconds)

### Delete Index

Use **Delete Index** to clear all indexed data without rebuilding. This is useful for:
- Troubleshooting search issues
- Preparing to uninstall the plugin

Search will be unavailable until you rebuild the index. A confirmation prompt is shown before deleting.

The admin page shows index status: total products indexed, total products in store, and last indexed timestamp.

## Understanding Analytics

When Search Analytics is enabled, the plugin tracks every product search.

### Popular Searches

Shows the top 20 most-searched terms with their result counts. Use this to:
- Understand what customers are looking for
- Prioritize inventory based on demand
- Optimize product titles for popular search terms

### Zero-Result Searches

Shows the top 20 searches that returned no results. Use this to:
- Identify gaps in your product catalog
- Add missing product tags or improve product titles
- Create redirects for common misspellings
- Decide whether to stock frequently-searched items

### Clearing Analytics

Click **Clear Analytics** to reset all search data. This is useful when:
- You've made significant changes to your product catalog
- You want to start fresh after tuning search weights
- You're testing and want clean data

## Popular Searches Endpoint

The plugin exposes a public `GET /wp-json/headless-fuzzy-find/v1/popular-searches` endpoint that returns trending search terms for your storefront UI (search page chips, autocomplete empty state, etc.).

### How It Works

By default, the endpoint returns the top tracked queries from your analytics log (queries that returned at least one result, sorted by search count). When admins set **Manual Overrides**, those terms take precedence — useful when you want to feature seasonal terms, promotions, or curated suggestions.

### Settings

Both controls live at the bottom of the **Analytics** tab:

| Setting | Default | Description |
| ------- | ------- | ----------- |
| Manual Overrides | (empty) | One search term per line. When set, replaces auto-tracked terms in the public endpoint |
| Max Results | 12 | Maximum number of items returned (1-50). Frontend `?limit=N` param can override on a per-request basis |

### When to Use Overrides

- **Featured campaigns** — pin "valentine's day", "summer sale" during promotions
- **New product launches** — promote searches you want to drive traffic to
- **Catalog gaps** — direct customers toward terms you actually have stock for
- **Cold start** — populate trending terms before you have real analytics data

To revert to auto-tracked queries, just clear the overrides field.

## Troubleshooting

### Search not working

1. **Check WooCommerce is active** — Headless Fuzzy Find requires WooCommerce. Look for the admin notice
2. **Check the index is built** — Go to Fuzzy Find admin, check index status. If "0 indexed", click Rebuild Index
3. **Check minimum query length** — Default is 2 characters. Single-character searches are ignored

### Autocomplete not responding

1. **Check autocomplete is enabled** — Verify "Enable Autocomplete" is on in settings
2. **Test with curl:**
   ```bash
   curl "https://your-site.com/wp-json/headless-fuzzy-find/v1/autocomplete?query=test"
   ```
3. **Check permalink settings** — REST API works best with pretty permalinks (Settings > Permalinks > "Post name")

### New products not appearing in search

Products are indexed on the `woocommerce_new_product` and `woocommerce_update_product` hooks. Check that:
- The product is **published** (draft/pending products are not indexed)
- The product's catalog visibility is not set to **"Hidden"** or **"Catalog"** (shop only, excluded from search)
- WooCommerce is active when saving the product
- Product variations are automatically indexed via the parent product — when a variation is created or updated, the parent product is re-indexed

If products are still missing, click **Rebuild Index** to force a full reindex.

### Fuzzy matching not finding misspellings

- Verify "Enable Fuzzy Matching" is on
- Levenshtein matching corrects words within edit distance 2. Very different spellings may not be corrected
- Very short words (under 3 characters) are not corrected
