import { wpCli } from './wordpress';

function parseId(output: string): number {
  const lastLine = output.split('\n').filter(Boolean).at(-1) ?? '';
  const id = Number.parseInt(lastLine, 10);
  if (Number.isNaN(id)) {
    throw new Error(`WP-CLI did not return a valid ID: ${output}`);
  }
  return id;
}

/**
 * Create a fake image attachment in the Media Library.
 * No actual file is created on disk — just a post of type 'attachment'
 * with image/jpeg mime type. Sufficient for testing cleanup logic.
 */
export function createImageAttachment(title: string): number {
  const output = wpCli(
    `eval "echo wp_insert_attachment(array('post_title'=>'${title}','post_mime_type'=>'image/jpeg','post_status'=>'inherit'));"`,
  );
  return parseId(output);
}

/** Check if an attachment post exists. */
export function attachmentExists(attachmentId: number): boolean {
  const output = wpCli(
    `eval "\\$p = get_post(${attachmentId}); echo \\$p && \\$p->post_type === 'attachment' ? '1' : '0';"`,
  );
  return output.trim() === '1';
}

/** Set a product's featured image. */
export function setProductFeaturedImage(productId: number, attachmentId: number): void {
  wpCli(`post meta update ${productId} _thumbnail_id ${attachmentId}`);
}

/** Set a product's gallery images (comma-separated IDs). */
export function setProductGallery(productId: number, attachmentIds: number[]): void {
  const value = attachmentIds.join(',');
  wpCli(`post meta update ${productId} _product_image_gallery "${value}"`);
}

/** Get a product's tracked images meta. */
export function getTrackedImages(productId: number): string {
  return wpCli(`post meta get ${productId} _hmc_tracked_images`);
}

/** Set a term's thumbnail. */
export function setTermThumbnail(termId: number, attachmentId: number): void {
  wpCli(`term meta update ${termId} thumbnail_id ${attachmentId}`);
}

/** Trigger the woocommerce_update_product hook by touching the product. */
export function touchProduct(productId: number): void {
  wpCli(
    `wc product update ${productId} --name="$(wp post get ${productId} --field=post_title)" --user=admin`,
  );
}

/** Delete a product permanently. */
export function deleteProduct(productId: number): void {
  wpCli(`post delete ${productId} --force`);
}

/** Create a product category and return its term ID. */
export function createProductCategory(name: string): number {
  const output = wpCli(`wc product_cat create --name="${name}" --user=admin --porcelain`);
  return parseId(output);
}

/** Delete a product category. */
export function deleteProductCategory(termId: number): void {
  wpCli(`term delete product_cat ${termId}`);
}
