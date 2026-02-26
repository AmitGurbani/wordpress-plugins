/**
 * FuzzyFind Admin Routes — REST endpoints for admin settings page.
 *
 * Provides index status, rebuild trigger, and analytics data.
 */

import { RestRoute } from 'wpts';

class FfAdminRoutes {

  // ── Index Status ────────────────────────────────────────────────────

  @RestRoute('/index/status', { method: 'GET', capability: 'manage_options' })
  getIndexStatus(request: any): any {
    const tableName: string = getOption('fuzzyfind_index_table', '');
    const isIndexing: string = getOption('fuzzyfind_reindex_in_progress', '');
    const lastIndexed: any = getOption('fuzzyfind_last_indexed', '');

    let totalIndexed: number = 0;
    if (tableName) {
      const count: string | null = wpdb.getVar(wpdb.prepare('SELECT COUNT(*) FROM %i', tableName));
      if (count) {
        totalIndexed = intval(count);
      }
    }

    let totalProducts: number = 0;
    if (classExists('WooCommerce')) {
      const counts: any = wpCountPosts('product');
      if (counts && counts['publish']) {
        totalProducts = intval(counts['publish']);
      }
    }

    return restEnsureResponse({
      total_products: totalProducts,
      total_indexed: totalIndexed,
      last_indexed: lastIndexed ? intval(lastIndexed) : null,
      is_indexing: isIndexing === '1',
    });
  }

  // ── Rebuild Index ───────────────────────────────────────────────────

  @RestRoute('/index/rebuild', { method: 'POST', capability: 'manage_options' })
  rebuildIndex(request: any): any {
    if (!classExists('WooCommerce')) {
      return new WP_Error('woocommerce_required', 'WooCommerce is not active.', { status: 400 });
    }

    const isIndexing: string = getOption('fuzzyfind_reindex_in_progress', '');
    if (isIndexing === '1') {
      return new WP_Error('already_indexing', 'A reindex is already in progress.', { status: 409 });
    }

    // For small stores, run synchronously
    const counts: any = wpCountPosts('product');
    const totalProducts: number = counts && counts['publish'] ? intval(counts['publish']) : 0;

    if (totalProducts <= 500) {
      // Run synchronously
      doAction('fuzzyfind_do_reindex');
      return restEnsureResponse({
        message: 'Reindex completed.',
        total_products: totalProducts,
      });
    }

    // For larger stores, schedule via WP-Cron
    const scheduled: any = wpNextScheduled('fuzzyfind_do_reindex');
    if (!scheduled) {
      wpScheduleSingleEvent(time() + 5, 'fuzzyfind_do_reindex');
    }

    return restEnsureResponse({
      message: 'Reindex scheduled. This may take a few minutes.',
      total_products: totalProducts,
    });
  }

  // ── Analytics ───────────────────────────────────────────────────────

  @RestRoute('/analytics', { method: 'GET', capability: 'manage_options' })
  getAnalytics(request: any): any {
    const logTable: string = getOption('fuzzyfind_log_table', '');
    if (!logTable) {
      return restEnsureResponse({ popular: [], zero_results: [] });
    }

    // Popular searches (top 20)
    const popular: any[] = wpdb.getResults(
      wpdb.prepare(
        'SELECT query, search_count, result_count, last_searched FROM %i WHERE result_count > 0 ORDER BY search_count DESC LIMIT 20',
        logTable
      )
    ) ?? [];

    // Zero-result searches (top 20)
    const zeroResults: any[] = wpdb.getResults(
      wpdb.prepare(
        'SELECT query, search_count, last_searched FROM %i WHERE result_count = 0 ORDER BY search_count DESC LIMIT 20',
        logTable
      )
    ) ?? [];

    return restEnsureResponse({
      popular: popular,
      zero_results: zeroResults,
    });
  }

  // ── Clear Analytics ─────────────────────────────────────────────────

  @RestRoute('/analytics/clear', { method: 'POST', capability: 'manage_options' })
  clearAnalytics(request: any): any {
    const logTable: string = getOption('fuzzyfind_log_table', '');
    if (logTable) {
      wpdb.query(wpdb.prepare('TRUNCATE TABLE %i', logTable));
    }

    return restEnsureResponse({
      message: 'Analytics cleared.',
    });
  }
}
