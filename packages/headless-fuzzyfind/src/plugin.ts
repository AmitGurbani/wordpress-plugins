/**
 * Headless FuzzyFind — wpts Plugin
 *
 * Weighted, fuzzy WooCommerce product search with autocomplete and analytics.
 * Custom REST API search endpoints powered by a MySQL FULLTEXT index for relevance-sorted results.
 *
 * Build: npx wpts build src/plugin.ts -o dist --clean
 */

import { Activate, AdminPage, Deactivate, Plugin, Setting } from 'wpts';
import './indexer.js';
import './search-routes.js';
import './admin-routes.js';

@Plugin({
  name: 'Headless FuzzyFind',
  uri: 'https://github.com/AmitGurbani/wordpress-plugins',
  description: 'Weighted, fuzzy WooCommerce product search with autocomplete and analytics.',
  version: '1.0.0',
  author: 'Amit Gurbani',
  authorUri: 'https://github.com/AmitGurbani',
  license: 'GPL-2.0+',
  textDomain: 'headless-fuzzyfind',
  requiresWP: '6.0',
  requiresPHP: '8.0',
  wooNotice: 'required',
})
@AdminPage({
  pageTitle: 'Headless FuzzyFind Settings',
  menuTitle: 'FuzzyFind',
  capability: 'manage_options',
  menuSlug: 'headless-fuzzyfind-settings',
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
    description: 'Use levenshtein-based matching to handle misspellings and typos.',
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

  @Setting({
    key: 'synonyms',
    type: 'string',
    default: '',
    label: 'Search Synonyms',
    description:
      'Define synonym groups, one per line, comma-separated. All terms in a group match interchangeably.',
    sanitize: 'sanitize_textarea_field',
  })
  synonyms: string = '';

  // ── Lifecycle ───────────────────────────────────────────────────────

  @Activate()
  onActivation(): void {
    if (!classExists('WooCommerce')) {
      return;
    }

    requireOnce(ABSPATH + 'wp-admin/includes/upgrade.php');

    const charsetCollate: string = wpdb.getCharsetCollate();
    const prefix: string = wpdb.prefix;
    const indexTable: string = prefix + 'ff_search_index';
    const logTable: string = prefix + 'ff_search_log';

    const sqlIndex: string =
      'CREATE TABLE ' +
      indexTable +
      ' (' +
      'id bigint(20) unsigned NOT NULL AUTO_INCREMENT, ' +
      'product_id bigint(20) unsigned NOT NULL, ' +
      'title text NOT NULL, ' +
      "sku varchar(100) NOT NULL DEFAULT '', " +
      'short_desc text NOT NULL, ' +
      'content longtext NOT NULL, ' +
      'attributes text NOT NULL, ' +
      'categories text NOT NULL, ' +
      'tags text NOT NULL, ' +
      'variation_skus text NOT NULL, ' +
      'indexed_at datetime NOT NULL, ' +
      'PRIMARY KEY  (id), ' +
      'UNIQUE KEY product_id (product_id), ' +
      'FULLTEXT KEY ft_title (title), ' +
      'FULLTEXT KEY ft_sku (sku), ' +
      'FULLTEXT KEY ft_all (title, sku, short_desc, attributes, categories, tags, variation_skus)' +
      ') ENGINE=InnoDB ' +
      charsetCollate +
      ';';

    const sqlLog: string =
      'CREATE TABLE ' +
      logTable +
      ' (' +
      'id bigint(20) unsigned NOT NULL AUTO_INCREMENT, ' +
      'query varchar(200) NOT NULL, ' +
      'result_count int NOT NULL DEFAULT 0, ' +
      'search_count int NOT NULL DEFAULT 1, ' +
      'last_searched datetime NOT NULL, ' +
      'PRIMARY KEY  (id), ' +
      'UNIQUE KEY query_unique (query), ' +
      'KEY result_count (result_count)' +
      ') ENGINE=InnoDB ' +
      charsetCollate +
      ';';

    dbDelta(sqlIndex);
    dbDelta(sqlLog);

    updateOption('headless_fuzzyfind_index_table', indexTable);
    updateOption('headless_fuzzyfind_log_table', logTable);
    updateOption('headless_fuzzyfind_db_version', '1.0.0');
  }

  @Deactivate()
  onDeactivation(): void {
    // Preserve index data on deactivation
  }
}
