/**
 * FuzzyFind Search Routes — Custom REST endpoints for search and autocomplete.
 *
 * GET /headless-fuzzyfind/v1/search?query=...&page=1&per_page=10&orderby=relevance
 * GET /headless-fuzzyfind/v1/autocomplete?query=...&limit=8
 *
 * Queries the FULLTEXT index table directly via SQL — no WP_Query hooks.
 */

import { RestRoute } from 'wpts';

class FfSearchRoutes {

  // ── Search Endpoint ──────────────────────────────────────────────────

  @RestRoute('/search', { method: 'GET', public: true })
  search(request: any): any {
    if (!classExists('WooCommerce')) {
      return new WP_Error('woocommerce_required', 'WooCommerce is not active.', { status: 400 });
    }

    const query: string = sanitizeTextField(request.get_param('query') ?? '');
    const page: number = intval(request.get_param('page') ?? 1);
    const rawPerPage: number = intval(request.get_param('per_page') ?? 10);
    const perPage: number = rawPerPage > 100 ? 100 : (rawPerPage < 1 ? 1 : rawPerPage);
    const orderby: string = sanitizeTextField(request.get_param('orderby') ?? 'relevance');

    const minLength: number = intval(getOption('headless_fuzzy_find_min_query_length', 2));
    if (query.length < minLength) {
      return restEnsureResponse({ results: [], total: 0, total_pages: 0, page: page, per_page: perPage, did_you_mean: [] });
    }

    const tableName: string = getOption('headless_fuzzyfind_index_table', '');
    if (!tableName) {
      return restEnsureResponse({ results: [], total: 0, total_pages: 0, page: page, per_page: perPage, did_you_mean: [] });
    }

    let booleanQuery: string = this.buildBooleanQuery(query);
    if (!booleanQuery) {
      return restEnsureResponse({ results: [], total: 0, total_pages: 0, page: page, per_page: perPage, did_you_mean: [] });
    }

    // Load weights
    const wTitle: number = intval(getOption('headless_fuzzy_find_weight_title', 10));
    const wSku: number = intval(getOption('headless_fuzzy_find_weight_sku', 8));
    const wContent: number = intval(getOption('headless_fuzzy_find_weight_content', 2));

    const postsTable: string = wpdb.posts;
    let didYouMean: string[] = [];

    // Count total matches (FULLTEXT + post_status check)
    let total: number = intval(wpdb.getVar(
      wpdb.prepare(
        'SELECT COUNT(DISTINCT ff_si.product_id) FROM %i AS ff_si INNER JOIN %i AS p ON ff_si.product_id = p.ID WHERE p.post_status = %s AND MATCH(ff_si.title, ff_si.sku, ff_si.short_desc, ff_si.attributes, ff_si.categories, ff_si.tags, ff_si.variation_skus) AGAINST (%s IN BOOLEAN MODE)',
        tableName, postsTable, 'publish', booleanQuery
      )
    ) ?? '0');

    // Fuzzy correction fallback if 0 results
    if (total === 0) {
      const corrected: string = this.getCorrectedQuery(query, tableName);
      if (corrected) {
        booleanQuery = this.buildBooleanQuery(corrected);
        if (booleanQuery) {
          total = intval(wpdb.getVar(
            wpdb.prepare(
              'SELECT COUNT(DISTINCT ff_si.product_id) FROM %i AS ff_si INNER JOIN %i AS p ON ff_si.product_id = p.ID WHERE p.post_status = %s AND MATCH(ff_si.title, ff_si.sku, ff_si.short_desc, ff_si.attributes, ff_si.categories, ff_si.tags, ff_si.variation_skus) AGAINST (%s IN BOOLEAN MODE)',
              tableName, postsTable, 'publish', booleanQuery
            )
          ) ?? '0');
        }
      }
    }

    // LIKE fallback for very short queries that FULLTEXT can't handle
    let useLike: boolean = false;
    if (total === 0 && query.length < 3) {
      const escapedQuery: string = wpdb.escLike(query);
      const likePattern: string = '%' + escapedQuery + '%';
      total = intval(wpdb.getVar(
        wpdb.prepare(
          'SELECT COUNT(DISTINCT ff_si.product_id) FROM %i AS ff_si INNER JOIN %i AS p ON ff_si.product_id = p.ID WHERE p.post_status = %s AND (ff_si.title LIKE %s OR ff_si.sku LIKE %s)',
          tableName, postsTable, 'publish', likePattern, likePattern
        )
      ) ?? '0');
      useLike = true;
    }

    const totalPages: number = total > 0 ? intval(Math.ceil(total / perPage)) : 0;
    const offset: number = (page - 1) * perPage;

    if (total === 0) {
      // Get "did you mean" suggestions
      const threshold: number = intval(getOption('headless_fuzzy_find_did_you_mean_threshold', 3));
      if (threshold > 0) {
        didYouMean = this.getDidYouMeanSuggestions(query, tableName);
      }
      this.logSearch(query, 0);
      return restEnsureResponse({ results: [], total: 0, total_pages: 0, page: page, per_page: perPage, did_you_mean: didYouMean });
    }

    // Fetch matching rows with weighted relevance scoring
    let rows: any[];
    if (useLike) {
      const escapedQuery: string = wpdb.escLike(query);
      const likePattern: string = '%' + escapedQuery + '%';
      rows = wpdb.getResults(
        wpdb.prepare(
          'SELECT ff_si.product_id, ff_si.title, ff_si.sku, ff_si.short_desc FROM %i AS ff_si INNER JOIN %i AS p ON ff_si.product_id = p.ID WHERE p.post_status = %s AND (ff_si.title LIKE %s OR ff_si.sku LIKE %s) ORDER BY ff_si.title ASC LIMIT %d OFFSET %d',
          tableName, postsTable, 'publish', likePattern, likePattern, perPage, offset
        ),
        'ARRAY_A'
      ) ?? [];
    } else {
      if (orderby === 'title') {
        rows = wpdb.getResults(
          wpdb.prepare(
            'SELECT ff_si.product_id, ff_si.title, ff_si.sku, ff_si.short_desc FROM %i AS ff_si INNER JOIN %i AS p ON ff_si.product_id = p.ID WHERE p.post_status = %s AND MATCH(ff_si.title, ff_si.sku, ff_si.short_desc, ff_si.attributes, ff_si.categories, ff_si.tags, ff_si.variation_skus) AGAINST (%s IN BOOLEAN MODE) ORDER BY ff_si.title ASC LIMIT %d OFFSET %d',
            tableName, postsTable, 'publish', booleanQuery, perPage, offset
          ),
          'ARRAY_A'
        ) ?? [];
      } else {
        rows = wpdb.getResults(
          wpdb.prepare(
            'SELECT ff_si.product_id, ff_si.title, ff_si.sku, ff_si.short_desc, (MATCH(ff_si.title) AGAINST (%s IN BOOLEAN MODE) * %d + MATCH(ff_si.sku) AGAINST (%s IN BOOLEAN MODE) * %d + MATCH(ff_si.title, ff_si.sku, ff_si.short_desc, ff_si.attributes, ff_si.categories, ff_si.tags, ff_si.variation_skus) AGAINST (%s IN BOOLEAN MODE) * %d) AS relevance_score FROM %i AS ff_si INNER JOIN %i AS p ON ff_si.product_id = p.ID WHERE p.post_status = %s AND MATCH(ff_si.title, ff_si.sku, ff_si.short_desc, ff_si.attributes, ff_si.categories, ff_si.tags, ff_si.variation_skus) AGAINST (%s IN BOOLEAN MODE) ORDER BY relevance_score DESC LIMIT %d OFFSET %d',
            booleanQuery, wTitle, booleanQuery, wSku, booleanQuery, wContent,
            tableName, postsTable, 'publish', booleanQuery, perPage, offset
          ),
          'ARRAY_A'
        ) ?? [];
      }
    }

    // Batch load products to avoid N+1
    const productIds: number[] = [];
    for (const row of rows) {
      productIds.push(intval(row['product_id']));
    }

    const products: any[] = productIds.length > 0
      ? wcGetProducts({ include: productIds, limit: productIds.length, return: 'objects' })
      : [];

    // Map products by ID for quick lookup
    const productMap: Record<string, any> = {};
    for (const product of products) {
      if (product) {
        productMap[product.get_id()] = product;
      }
    }

    // Build response
    let results: any[] = [];
    for (const row of rows) {
      const productId: number = intval(row['product_id']);
      const product: any = productMap[productId] ?? null;

      if (!product) {
        continue;
      }

      const imageId: number = product.get_image_id();
      let imageUrl: string = '';
      if (imageId) {
        const imageSrc: any = wpGetAttachmentImageSrc(imageId, 'thumbnail');
        if (imageSrc && imageSrc[0]) {
          imageUrl = imageSrc[0];
        }
      }

      const item: any = {
        id: productId,
        title: row['title'],
        sku: row['sku'] ?? '',
        price: product.get_price() ?? '',
        price_html: product.get_price_html() ?? '',
        permalink: getPermalink(productId) ?? '',
        image: imageUrl,
        short_description: row['short_desc'] ?? '',
      };

      if (row['relevance_score']) {
        item['relevance_score'] = parseFloat(row['relevance_score']);
      }

      results.push(item);
    }

    // "Did you mean?" when results are below threshold
    const threshold: number = intval(getOption('headless_fuzzy_find_did_you_mean_threshold', 3));
    if (results.length < threshold) {
      didYouMean = this.getDidYouMeanSuggestions(query, tableName);
    }

    this.logSearch(query, total);

    return restEnsureResponse({
      results: results,
      total: total,
      total_pages: totalPages,
      page: page,
      per_page: perPage,
      did_you_mean: didYouMean,
    });
  }

