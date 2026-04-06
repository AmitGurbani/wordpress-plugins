/**
 * Wishlist REST API Endpoints
 *
 * CRUD operations for per-user wishlists.
 * Namespace: headless-wishlist/v1
 */

import { RestRoute } from 'wpts';

class WishlistRoutes {
  // ── Helpers ──────────────────────────────────────────────────────────

  getWishlist(userId: number): any[] {
    const raw: string = getUserMeta(userId, '_headless_wishlist', true);
    if (!raw) {
      return [];
    }
    return jsonDecode(raw, true) ?? [];
  }

  saveWishlist(userId: number, items: any[]): void {
    updateUserMeta(userId, '_headless_wishlist', jsonEncode(items));
  }

  // ── GET /items — List wishlist ───────────────────────────────────────

  @RestRoute('/items', { method: 'GET', capability: 'read' })
  getItems(_request: any): any {
    const userId: number = getCurrentUserId();
    const items: any[] = this.getWishlist(userId);

    const validItems: any[] = [];
    for (const item of items) {
      const post: any = getPost(intval(item.product_id), 'ARRAY_A');
      if (post && post.post_type === 'product' && post.post_status === 'publish') {
        validItems.push({
          product_id: intval(item.product_id),
          slug: post.post_name,
          added_at: item.added_at,
        });
      }
    }

    // Auto-cleanup: persist if stale items were removed
    if (validItems.length !== items.length) {
      const cleaned: any[] = [];
      for (const v of validItems) {
        cleaned.push({ product_id: v.product_id, added_at: v.added_at });
      }
      this.saveWishlist(userId, cleaned);
    }

    // Items are stored in chronological order — reverse for most recent first
    return { items: validItems.reverse() };
  }

  // ── POST /items — Add to wishlist ────────────────────────────────────

  @RestRoute('/items', { method: 'POST', capability: 'read' })
  addItem(request: any): any {
    const productId: number = intval(request.get_param('product_id'));
    if (!productId) {
      return new WP_Error('missing_product_id', 'product_id is required.', { status: 400 });
    }

    const post: any = getPost(productId, 'ARRAY_A');
    if (!post || post.post_type !== 'product' || post.post_status !== 'publish') {
      return new WP_Error('product_not_found', 'Product not found', { status: 404 });
    }

    const userId: number = getCurrentUserId();
    const items: any[] = this.getWishlist(userId);

    // Check duplicate
    for (const item of items) {
      if (intval(item.product_id) === productId) {
        return new WP_Error('already_exists', 'Product already in wishlist', { status: 409 });
      }
    }

    // Check max items
    const maxItems: number = intval(applyFilters('headless_wishlist_max_items', 100));
    if (items.length >= maxItems) {
      return new WP_Error('wishlist_full', 'Wishlist has reached the maximum number of items.', {
        status: 400,
      });
    }

    const addedAt: string = gmdate('c', time());
    items.push({ product_id: productId, added_at: addedAt });
    this.saveWishlist(userId, items);

    const response: any = restEnsureResponse({
      success: true,
      item: {
        product_id: productId,
        slug: post.post_name,
        added_at: addedAt,
      },
    });
    response.set_status(201);
    return response;
  }

  // ── DELETE /items/:product_id — Remove from wishlist ─────────────────

  @RestRoute('/items/(?P<product_id>\\d+)', { method: 'DELETE', capability: 'read' })
  removeItem(request: any): any {
    const productId: number = intval(request.get_param('product_id'));
    const userId: number = getCurrentUserId();
    const items: any[] = this.getWishlist(userId);

    let found: boolean = false;
    const updated: any[] = [];
    for (const item of items) {
      if (intval(item.product_id) === productId) {
        found = true;
      } else {
        updated.push(item);
      }
    }

    if (!found) {
      return new WP_Error('not_found', 'Product not in wishlist', { status: 404 });
    }

    this.saveWishlist(userId, updated);
    return { success: true };
  }

  // ── DELETE /items — Clear wishlist ───────────────────────────────────

  @RestRoute('/items', { method: 'DELETE', capability: 'read' })
  clearItems(_request: any): any {
    const userId: number = getCurrentUserId();
    deleteUserMeta(userId, '_headless_wishlist');
    return { success: true };
  }
}
