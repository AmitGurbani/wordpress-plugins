import { RestRoute } from 'wpts';

class CleanupRoutes {
  @RestRoute('/orphans', { method: 'GET', capability: 'manage_options' })
  getOrphans(request: any): any {
    if (!classExists('WooCommerce')) {
      return new WP_Error('woocommerce_required', 'WooCommerce is not active.', { status: 503 });
    }

    const perPage: number = Math.min(
      100,
      Math.max(1, intval(request.get_param('per_page') ?? '20')),
    );
    const page: number = Math.max(1, intval(request.get_param('page') ?? '1'));
    const offset: number = (page - 1) * perPage;

    // Find image attachments not referenced by any WooCommerce entity
    const sql: string = wpdb.prepare(
      `SELECT p.ID, p.post_title, p.guid, p.post_parent
       FROM ${wpdb.posts} p
       WHERE p.post_type = 'attachment'
         AND p.post_mime_type LIKE %s
         AND p.ID NOT IN (
           SELECT DISTINCT CAST(pm.meta_value AS UNSIGNED)
           FROM ${wpdb.postmeta} pm
           WHERE pm.meta_key = '_thumbnail_id'
             AND pm.meta_value != ''
             AND pm.meta_value != '0'
         )
         AND NOT EXISTS (
           SELECT 1 FROM ${wpdb.postmeta} pm2
           WHERE pm2.meta_key = '_product_image_gallery'
             AND FIND_IN_SET(p.ID, pm2.meta_value) > 0
         )
         AND p.ID NOT IN (
           SELECT DISTINCT CAST(tm.meta_value AS UNSIGNED)
           FROM ${wpdb.termmeta} tm
           WHERE tm.meta_key = 'thumbnail_id'
             AND tm.meta_value != ''
             AND tm.meta_value != '0'
         )
       ORDER BY p.ID DESC
       LIMIT %d OFFSET %d`,
      'image/%',
      perPage,
      offset,
    );

    const rows: any[] = wpdb.getResults(sql, 'ARRAY_A');

    const orphans: any[] = [];
    for (const row of rows) {
      const attachmentId: number = intval(row.ID);
      const imageUrl: string | false = wpGetAttachmentUrl(attachmentId);
      orphans.push({
        id: attachmentId,
        title: row.post_title,
        url: imageUrl ? imageUrl : row.guid,
        uploaded_to: intval(row.post_parent),
      });
    }

    // Count total orphans
    const countSql: string = wpdb.prepare(
      `SELECT COUNT(*)
       FROM ${wpdb.posts} p
       WHERE p.post_type = 'attachment'
         AND p.post_mime_type LIKE %s
         AND p.ID NOT IN (
           SELECT DISTINCT CAST(pm.meta_value AS UNSIGNED)
           FROM ${wpdb.postmeta} pm
           WHERE pm.meta_key = '_thumbnail_id'
             AND pm.meta_value != ''
             AND pm.meta_value != '0'
         )
         AND NOT EXISTS (
           SELECT 1 FROM ${wpdb.postmeta} pm2
           WHERE pm2.meta_key = '_product_image_gallery'
             AND FIND_IN_SET(p.ID, pm2.meta_value) > 0
         )
         AND p.ID NOT IN (
           SELECT DISTINCT CAST(tm.meta_value AS UNSIGNED)
           FROM ${wpdb.termmeta} tm
           WHERE tm.meta_key = 'thumbnail_id'
             AND tm.meta_value != ''
             AND tm.meta_value != '0'
         )`,
      'image/%',
    );

    const total: number = intval(wpdb.getVar(countSql));
    const totalPages: number = Math.ceil(total / perPage);

    const response: any = restEnsureResponse({
      orphans: orphans,
      total: total,
      page: page,
      per_page: perPage,
      total_pages: totalPages,
    });
    return response;
  }