  // ── Autocomplete Endpoint ────────────────────────────────────────────

  @RestRoute('/autocomplete', { method: 'GET', public: true })
  autocomplete(request: any): any {
    if (!classExists('WooCommerce')) {
      return new WP_Error('woocommerce_required', 'WooCommerce is not active.', { status: 400 });
    }

    const autocompleteEnabled: string = getOption('headless_fuzzy_find_autocomplete_enabled', '1');
    if (autocompleteEnabled !== '1') {
      return new WP_Error('autocomplete_disabled', 'Autocomplete is disabled.', { status: 403 });
    }

    const query: string = sanitizeTextField(request.get_param('query') ?? '');
    const rawLimit: number = intval(request.get_param('limit') ?? getOption('headless_fuzzy_find_autocomplete_limit', 8));
    const limit: number = rawLimit > 50 ? 50 : (rawLimit < 1 ? 1 : rawLimit);

    const minLength: number = intval(getOption('headless_fuzzy_find_min_query_length', 2));
    if (query.length < minLength) {
      return restEnsureResponse({ results: [], did_you_mean: [] });
    }

    const tableName: string = getOption('headless_fuzzyfind_index_table', '');
    if (!tableName) {
      return restEnsureResponse({ results: [], did_you_mean: [] });
    }

    // Try FULLTEXT first, fall back to LIKE for short queries
    let results: any[] = [];
    const booleanQuery: string = this.buildBooleanQuery(query);

    if (!booleanQuery) {
      return restEnsureResponse({ results: [], did_you_mean: [] });
    }

    const postsTableAc: string = wpdb.posts;

    results = wpdb.getResults(
      wpdb.prepare(
        'SELECT ff_si.product_id, ff_si.title, ff_si.sku FROM %i AS ff_si INNER JOIN %i AS p ON ff_si.product_id = p.ID WHERE p.post_status = %s AND MATCH(ff_si.title, ff_si.sku, ff_si.short_desc, ff_si.attributes, ff_si.categories, ff_si.tags, ff_si.variation_skus) AGAINST (%s IN BOOLEAN MODE) ORDER BY MATCH(ff_si.title) AGAINST (%s IN BOOLEAN MODE) DESC LIMIT %d',
        tableName, postsTableAc, 'publish', booleanQuery, booleanQuery, limit
      ),
      'ARRAY_A'
    );

    // Fallback to LIKE if FULLTEXT returns nothing (handles short words < 3 chars)
    if (!results || results.length === 0) {
      const escapedQuery: string = wpdb.escLike(query);
      const likePattern: string = '%' + escapedQuery + '%';
      results = wpdb.getResults(
        wpdb.prepare(
          'SELECT ff_si.product_id, ff_si.title, ff_si.sku FROM %i AS ff_si INNER JOIN %i AS p ON ff_si.product_id = p.ID WHERE p.post_status = %s AND (ff_si.title LIKE %s OR ff_si.sku LIKE %s) LIMIT %d',
          tableName, postsTableAc, 'publish', likePattern, likePattern, limit
        ),
        'ARRAY_A'
      );
    }

    if (!results) {
      results = [];
    }

    // Batch load products to avoid N+1
    const productIds: number[] = [];
    for (const row of results) {
      productIds.push(intval(row['product_id']));
    }

    const products: any[] = productIds.length > 0
      ? wcGetProducts({ include: productIds, limit: productIds.length, return: 'objects' })
      : [];

    const productMap: Record<string, any> = {};
    for (const product of products) {
      if (product) {
        productMap[product.get_id()] = product;
      }
    }

    // Build product response
    let suggestions: any[] = [];
    for (const row of results) {
      const productId: number = intval(row['product_id']);
      const product: any = productMap[productId] ?? null;

      if (!product) {
        continue;
      }

      const imageId: number = product.get_image_id();
      let imageUrl: string = '';
      if (imageId) {
        const imageSrc: any = wpGetAttachmentImageSrc(imageId, 'thumbnail');
        if (imageSrc && imageSrc[0]) {
          imageUrl = imageSrc[0];
        }
      }

      suggestions.push({
        id: productId,
        title: row['title'],
        sku: row['sku'] ?? '',
        price: product.get_price() ?? '',
        price_html: product.get_price_html() ?? '',
        permalink: getPermalink(productId) ?? '',
        image: imageUrl,
      });
    }

    // "Did you mean?" suggestions when results are below threshold
    let didYouMean: string[] = [];
    const threshold: number = intval(getOption('headless_fuzzy_find_did_you_mean_threshold', 3));
    if (suggestions.length < threshold) {
      didYouMean = this.getDidYouMeanSuggestions(query, tableName);
    }

    return restEnsureResponse({
      results: suggestions,
      did_you_mean: didYouMean,
    });
  }

