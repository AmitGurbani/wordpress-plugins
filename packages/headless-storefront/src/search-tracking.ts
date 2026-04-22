/**
 * Headless Storefront Search Tracking
 *
 * Tracks WooCommerce Store API product search queries in a custom table.
 * Provides admin endpoints for viewing and clearing search data.
 * Weekly cron prunes entries older than 90 days.
 */

import { Action, Filter, RestRoute } from '@amitgurbani/wpts';

class SearchTracking {
  // ── Track WC Store API searches ──────────────��─────────────────────

  @Filter('rest_pre_dispatch', { priority: 10, acceptedArgs: 3 })
  trackSearch(result: any, _server: any, request: any): any {
    const route: string = request.get_route();
    if (route !== '/wc/store/v1/products') {
      return result;
    }

    const rawSearch: string = request.get_param('search') ?? '';
    const search: string = strtolower(trim(sanitizeTextField(rawSearch)));

    if (strlen(search) < 2) {
      return result;
    }

    const table: string = `${wpdb.prefix}headless_search_queries`;

    wpdb.query(
      wpdb.prepare(
        'INSERT INTO %i (`query`, count, last_searched) VALUES (%s, 1, NOW()) ON DUPLICATE KEY UPDATE count = count + 1, last_searched = NOW()',
        table,
        search,
      ),
    );

    return result;
  }

  // ── Weekly cleanup cron ─────────────��───────────────────────────��──

  @Action('headless_storefront_search_cleanup')
  cleanupOldSearches(): void {
    const table: string = `${wpdb.prefix}headless_search_queries`;

    wpdb.query(
      wpdb.prepare('DELETE FROM %i WHERE last_searched < DATE_SUB(NOW(), INTERVAL 90 DAY)', table),
    );
  }

  // ── Admin: get popular searches ────────────────────────────────────

  @RestRoute('/admin/popular-searches', { method: 'GET', capability: 'manage_options' })
  getPopularSearches(_request: any): any {
    const table: string = `${wpdb.prefix}headless_search_queries`;

    const rows: any[] =
      wpdb.getResults(
        wpdb.prepare(
          'SELECT `query`, count, last_searched FROM %i ORDER BY count DESC LIMIT 50',
          table,
        ),
      ) ?? [];

    return restEnsureResponse(rows);
  }

  // ── Admin: clear search data ───────────────────────────────────────

  @RestRoute('/admin/clear-searches', { method: 'POST', capability: 'manage_options' })
  clearSearches(_request: any): any {
    const table: string = `${wpdb.prefix}headless_search_queries`;
    wpdb.query(wpdb.prepare('TRUNCATE TABLE %i', table));

    return restEnsureResponse({ success: true });
  }
}
