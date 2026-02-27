# Admin Guide

Setup and configuration guide for WordPress site administrators.

## Installation

1. Download the plugin zip file (`fuzzy-find-for-woo-commerce.zip`)
2. Go to **Plugins > Add New > Upload Plugin** in WordPress admin
3. Upload the zip and click **Install Now**
4. Click **Activate**

The plugin creates two database tables on activation (`wp_ff_search_index` and `wp_ff_search_log`) and is ready to use immediately.

**Requirements:**
- WordPress 6.0+
- PHP 8.0+
- WooCommerce (must be active)
- MySQL/MariaDB with InnoDB engine

If WooCommerce is not active, the plugin displays an admin notice and search enhancement is disabled.

## Initial Setup

1. Navigate to **FuzzyFind** in the WordPress admin menu
2. Click **Rebuild Index** to index all existing products
3. Search is now enhanced — try searching for a product in your WooCommerce store

New products are automatically indexed when created or updated. Deleted products are automatically removed from the index.

### Headless & API Support

Search enhancement applies automatically to all WooCommerce search interfaces:

- **Frontend search** — standard WooCommerce product search
- **WooCommerce Store API** — `/wc/store/v1/products?search=...` (public, no auth — WooCommerce 9.0+)
- **WooCommerce REST API** — `/wc/v3/products?search=...` (requires API keys)
- **WPGraphQL** — product queries with `search` in `where` (requires [WPGraphQL](https://www.wpgraphql.com/) + [WooGraphQL](https://github.com/wp-graphql/wp-graphql-woocommerce))

No additional configuration is needed. Search analytics captures queries from all sources.

## Search Weights

Search weights control how much each field contributes to the relevance score. Higher weight means matches in that field rank higher in results.

| Setting | Default | What It Matches |
|---------|---------|-----------------|
| Title Weight | 10 | Product name |
| SKU Weight | 8 | Product SKU and variation SKUs |
| Category Weight | 6 | Product category names |
| Attribute Weight | 5 | Product attribute values (color, size, etc.) |
| Tag Weight | 4 | Product tag names |
| Content Weight | 2 | Product description |

### Common Configurations

**Parts/industrial store** (customers search by part number):
- SKU Weight: 10, Title Weight: 8

**Fashion/apparel store** (customers search by style):
- Title Weight: 10, Category Weight: 8, Attribute Weight: 7

**General store** (balanced):
- Keep defaults — title and SKU are prioritized, descriptions contribute less noise

## Feature Settings

| Setting | Default | Description |
|---------|---------|-------------|
| Enable Fuzzy Matching | On | SOUNDEX phonetic matching for typos and misspellings. "shrt" finds "shirt" |
| Enable Autocomplete | On | Public REST endpoint for search-as-you-type UIs |
| Enable Search Analytics | On | Track popular searches and zero-result queries |
| Minimum Query Length | 2 | Characters required before search kicks in |
| Autocomplete Result Limit | 8 | Max suggestions returned by the autocomplete endpoint |
| "Did You Mean" Threshold | 3 | Show alternative suggestions when results are fewer than this |

## Index Management

### Automatic Indexing

The index stays in sync automatically:
- **Product created/updated** — indexed immediately via `woocommerce_update_product` hook
- **Product deleted** — removed from index via `before_delete_post` hook
- **Product unpublished or hidden** — removed from index

### Manual Rebuild

Use **Rebuild Index** in the admin page when:
- You've just installed the plugin (existing products aren't indexed yet)
- You suspect the index is out of sync
- You've made bulk changes to products

Rebuild behavior:
- **500 products or fewer** — runs immediately (synchronous)
- **More than 500 products** — scheduled via WP-Cron (runs in the background within a few seconds)

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

## Troubleshooting

### Search not working

1. **Check WooCommerce is active** — FuzzyFind requires WooCommerce. Look for the admin notice
2. **Check the index is built** — Go to FuzzyFind admin, check index status. If "0 indexed", click Rebuild Index
3. **Check minimum query length** — Default is 2 characters. Single-character searches are ignored

### Autocomplete not responding

1. **Check autocomplete is enabled** — Verify "Enable Autocomplete" is on in settings
2. **Test with curl:**
   ```bash
   curl "https://your-site.com/wp-json/fuzzyfind/v1/autocomplete?query=test"
   ```
3. **Check permalink settings** — REST API works best with pretty permalinks (Settings > Permalinks > "Post name")

### New products not appearing in search

Products are indexed on the `woocommerce_update_product` hook. Check that:
- The product is **published** (draft/pending products are not indexed)
- The product is not **hidden** (catalog visibility set to "Hidden")
- WooCommerce is active when saving the product

If products are still missing, click **Rebuild Index** to force a full reindex.

### Fuzzy matching not finding misspellings

- Verify "Enable Fuzzy Matching" is on
- SOUNDEX works best for English words. It may not work well for product codes or non-English terms
- Very short words (1-2 characters) are not matched phonetically