  // ── Levenshtein Word Correction ──────────────────────────────────────

  correctWords(searchTerm: string, tableName: string): any {
    const fuzzyEnabled: string = getOption('headless_fuzzy_find_fuzzy_enabled', '1');
    if (fuzzyEnabled !== '1') {
      return { corrected: '', hasCorrected: false };
    }

    const postsTableCw: string = wpdb.posts;
    const titles: string[] = wpdb.getCol(
      wpdb.prepare('SELECT DISTINCT ff_si.title FROM %i AS ff_si INNER JOIN %i AS p ON ff_si.product_id = p.ID WHERE p.post_status = %s LIMIT 500', tableName, postsTableCw, 'publish')
    ) ?? [];

    let indexWords: string[] = [];
    for (const title of titles) {
      const words: string[] = title.toLowerCase().split(' ');
      indexWords = indexWords.concat(words);
    }
    indexWords = arrayValues(arrayUnique(indexWords));

    const searchWords: string[] = searchTerm.trim().toLowerCase().split(' ');
    let correctedWords: string[] = [];
    let hasCorrected: boolean = false;

    for (const word of searchWords) {
      const trimmed: string = word.trim();
      if (trimmed.length < 3) {
        correctedWords.push(trimmed);
        continue;
      }

      let bestMatch: string = trimmed;
      let bestDistance: number = 999;

      for (const indexWord of indexWords) {
        if (indexWord.length < 2) {
          continue;
        }
        const lenDiff: number = trimmed.length > indexWord.length
          ? trimmed.length - indexWord.length
          : indexWord.length - trimmed.length;
        if (lenDiff > 2) {
          continue;
        }
        const distance: number = levenshtein(trimmed, indexWord);
        if (distance < bestDistance && distance <= 2) {
          bestDistance = distance;
          bestMatch = indexWord;
        }
      }

      if (bestMatch !== trimmed) {
        hasCorrected = true;
      }
      correctedWords.push(bestMatch);
    }

    return { corrected: correctedWords.join(' '), hasCorrected: hasCorrected };
  }