  @RestRoute('/orphans/cleanup', { method: 'POST', capability: 'manage_options' })
  cleanupOrphans(_request: any): any {
    if (!classExists('WooCommerce')) {
      return new WP_Error('woocommerce_required', 'WooCommerce is not active.', { status: 503 });
    }

    // Global kill switch
    const enabled: any = applyFilters('headless_media_cleanup_enabled', true);
    if (!enabled) {
      return restEnsureResponse({ deleted: 0, skipped: 0, errors: 0 });
    }

    const maxItems: number = 500;

    const sql: string = wpdb.prepare(
      `SELECT p.ID
       FROM ${wpdb.posts} p
       WHERE p.post_type = 'attachment'
         AND p.post_mime_type LIKE %s
         AND p.ID NOT IN (
           SELECT DISTINCT CAST(pm.meta_value AS UNSIGNED)
           FROM ${wpdb.postmeta} pm
           WHERE pm.meta_key = '_thumbnail_id'
             AND pm.meta_value != ''
             AND pm.meta_value != '0'
         )
         AND NOT EXISTS (
           SELECT 1 FROM ${wpdb.postmeta} pm2
           WHERE pm2.meta_key = '_product_image_gallery'
             AND FIND_IN_SET(p.ID, pm2.meta_value) > 0
         )
         AND p.ID NOT IN (
           SELECT DISTINCT CAST(tm.meta_value AS UNSIGNED)
           FROM ${wpdb.termmeta} tm
           WHERE tm.meta_key = 'thumbnail_id'
             AND tm.meta_value != ''
             AND tm.meta_value != '0'
         )
       ORDER BY p.ID DESC
       LIMIT %d`,
      'image/%',
      maxItems,
    );

    const rows: any[] = wpdb.getResults(sql, 'ARRAY_A');

    let deleted: number = 0;
    let skipped: number = 0;
    let errors: number = 0;

    for (const row of rows) {
      const attachmentId: number = intval(row.ID);

      // Verify attachment still exists (race condition guard)
      const post: any = getPost(attachmentId, 'ARRAY_A');
      if (!post) {
        continue;
      }

      // Apply per-attachment filter
      const shouldDelete: any = applyFilters(
        'headless_media_cleanup_should_delete',
        true,
        attachmentId,
      );
      if (!shouldDelete) {
        skipped = skipped + 1;
        continue;
      }

      // Re-check references before deleting (TOCTOU guard — image may have been
      // assigned to a product between the orphan query and this iteration)
      if (this.isAttachmentReferenced(attachmentId)) {
        skipped = skipped + 1;
        continue;
      }

      const result: any = wpDeleteAttachment(attachmentId, true);
      if (result) {
        deleted = deleted + 1;
      } else {
        errors = errors + 1;
      }
    }

    return restEnsureResponse({
      deleted: deleted,
      skipped: skipped,
      errors: errors,
    });
  }

  isAttachmentReferenced(attachmentId: number): boolean {
    const idStr: string = strval(attachmentId);

    const featuredCount: string | null = wpdb.getVar(
      wpdb.prepare(
        `SELECT COUNT(*) FROM ${wpdb.postmeta} WHERE meta_key = '_thumbnail_id' AND meta_value = %s`,
        idStr,
      ),
    );
    if (intval(featuredCount) > 0) {
      return true;
    }

    const galleryCount: string | null = wpdb.getVar(
      wpdb.prepare(
        `SELECT COUNT(*) FROM ${wpdb.postmeta} WHERE meta_key = '_product_image_gallery' AND FIND_IN_SET(%s, meta_value) > 0`,
        idStr,
      ),
    );
    if (intval(galleryCount) > 0) {
      return true;
    }

    const termCount: string | null = wpdb.getVar(
      wpdb.prepare(
        `SELECT COUNT(*) FROM ${wpdb.termmeta} WHERE meta_key = 'thumbnail_id' AND meta_value = %s`,
        idStr,
      ),
    );
    if (intval(termCount) > 0) {
      return true;
    }

    return false;
  }
}
