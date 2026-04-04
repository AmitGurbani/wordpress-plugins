/**
 * Wishlist Analytics REST API Endpoints
 *
 * Admin-only analytics for wishlist data.
 * Namespace: headless-wishlist/v1
 */

import { RestRoute } from 'wpts';

class AnalyticsRoutes {
  // ── GET /analytics/popular — Most wishlisted products ────────────────

  @RestRoute('/analytics/popular', { method: 'GET', capability: 'manage_options' })
  getPopular(request: any): any {
    const rows: any[] = wpdb.getResults(
      wpdb.prepare(
        'SELECT meta_value FROM ' + wpdb.usermeta + ' WHERE meta_key = %s',
        '_headless_wishlist',
      ),
      'ARRAY_A',
    );

    const counts: Record<string, number> = {};
    let totalItems: number = 0;

    for (const row of rows) {
      const items: any[] = jsonDecode(row['meta_value'], true) || [];
      for (const item of items) {
        const pid: string = strval(intval(item['product_id']));
        if (counts[pid] === undefined) {
          counts[pid] = 0;
        }
        counts[pid] = counts[pid] + 1;
        totalItems = totalItems + 1;
      }
    }

    // Sort by count descending, take top 20
    arsort(counts);
    const topIds: string[] = arraySlice(Object.keys(counts), 0, 20);

    const popular: any[] = [];
    for (const pidStr of topIds) {
      const pid: number = intval(pidStr);
      const post: any = getPost(pid, 'ARRAY_A');
      if (post && post['post_type'] === 'product' && post['post_status'] === 'publish') {
        popular.push({
          product_id: pid,
          name: post['post_title'],
          slug: post['post_name'],
          count: counts[pidStr],
        });
      }
    }

    return {
      popular: popular,
      total_users: rows.length,
      total_items: totalItems,
    };
  }
}
