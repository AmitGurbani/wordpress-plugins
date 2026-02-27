/**
 * FuzzyFind Search — WP_Query integration.
 *
 * Hooks into posts_clauses to intercept WooCommerce product search queries
 * and replace them with weighted FULLTEXT search against the custom index.
 */

import { Filter } from 'wpts';

class FfSearch {

  // ── Query Tagging ────────────────────────────────────────────────────

  @Filter('woocommerce_rest_product_object_query', { priority: 10, acceptedArgs: 2 })
  tagRestSearch(args: any, request: any): any {
    if (request.get_param('search')) {
      args['ff_search'] = true;
    }
    return args;
  }

  @Filter('woocommerce_store_api_product_query_args', { priority: 10, acceptedArgs: 2 })
  tagStoreApiSearch(args: any, request: any): any {
    if (request.get_param('search')) {
      args['ff_search'] = true;
    }
    return args;
  }

  @Filter('graphql_product_connection_query_args', { priority: 10, acceptedArgs: 5 })
  tagGraphqlSearch(queryArgs: any, source: any, args: any, context: any, info: any): any {
    const where: any = args['where'] ?? null;
    if (where && where['search']) {
      queryArgs['ff_search'] = true;
    }
    return queryArgs;
  }

  // ── WP_Query Interception ───────────────────────────────────────────

  @Filter('posts_clauses', { priority: 20, acceptedArgs: 2 })
  modifySearchClauses(clauses: any, query: any): any {
    if (!classExists('WooCommerce')) {
      return clauses;
    }

    // Enhance main product search queries + tagged REST/GraphQL searches
    const isFfSearch: boolean = !!query.get('ff_search');
    if (isAdmin() || !query.is_search() || (!query.is_main_query() && !isFfSearch)) {
      return clauses;
    }

    const postType: any = query.get('post_type');
    if (postType !== 'product') {
      return clauses;
    }

    const searchTerm: string = query.get('s');
    if (!searchTerm || searchTerm.length < intval(getOption('fuzzy_find_for_woo_commerce_min_query_length', 2))) {
      return clauses;
    }

    const tableName: string = getOption('fuzzyfind_index_table', '');
    if (!tableName) {
      return clauses;
    }

    // Check if index has any data
    const indexCount: string | null = wpdb.getVar(wpdb.prepare('SELECT COUNT(*) FROM %i', tableName));
    if (!indexCount || intval(indexCount) === 0) {
      return clauses;
    }

    // Build boolean mode search term: "blue widget" → "+blue* +widget*"
    const booleanQuery: string = this.buildBooleanQuery(searchTerm);

    // Load weights from settings
    const wTitle: number = intval(getOption('fuzzy_find_for_woo_commerce_weight_title', 10));
    const wSku: number = intval(getOption('fuzzy_find_for_woo_commerce_weight_sku', 8));
    const wContent: number = intval(getOption('fuzzy_find_for_woo_commerce_weight_content', 2));

    // JOIN the search index table
    const postsTable: string = wpdb.posts;
    clauses['join'] = clauses['join'] + wpdb.prepare(
      ' INNER JOIN %i AS ff_si ON (' + postsTable + '.ID = ff_si.product_id)',
      tableName
    );

    // Replace WHERE with FULLTEXT match
    clauses['where'] = wpdb.prepare(
      " AND " + postsTable + ".post_type = 'product' AND " + postsTable + ".post_status = 'publish' AND MATCH(ff_si.title, ff_si.sku, ff_si.short_desc, ff_si.attributes, ff_si.categories, ff_si.tags, ff_si.variation_skus) AGAINST (%s IN BOOLEAN MODE)",
      booleanQuery
    );

    // Add weighted relevance score
    clauses['fields'] = clauses['fields'] + wpdb.prepare(
      ', (MATCH(ff_si.title) AGAINST (%s IN BOOLEAN MODE) * %d'
      + ' + MATCH(ff_si.sku) AGAINST (%s IN BOOLEAN MODE) * %d'
      + ' + MATCH(ff_si.title, ff_si.sku, ff_si.short_desc, ff_si.attributes, ff_si.categories, ff_si.tags, ff_si.variation_skus) AGAINST (%s IN BOOLEAN MODE) * %d'
      + ') AS ff_relevance_score',
      booleanQuery, wTitle,
      booleanQuery, wSku,
      booleanQuery, wContent
    );

    // Order by relevance
    clauses['orderby'] = 'ff_relevance_score DESC';

    // Prevent duplicates
    clauses['distinct'] = 'DISTINCT';

    // Log search for analytics
    this.logSearch(searchTerm);

    return clauses;
  }

