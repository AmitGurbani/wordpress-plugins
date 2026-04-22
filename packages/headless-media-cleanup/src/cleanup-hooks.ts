import { Action } from '@amitgurbani/wpts';

class CleanupHooks {
  // ── Product & Variation: Creation (baseline) ───────────────────────

  @Action('woocommerce_new_product')
  onProductCreate(productId: number): void {
    if (!classExists('WooCommerce')) {
      return;
    }
    const images: number[] = this.getProductImageIds(productId);
    updatePostMeta(productId, '_headless_media_cleanup_tracked_images', jsonEncode(images));
  }

  @Action('woocommerce_new_product_variation')
  onVariationCreate(variationId: number): void {
    const featuredId: number = intval(getPostMeta(variationId, '_thumbnail_id', true));
    const images: number[] = featuredId > 0 ? [featuredId] : [];
    updatePostMeta(variationId, '_headless_media_cleanup_tracked_images', jsonEncode(images));
  }

  // ── Product & Variation: Update (diff & clean) ─────────────────────

  @Action('woocommerce_update_product', { priority: 99 })
  onProductUpdate(productId: number): void {
    if (!classExists('WooCommerce')) {
      return;
    }
    this.diffAndCleanProductImages(productId);
  }

  @Action('woocommerce_update_product_variation', { priority: 99 })
  onVariationUpdate(variationId: number): void {
    this.diffAndCleanProductImages(variationId);
  }

  // ── Product & Variation: Direct Meta Changes ────────────────────────

  @Action('updated_post_meta', { acceptedArgs: 4 })
  onPostMetaUpdated(_metaId: number, postId: number, metaKey: string, _metaValue: any): void {
    if (metaKey !== '_thumbnail_id' && metaKey !== '_product_image_gallery') {
      return;
    }
    const postType: string = getPostType(postId);
    if (postType !== 'product' && postType !== 'product_variation') {
      return;
    }
    this.diffAndCleanProductImages(postId);
  }

  @Action('delete_post_meta', { acceptedArgs: 4 })
  onPostMetaDelete(_metaIds: any, postId: number, metaKey: string, _metaValue: any): void {
    if (metaKey !== '_thumbnail_id' && metaKey !== '_product_image_gallery') {
      return;
    }
    const postType: string = getPostType(postId);
    if (postType !== 'product' && postType !== 'product_variation') {
      return;
    }
    this.diffAndCleanProductImages(postId);
  }

  // ── Product & Variation: Deletion ──────────────────────────────────

  @Action('before_delete_post', { acceptedArgs: 2 })
  onBeforeDeletePost(postId: number, _post: any): void {
    const postType: string = getPostType(postId);
    if (postType !== 'product' && postType !== 'product_variation') {
      return;
    }
    const images: number[] = this.getProductImageIds(postId);
    if (images.length > 0) {
      setTransient(`headless_media_cleanup_deleting_${strval(postId)}`, jsonEncode(images), 60);
    }
  }

  @Action('deleted_post', { acceptedArgs: 2 })
  onDeletedPost(postId: number, _post: any): void {
    const raw: any = getTransient(`headless_media_cleanup_deleting_${strval(postId)}`);
    if (!raw) {
      return;
    }
    deleteTransient(`headless_media_cleanup_deleting_${strval(postId)}`);

    const images: any[] = jsonDecode(raw, true) ?? [];
    for (const attachmentId of images) {
      this.maybeDeleteAttachment(intval(attachmentId));
    }
  }

  // ── Term Thumbnail: First Set (baseline) ───────────────────────────

  @Action('added_term_meta', { acceptedArgs: 4 })
  onTermMetaAdded(_metaId: number, objectId: number, metaKey: string, metaValue: any): void {
    if (metaKey !== 'thumbnail_id') {
      return;
    }
    if (!this.isTrackedTaxonomy(objectId)) {
      return;
    }
    const thumbnailId: number = intval(strval(metaValue));
    if (thumbnailId > 0) {
      updateTermMeta(objectId, '_headless_media_cleanup_tracked_image', strval(thumbnailId));
    }
  }

  // ── Term Thumbnail: Update (diff & clean) ──────────────────────────

  @Action('updated_term_meta', { acceptedArgs: 4 })
  onTermMetaUpdated(_metaId: number, objectId: number, metaKey: string, metaValue: any): void {
    if (metaKey !== 'thumbnail_id') {
      return;
    }
    if (!this.isTrackedTaxonomy(objectId)) {
      return;
    }
    const previousId: number = intval(
      getTermMeta(objectId, '_headless_media_cleanup_tracked_image', true),
    );
    const currentId: number = intval(strval(metaValue));

    updateTermMeta(objectId, '_headless_media_cleanup_tracked_image', strval(currentId));

    if (previousId > 0 && previousId !== currentId) {
      this.maybeDeleteAttachment(previousId);
    }
  }

  // ── Term Thumbnail: Removal ────────────────────────────────────────

  @Action('delete_term_meta', { acceptedArgs: 4 })
  onTermMetaDelete(_metaIds: any, objectId: number, metaKey: string, _metaValue: any): void {
    if (metaKey !== 'thumbnail_id') {
      return;
    }
    if (!this.isTrackedTaxonomy(objectId)) {
      return;
    }
    const previousId: number = intval(
      getTermMeta(objectId, '_headless_media_cleanup_tracked_image', true),
    );
    deleteTermMeta(objectId, '_headless_media_cleanup_tracked_image');

    if (previousId > 0) {
      this.maybeDeleteAttachment(previousId);
    }
  }

  // ── Term: Deletion ─────────────────────────────────────────────────

