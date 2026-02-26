/**
 * FuzzyFind for WooCommerce — wpts Plugin
 *
 * Weighted, fuzzy WooCommerce product search with autocomplete and analytics.
 * Enhances default WP_Query search with a MySQL FULLTEXT index for relevance-sorted results.
 *
 * Build: npx wpts build src/plugin.ts -o dist --clean
 */

import { Plugin, Setting, AdminPage, Activate, Deactivate, Action } from 'wpts';
import './indexer.js';
import './search.js';
import './autocomplete.js';
import './admin-routes.js';

@Plugin({
  name: 'FuzzyFind for WooCommerce',
  description: 'Weighted, fuzzy WooCommerce product search with autocomplete and analytics.',
  version: '1.0.0',
  author: 'wpts',
  license: 'GPL-2.0+',
  textDomain: 'fuzzyfind',
  requiresWP: '6.0',
  requiresPHP: '8.0',
})
@AdminPage({
  pageTitle: 'FuzzyFind Settings',
  menuTitle: 'FuzzyFind',
  capability: 'manage_options',
  menuSlug: 'fuzzyfind-settings',
  iconUrl: 'dashicons-search',
})
class FuzzyFind {

  // ── Weight Settings (1–10 scale) ────────────────────────────────────

  @Setting({
    key: 'weight_title',
    type: 'number',
    default: 10,
    label: 'Title Weight',
    description: 'Relevance weight for product title matches (1-10).',
  })
  weightTitle: number = 10;

  @Setting({
    key: 'weight_sku',
    type: 'number',
    default: 8,
    label: 'SKU Weight',
    description: 'Relevance weight for SKU matches (1-10).',
  })
  weightSku: number = 8;

  @Setting({
    key: 'weight_categories',
    type: 'number',
    default: 6,
    label: 'Category Weight',
    description: 'Relevance weight for category name matches (1-10).',
  })
  weightCategories: number = 6;

  @Setting({
    key: 'weight_attributes',
    type: 'number',
    default: 5,
    label: 'Attribute Weight',
    description: 'Relevance weight for product attribute matches (1-10).',
  })
  weightAttributes: number = 5;

  @Setting({
    key: 'weight_tags',
    type: 'number',
    default: 4,
    label: 'Tag Weight',
    description: 'Relevance weight for product tag matches (1-10).',
  })
  weightTags: number = 4;

  @Setting({
    key: 'weight_content',
    type: 'number',
    default: 2,
    label: 'Content Weight',
    description: 'Relevance weight for product description matches (1-10).',
  })
  weightContent: number = 2;

  // ── Feature Settings ────────────────────────────────────────────────

  @Setting({
    key: 'fuzzy_enabled',
    type: 'boolean',
    default: true,
    label: 'Enable Fuzzy Matching',
    description: 'Use SOUNDEX phonetic matching to handle misspellings and typos.',
  })
  fuzzyEnabled: boolean = true;

  @Setting({
    key: 'autocomplete_enabled',
    type: 'boolean',
    default: true,
    label: 'Enable Autocomplete',
    description: 'Enable the REST API autocomplete endpoint for search-as-you-type.',
  })
  autocompleteEnabled: boolean = true;

  @Setting({
    key: 'analytics_enabled',
    type: 'boolean',
    default: true,
    label: 'Enable Search Analytics',
    description: 'Track popular searches and zero-result queries.',
  })
  analyticsEnabled: boolean = true;

  @Setting({
    key: 'min_query_length',
    type: 'number',
    default: 2,
    label: 'Minimum Query Length',
    description: 'Minimum number of characters required to trigger search enhancement.',
  })
  minQueryLength: number = 2;

  @Setting({
    key: 'autocomplete_limit',
    type: 'number',
    default: 8,
    label: 'Autocomplete Result Limit',
    description: 'Maximum number of autocomplete suggestions returned.',
  })
  autocompleteLimit: number = 8;

  @Setting({
    key: 'did_you_mean_threshold',
    type: 'number',
    default: 3,
    label: '"Did You Mean" Threshold',
    description: 'Show "did you mean" suggestions when results are fewer than this number.',
  })
  didYouMeanThreshold: number = 3;

  // ── Admin Notices ───────────────────────────────────────────────────

  @Action('admin_notices')
  wooRequiredNotice(): void {
    if (!classExists('WooCommerce')) {
      echo('<div class="notice notice-error"><p><strong>FuzzyFind:</strong> ');
      echo(escHtml__('WooCommerce is required for this plugin to work.', 'fuzzyfind'));
      echo('</p></div>');
    }
  }

  // ── Lifecycle ───────────────────────────────────────────────────────

  @Activate()
  onActivation(): void {
    if (!classExists('WooCommerce')) {
      return;
    }

    requireOnce(ABSPATH + 'wp-admin/includes/upgrade.php');

    const charsetCollate: string = wpdb.getVar('SELECT @@character_set_database') ?? 'utf8mb4';
    const prefix: string = wpdb.prefix;
    const indexTable: string = prefix + 'ff_search_index';
    const logTable: string = prefix + 'ff_search_log';

    const sqlIndex: string = 'CREATE TABLE ' + indexTable + ' ('
      + 'id bigint(20) unsigned NOT NULL AUTO_INCREMENT, '
      + 'product_id bigint(20) unsigned NOT NULL, '
      + 'title text NOT NULL, '
      + 'sku varchar(100) NOT NULL DEFAULT \'\', '
      + 'short_desc text NOT NULL, '
      + 'content longtext NOT NULL, '
      + 'attributes text NOT NULL, '
      + 'categories text NOT NULL, '
      + 'tags text NOT NULL, '
      + 'variation_skus text NOT NULL, '
      + 'indexed_at datetime NOT NULL, '
      + 'PRIMARY KEY  (id), '
      + 'UNIQUE KEY product_id (product_id), '
      + 'FULLTEXT KEY ft_title (title), '
      + 'FULLTEXT KEY ft_sku (sku), '
      + 'FULLTEXT KEY ft_all (title, sku, short_desc, attributes, categories, tags, variation_skus)'
      + ') ENGINE=InnoDB DEFAULT CHARSET=' + charsetCollate + ';';

    const sqlLog: string = 'CREATE TABLE ' + logTable + ' ('
      + 'id bigint(20) unsigned NOT NULL AUTO_INCREMENT, '
      + 'query varchar(200) NOT NULL, '
      + 'result_count int NOT NULL DEFAULT 0, '
      + 'search_count int NOT NULL DEFAULT 1, '
      + 'last_searched datetime NOT NULL, '
      + 'PRIMARY KEY  (id), '
      + 'UNIQUE KEY query_unique (query), '
      + 'KEY result_count (result_count)'
      + ') ENGINE=InnoDB DEFAULT CHARSET=' + charsetCollate + ';';

    dbDelta(sqlIndex);
    dbDelta(sqlLog);

    updateOption('fuzzyfind_index_table', indexTable);
    updateOption('fuzzyfind_log_table', logTable);
    updateOption('fuzzyfind_db_version', '1.0.0');
  }

  @Deactivate()
  onDeactivation(): void {
    // Preserve index data on deactivation
  }
}
