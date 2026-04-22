/**
 * Fuzzy Find Admin Routes — REST endpoints for admin settings page.
 *
 * Provides index status, rebuild trigger, and analytics data.
 */

import { RestRoute } from '@amitgurbani/wpts';

class FfAdminRoutes {
  // ── Index Status ────────────────────────────────────────────────────

  @RestRoute('/index/status', { method: 'GET', capability: 'manage_options' })
  getIndexStatus(_request: any): any {
    const tableName: string = getOption('headless_fuzzy_find_index_table', '');
    const isIndexing: string = getOption('headless_fuzzy_find_reindex_in_progress', '');
    const lastIndexed: any = getOption('headless_fuzzy_find_last_indexed', '');

    let totalIndexed: number = 0;
    if (tableName) {
      const count: string | null = wpdb.getVar(wpdb.prepare('SELECT COUNT(*) FROM %i', tableName));
      if (count) {
        totalIndexed = intval(count);
      }
    }

    let totalProducts: number = 0;
    if (classExists('WooCommerce')) {
      const count: string | null = wpdb.getVar(
        wpdb.prepare(
          "SELECT COUNT(*) FROM %i WHERE post_type = 'product' AND post_status = 'publish'",
          wpdb.posts,
        ),
      );
      totalProducts = count ? intval(count) : 0;
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
  rebuildIndex(_request: any): any {
    if (!classExists('WooCommerce')) {
      return new WP_Error(
        'woocommerce_required',
        __('WooCommerce is not active.', 'headless-fuzzy-find'),
        { status: 400 },
      );
    }

    const isIndexing: string = getOption('headless_fuzzy_find_reindex_in_progress', '');
    if (isIndexing === '1') {
      // Allow override if flag is stale (>10 minutes old)
      const flagTime: number = intval(getOption('headless_fuzzy_find_reindex_started', '0'));
      if (flagTime > 0 && time() - flagTime < 600) {
        return new WP_Error(
          'already_indexing',
          __('A reindex is already in progress.', 'headless-fuzzy-find'),
          {
            status: 409,
          },
        );
      }
    }

    // Set flag immediately to prevent concurrent reindexes (TOCTOU guard)
    updateOption('headless_fuzzy_find_reindex_in_progress', '1');
    updateOption('headless_fuzzy_find_reindex_started', time());

    // For small stores, run synchronously
    const count: string | null = wpdb.getVar(
      wpdb.prepare(
        "SELECT COUNT(*) FROM %i WHERE post_type = 'product' AND post_status = 'publish'",
        wpdb.posts,
      ),
    );
    const totalProducts: number = count ? intval(count) : 0;

    if (totalProducts <= 500) {
      // Run synchronously
      doAction('headless_fuzzy_find_do_reindex');
      return restEnsureResponse({
        message: 'Reindex completed.',
        total_products: totalProducts,
      });
    }

    // For larger stores, schedule via WP-Cron
    const scheduled: any = wpNextScheduled('headless_fuzzy_find_do_reindex');
    if (!scheduled) {
      wpScheduleSingleEvent(time() + 5, 'headless_fuzzy_find_do_reindex');
    }

    return restEnsureResponse({
      message: 'Reindex scheduled. This may take a few minutes.',
      total_products: totalProducts,
    });
  }

  // ── Delete Index ───────────────────────────────────────────────────

  @RestRoute('/index/delete', { method: 'POST', capability: 'manage_options' })
  deleteIndex(_request: any): any {
    const tableName: string = getOption('headless_fuzzy_find_index_table', '');
    if (tableName) {
      wpdb.query(wpdb.prepare('TRUNCATE TABLE %i', tableName));
    }
    deleteOption('headless_fuzzy_find_last_indexed');
    deleteOption('headless_fuzzy_find_reindex_in_progress');

    return restEnsureResponse({
      message: 'Index cleared.',
    });
  }

  // ── Analytics ───────────────────────────────────────────────────────

  @RestRoute('/analytics', { method: 'GET', capability: 'manage_options' })
  getAnalytics(_request: any): any {
    const logTable: string = getOption('headless_fuzzy_find_log_table', '');
    if (!logTable) {
      return restEnsureResponse({ popular: [], zero_results: [] });
    }

    // Popular searches (top 20)
    const popular: any[] =
      wpdb.getResults(
        wpdb.prepare(
          'SELECT query, search_count, result_count, last_searched FROM %i WHERE result_count > 0 ORDER BY search_count DESC LIMIT 20',
          logTable,
        ),
      ) ?? [];

    // Zero-result searches (top 20)
    const zeroResults: any[] =
      wpdb.getResults(
        wpdb.prepare(
          'SELECT query, search_count, last_searched FROM %i WHERE result_count = 0 ORDER BY search_count DESC LIMIT 20',
          logTable,
        ),
      ) ?? [];

    return restEnsureResponse({
      popular: popular,
      zero_results: zeroResults,
    });
  }

  // ── Clear Analytics ─────────────────────────────────────────────────

  @RestRoute('/analytics/clear', { method: 'POST', capability: 'manage_options' })
  clearAnalytics(_request: any): any {
    const logTable: string = getOption('headless_fuzzy_find_log_table', '');
    if (logTable) {
      wpdb.query(wpdb.prepare('TRUNCATE TABLE %i', logTable));
    }

    return restEnsureResponse({
      message: 'Analytics cleared.',
    });
  }
}