  // ── "Did You Mean" suggestions ──────────────────────────────────────

  getDidYouMeanSuggestions(searchTerm: string, tableName: string): string[] {
    const result: any = this.correctWords(searchTerm, tableName);
    if (!result['hasCorrected']) {
      return [];
    }

    const boolQuery: string = this.buildBooleanQuery(result['corrected']);
    const postsTableDym: string = wpdb.posts;
    const correctedResults: string[] = wpdb.getCol(
      wpdb.prepare(
        'SELECT DISTINCT ff_si.title FROM %i AS ff_si INNER JOIN %i AS p ON ff_si.product_id = p.ID WHERE p.post_status = %s AND MATCH(ff_si.title, ff_si.sku, ff_si.short_desc, ff_si.attributes, ff_si.categories, ff_si.tags, ff_si.variation_skus) AGAINST (%s IN BOOLEAN MODE) LIMIT 5',
        tableName, postsTableDym, 'publish', boolQuery
      )
    ) ?? [];

    return correctedResults;
  }

  // ── Fuzzy Query Correction ──────────────────────────────────────────

  getCorrectedQuery(searchTerm: string, tableName: string): string {
    const result: any = this.correctWords(searchTerm, tableName);
    if (!result['hasCorrected']) {
      return '';
    }
    return result['corrected'];
  }