  @Action('pre_delete_term', { acceptedArgs: 2 })
  onPreDeleteTerm(termId: number, taxonomy: string): void {
    const targetTaxonomies: any = applyFilters('headless_media_cleanup_taxonomies', [
      'product_cat',
      'product_tag',
      'product_brand',
    ]);
    if (!targetTaxonomies.includes(taxonomy)) {
      return;
    }
    const thumbnailId: string = getTermMeta(termId, 'thumbnail_id', true);
    if (intval(thumbnailId) > 0) {
      setTransient(`headless_media_cleanup_term_deleting_${strval(termId)}`, thumbnailId, 60);
    }
  }

  @Action('delete_term', { acceptedArgs: 5 })
  onDeleteTerm(
    termId: number,
    _ttId: number,
    _taxonomy: string,
    _deletedTerm: any,
    _objectIds: any,
  ): void {
    const raw: any = getTransient(`headless_media_cleanup_term_deleting_${strval(termId)}`);
    if (!raw) {
      return;
    }
    deleteTransient(`headless_media_cleanup_term_deleting_${strval(termId)}`);

    const thumbnailId: number = intval(strval(raw));
    if (thumbnailId > 0) {
      this.maybeDeleteAttachment(thumbnailId);
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────

  getProductImageIds(postId: number): number[] {
    const images: number[] = [];

    const featuredId: number = intval(getPostMeta(postId, '_thumbnail_id', true));
    if (featuredId > 0) {
      images.push(featuredId);
    }

    const galleryStr: string = getPostMeta(postId, '_product_image_gallery', true);
    if (galleryStr) {
      const parts: string[] = galleryStr.split(',');
      for (const part of parts) {
        const id: number = intval(part.trim());
        if (id > 0 && !images.includes(id)) {
          images.push(id);
        }
      }
    }

    return images;
  }

  diffAndCleanProductImages(postId: number): void {
    const currentImages: number[] = this.getProductImageIds(postId);

    const previousRaw: string = getPostMeta(postId, '_headless_media_cleanup_tracked_images', true);
    const previousImages: any[] = previousRaw ? (jsonDecode(previousRaw, true) ?? []) : [];

    updatePostMeta(postId, '_headless_media_cleanup_tracked_images', jsonEncode(currentImages));

    for (const oldId of previousImages) {
      const attachmentId: number = intval(oldId);
      if (attachmentId > 0 && !currentImages.includes(attachmentId)) {
        this.maybeDeleteAttachment(attachmentId);
      }
    }
  }

  isTrackedTaxonomy(termId: number): boolean {
    const taxonomy: string | null = wpdb.getVar(
      wpdb.prepare(`SELECT taxonomy FROM ${wpdb.term_taxonomy} WHERE term_id = %d`, termId),
    );
    if (!taxonomy) {
      return false;
    }
    const targetTaxonomies: any = applyFilters('headless_media_cleanup_taxonomies', [
      'product_cat',
      'product_tag',
      'product_brand',
    ]);
    return targetTaxonomies.includes(taxonomy);
  }

  isAttachmentReferenced(attachmentId: number): boolean {
    const idStr: string = strval(attachmentId);

    // Check featured images (products & variations)
    const featuredCount: string | null = wpdb.getVar(
      wpdb.prepare(
        `SELECT COUNT(*) FROM ${wpdb.postmeta} WHERE meta_key = '_thumbnail_id' AND meta_value = %s`,
        idStr,
      ),
    );
    if (intval(featuredCount) > 0) {
      return true;
    }

    // Check gallery images (comma-separated in _product_image_gallery)
    const galleryCount: string | null = wpdb.getVar(
      wpdb.prepare(
        `SELECT COUNT(*) FROM ${wpdb.postmeta} WHERE meta_key = '_product_image_gallery' AND FIND_IN_SET(%s, meta_value) > 0`,
        idStr,
      ),
    );
    if (intval(galleryCount) > 0) {
      return true;
    }

    // Check taxonomy term thumbnails
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

  maybeDeleteAttachment(attachmentId: number): void {
    // Global kill switch
    const enabled: any = applyFilters('headless_media_cleanup_enabled', true);
    if (!enabled) {
      return;
    }

    // Verify attachment exists and is an image
    const post: any = getPost(attachmentId, 'ARRAY_A');
    if (!post) {
      return;
    }
    if (post.post_type !== 'attachment') {
      return;
    }
    const mimeType: string = strval(post.post_mime_type);
    if (!mimeType.startsWith('image/')) {
      this.log(`HMC: skipped #${strval(attachmentId)} — not an image (${mimeType})`);
      return;
    }

    // Per-attachment filter
    const shouldDelete: any = applyFilters(
      'headless_media_cleanup_should_delete',
      true,
      attachmentId,
    );
    if (!shouldDelete) {
      this.log(`HMC: skipped #${strval(attachmentId)} — blocked by should_delete filter`);
      return;
    }

    // Orphan check
    if (this.isAttachmentReferenced(attachmentId)) {
      this.log(`HMC: skipped #${strval(attachmentId)} — still referenced`);
      return;
    }

    // Delete permanently (skip trash, remove physical files)
    const result: any = wpDeleteAttachment(attachmentId, true);
    if (result) {
      this.log(`HMC: deleted attachment #${strval(attachmentId)}`);
    } else {
      this.log(`HMC: failed to delete attachment #${strval(attachmentId)}`);
    }
  }

  log(message: string): void {
    if (defined('WP_DEBUG_LOG') && WP_DEBUG_LOG) {
      errorLog(message);
    }
  }
}
