/**
 * FuzzyFind Indexer — Product indexing for the search index table.
 *
 * Hooks into WooCommerce product save/delete to keep the FULLTEXT search index
 * in sync. Also provides batch reindexing via WP-Cron.
 */

import { Action } from 'wpts';

class FfIndexer {

  // ── Real-time Indexing ──────────────────────────────────────────────

  @Action('woocommerce_new_product', { priority: 20 })
  onProductCreate(productId: number): void {
    if (!classExists('WooCommerce')) {
      return;
    }
    this.indexProduct(productId);
  }

  @Action('woocommerce_update_product', { priority: 20 })
  onProductUpdate(productId: number): void {
    if (!classExists('WooCommerce')) {
      return;
    }
    this.indexProduct(productId);
  }

  @Action('woocommerce_new_product_variation')
  onVariationCreate(variationId: number): void {
    const parentId: number | false = wpGetPostParentId(variationId);
    if (parentId) {
      this.indexProduct(parentId);
    }
  }

  @Action('woocommerce_update_product_variation')
  onVariationUpdate(variationId: number): void {
    const parentId: number | false = wpGetPostParentId(variationId);
    if (parentId) {
      this.indexProduct(parentId);
    }
  }

  @Action('before_delete_post')
  onProductDelete(postId: number): void {
    if (getPostType(postId) !== 'product') {
      return;
    }
    const tableName: string = getOption('headless_fuzzyfind_index_table', '');
    if (!tableName) {
      return;
    }
    wpdb.delete(tableName, { product_id: postId });
  }

  @Action('wp_trash_post')
  onProductTrash(postId: number): void {
    if (getPostType(postId) !== 'product') {
      return;
    }
    const tableName: string = getOption('headless_fuzzyfind_index_table', '');
    if (!tableName) {
      return;
    }
    wpdb.delete(tableName, { product_id: postId });
  }

  @Action('untrashed_post')
  onProductUntrash(postId: number): void {
    if (getPostType(postId) !== 'product') {
      return;
    }
    this.indexProduct(postId);
  }

  // ── Batch Reindex (called by WP-Cron or admin) ─────────────────────

  @Action('headless_fuzzyfind_do_reindex')
  doReindex(): void {
    if (!classExists('WooCommerce')) {
      return;
    }

    const tableName: string = getOption('headless_fuzzyfind_index_table', '');
    if (!tableName) {
      return;
    }

    let page: number = 1;
    const batchSize: number = 50;
    let hasMore: boolean = true;

    while (hasMore) {
      const products: any[] = wcGetProducts({
        status: 'publish',
        limit: batchSize,
        page: page,
        return: 'ids',
      });

      if (products.length === 0) {
        hasMore = false;
      } else {
        for (const productId of products) {
          this.indexProduct(productId);
        }
        page = page + 1;

        if (products.length < batchSize) {
          hasMore = false;
        }
      }
    }

    // Clean up stale entries for deleted/unpublished products
    wpdb.query(wpdb.prepare(
      "DELETE FROM %i WHERE product_id NOT IN (SELECT ID FROM %i WHERE post_type = 'product' AND post_status = 'publish')",
      tableName, wpdb.posts
    ));

    updateOption('headless_fuzzyfind_last_indexed', time());
    deleteOption('headless_fuzzyfind_reindex_in_progress');
  }

  // ── Core Indexing Logic ─────────────────────────────────────────────

  indexProduct(productId: number): void {
    const tableName: string = getOption('headless_fuzzyfind_index_table', '');
    if (!tableName) {
      return;
    }

    const product: any = wcGetProduct(productId);
    if (!product) {
      return;
    }

    // Skip non-published products
    const status: string = product.get_status();
    if (status !== 'publish') {
      // Remove from index if it was previously indexed
      wpdb.delete(tableName, { product_id: productId });
      return;
    }

    // Skip products excluded from search (hidden = neither, catalog = shop only)
    const visibility: string = product.get_catalog_visibility();
    if (visibility === 'hidden' || visibility === 'catalog') {
      wpdb.delete(tableName, { product_id: productId });
      return;
    }

    // Extract product data
    const title: string = product.get_name() ?? '';
    const sku: string = product.get_sku() ?? '';
    const content: string = wpStripAllTags(product.get_description() ?? '');
    const shortDesc: string = wpStripAllTags(product.get_short_description() ?? '');

    // Extract attributes
    const attributes: any = product.get_attributes();
    let attrValues: string[] = [];
    if (attributes) {
      for (const key in attributes) {
        const attr: any = attributes[key];
        if (!attr) { continue; }
        if (attr.is_taxonomy()) {
          const terms: any[] = wcGetProductTerms(productId, attr.get_name(), { fields: 'names' });
          if (terms && terms.length > 0) {
            attrValues = attrValues.concat(terms);
          }
        } else {
          const opts: any[] = attr.get_options();
          if (opts && opts.length > 0) {
            attrValues = attrValues.concat(opts);
          }
        }
      }
    }
    const attributeStr: string = attrValues.join(' ');

    // Extract categories
    const categoryNames: string[] = wcGetProductTerms(productId, 'product_cat', { fields: 'names' }) ?? [];
    const categoriesStr: string = categoryNames.join(' ');

    // Extract tags
    const tagNames: string[] = wcGetProductTerms(productId, 'product_tag', { fields: 'names' }) ?? [];
    const tagsStr: string = tagNames.join(' ');

    // Extract variation SKUs for variable products
    let variationSkus: string[] = [];
    const productType: string = product.get_type();
    if (productType === 'variable') {
      const childIds: any[] = product.get_children();
      if (childIds && childIds.length > 0) {
        for (const childId of childIds) {
          const variation: any = wcGetProduct(childId);
          if (variation) {
            const varSku: string = variation.get_sku() ?? '';
            if (varSku) {
              variationSkus.push(varSku);
            }
          }
        }
      }
    }
    const variationSkusStr: string = variationSkus.join(' ');

    // Upsert into search index
    const sql: string = wpdb.prepare(
      'INSERT INTO %i (product_id, title, sku, short_desc, content, attributes, categories, tags, variation_skus, indexed_at) VALUES (%d, %s, %s, %s, %s, %s, %s, %s, %s, NOW()) ON DUPLICATE KEY UPDATE title = VALUES(title), sku = VALUES(sku), short_desc = VALUES(short_desc), content = VALUES(content), attributes = VALUES(attributes), categories = VALUES(categories), tags = VALUES(tags), variation_skus = VALUES(variation_skus), indexed_at = NOW()',
      tableName, productId, title, sku, shortDesc, content, attributeStr, categoriesStr, tagsStr, variationSkusStr
    );
    wpdb.query(sql);
  }
}