  // ── Boolean Query Builder ─────────────────────────────────────────

  buildBooleanQuery(searchTerm: string): string {
    const synonymsRaw: string = getOption('headless_fuzzy_find_synonyms', '');
    const synonymGroups: string[] = synonymsRaw ? synonymsRaw.split('\n') : [];

    const words: string[] = searchTerm.trim().toLowerCase().split(' ');
    let parts: string[] = [];

    for (const word of words) {
      const trimmed: string = word.trim();
      if (trimmed.length === 0) { continue; }

      // Find synonyms for this word
      let synonyms: string[] = [];
      for (const group of synonymGroups) {
        const terms: string[] = group.split(',');
        let found: boolean = false;
        for (const term of terms) {
          if (term.trim().toLowerCase() === trimmed) {
            found = true;
            break;
          }
        }
        if (found) {
          for (const term of terms) {
            const t: string = term.trim().toLowerCase();
            if (t && t !== trimmed) {
              synonyms.push(t);
            }
          }
          break;
        }
      }

      // Strip all MySQL FULLTEXT boolean mode operators
      const safeTrimmed: string = strtr(trimmed, '+-><()~*"@', '          ').trim();
      if (safeTrimmed.length === 0) { continue; }

      if (synonyms.length > 0) {
        let synGroup: string = safeTrimmed + '*';
        for (const syn of synonyms) {
          const safeSyn: string = strtr(syn, '+-><()~*"@', '          ').trim();
          if (safeSyn.length > 0) {
            synGroup = synGroup + ' ' + safeSyn + '*';
          }
        }
        parts.push('+(' + synGroup + ')');
      } else {
        parts.push('+' + safeTrimmed + '*');
      }
    }

    return parts.join(' ');
  }

  // ── Analytics Logging ─────────────────────────────────────────────

  logSearch(searchTerm: string, resultCount: number): void {
    const analyticsEnabled: string = getOption('headless_fuzzy_find_analytics_enabled', '1');
    if (analyticsEnabled !== '1') {
      return;
    }

    const logTable: string = getOption('headless_fuzzyfind_log_table', '');
    if (!logTable) {
      return;
    }

    const normalizedQuery: string = searchTerm.trim().toLowerCase();
    if (normalizedQuery.length === 0) {
      return;
    }

    wpdb.query(
      wpdb.prepare(
        'INSERT INTO %i (query, result_count, search_count, last_searched) VALUES (%s, %d, 1, NOW()) ON DUPLICATE KEY UPDATE search_count = search_count + 1, result_count = %d, last_searched = NOW()',
        logTable, normalizedQuery, resultCount, resultCount
      )
    );
  }
}