  // ── Boolean Query Builder ───────────────────────────────────────────

  buildBooleanQuery(searchTerm: string): string {
    // Split into words, add + prefix (required) and * suffix (prefix match)
    const words: string[] = searchTerm.trim().toLowerCase().split(' ');
    let parts: string[] = [];

    for (const word of words) {
      const trimmed: string = word.trim();
      if (trimmed.length > 0) {
        parts.push('+' + trimmed + '*');
      }
    }

    return parts.join(' ');
  }

  // ── "Did You Mean" Suggestions ──────────────────────────────────────

  getDidYouMeanSuggestions(searchTerm: string): string[] {
    const tableName: string = getOption('fuzzyfind_index_table', '');
    if (!tableName) {
      return [];
    }

    const fuzzyEnabled: string = getOption('fuzzy_find_for_woo_commerce_fuzzy_enabled', '1');
    if (fuzzyEnabled !== '1') {
      return [];
    }

    // Use SOUNDEX to find phonetically similar titles
    const words: string[] = searchTerm.trim().split(' ');
    let suggestions: string[] = [];

    for (const word of words) {
      const trimmed: string = word.trim();
      if (trimmed.length < 3) {
        continue;
      }
      const results: any[] = wpdb.getResults(
        wpdb.prepare(
          'SELECT DISTINCT title FROM %i WHERE SOUNDEX(title) = SOUNDEX(%s) LIMIT 3',
          tableName, trimmed
        )
      );
      if (results) {
        for (const row of results) {
          suggestions.push(row['title']);
        }
      }
    }

    return suggestions;
  }

  // ── Analytics Logging ───────────────────────────────────────────────

  logSearch(searchTerm: string): void {
    const analyticsEnabled: string = getOption('fuzzy_find_for_woo_commerce_analytics_enabled', '1');
    if (analyticsEnabled !== '1') {
      return;
    }

    const logTable: string = getOption('fuzzyfind_log_table', '');
    if (!logTable) {
      return;
    }

    const normalizedQuery: string = searchTerm.trim().toLowerCase();
    if (normalizedQuery.length === 0) {
      return;
    }

    // Count results for this query
    const tableName: string = getOption('fuzzyfind_index_table', '');
    let resultCount: number = 0;
    if (tableName) {
      const boolQuery: string = this.buildBooleanQuery(normalizedQuery);
      const countResult: string | null = wpdb.getVar(
        wpdb.prepare(
          'SELECT COUNT(*) FROM %i WHERE MATCH(title, sku, short_desc, attributes, categories, tags, variation_skus) AGAINST (%s IN BOOLEAN MODE)',
          tableName, boolQuery
        )
      );
      if (countResult) {
        resultCount = intval(countResult);
      }
    }

    // Upsert search log
    wpdb.query(
      wpdb.prepare(
        'INSERT INTO %i (query, result_count, search_count, last_searched) VALUES (%s, %d, 1, NOW()) ON DUPLICATE KEY UPDATE search_count = search_count + 1, result_count = %d, last_searched = NOW()',
        logTable, normalizedQuery, resultCount, resultCount
      )
    );
  }
}
