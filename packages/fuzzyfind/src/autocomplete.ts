/**
 * FuzzyFind Autocomplete — Lightweight REST endpoint for search-as-you-type.
 *
 * GET /fuzzyfind/v1/autocomplete?query=...&limit=8
 * Returns minimal product data for fast autocomplete UI.
 */

import { RestRoute } from 'wpts';

class FfAutocomplete {

  @RestRoute('/autocomplete', { method: 'GET', public: true })
  autocomplete(request: any): any {
    if (!classExists('WooCommerce')) {
      return new WP_Error('woocommerce_required', 'WooCommerce is not active.', { status: 400 });
    }

    const autocompleteEnabled: string = getOption('fuzzy_find_for_woo_commerce_autocomplete_enabled', '1');
    if (autocompleteEnabled !== '1') {
      return new WP_Error('autocomplete_disabled', 'Autocomplete is disabled.', { status: 403 });
    }

    const query: string = sanitizeTextField(request.get_param('query') ?? '');
    const limit: number = intval(request.get_param('limit') ?? getOption('fuzzy_find_for_woo_commerce_autocomplete_limit', 8));

    const minLength: number = intval(getOption('fuzzy_find_for_woo_commerce_min_query_length', 2));
    if (query.length < minLength) {
      return restEnsureResponse([]);
    }

    const tableName: string = getOption('fuzzyfind_index_table', '');
    if (!tableName) {
      return restEnsureResponse([]);
    }

    // Try FULLTEXT first, fall back to LIKE for short queries
    let results: any[] = [];
    const booleanQuery: string = this.buildBooleanQuery(query);

    results = wpdb.getResults(
      wpdb.prepare(
        'SELECT product_id, title, sku FROM %i WHERE MATCH(title, sku, short_desc, attributes, categories, tags, variation_skus) AGAINST (%s IN BOOLEAN MODE) ORDER BY MATCH(title) AGAINST (%s IN BOOLEAN MODE) DESC LIMIT %d',
        tableName, booleanQuery, booleanQuery, limit
      )
    );

    // Fallback to LIKE if FULLTEXT returns nothing (handles short words < 3 chars)
    if (!results || results.length === 0) {
      const escapedQuery: string = wpdb.escLike(query);
      const likePattern: string = '%' + escapedQuery + '%';
      results = wpdb.getResults(
        wpdb.prepare(
          'SELECT product_id, title, sku FROM %i WHERE title LIKE %s OR sku LIKE %s LIMIT %d',
          tableName, likePattern, likePattern, limit
        )
      );
    }

    if (!results || results.length === 0) {
      return restEnsureResponse([]);
    }

    // Build response with product data
    let suggestions: any[] = [];
    for (const row of results) {
      const productId: number = intval(row['product_id']);
      const product: any = wcGetProduct(productId);

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

    return restEnsureResponse(suggestions);
  }

  buildBooleanQuery(searchTerm: string): string {
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
}
