import {
  attachmentExists,
  createImageAttachment,
  createProductCategory,
  deleteProduct,
  deleteProductCategory,
  setProductFeaturedImage,
  setProductGallery,
  setTermThumbnail,
  touchProduct,
} from '../../fixtures/media';
import { expect, test, wpCli } from '../../fixtures/wordpress';

const SLUG = 'headless-media-cleanup';
const BASE = `http://localhost:8889/wp-json/${SLUG}/v1`;

test.describe('Headless Media Cleanup — Product Image Cleanup', () => {
  let testProductId: number;

  test.beforeAll(({ wpCli }) => {
    // Create a dedicated test product (not the global-setup ones)
    const output = wpCli(
      'wc product create --name="HMC Test Product" --regular_price=10.00 --user=admin --porcelain',
    );
    testProductId = Number.parseInt(output.split('\n').filter(Boolean).at(-1) ?? '', 10);
  });

  test.afterAll(({ wpCli }) => {
    try {
      wpCli(`post delete ${testProductId} --force`);
    } catch {
      // Already deleted in a test
    }
  });

  test('removes orphaned image when product featured image changes', () => {
    const imageA = createImageAttachment('HMC Featured A');
    const imageB = createImageAttachment('HMC Featured B');

    // Set initial featured image and trigger save to record baseline
    setProductFeaturedImage(testProductId, imageA);
    touchProduct(testProductId);

    // Change featured image to B
    setProductFeaturedImage(testProductId, imageB);
    touchProduct(testProductId);

    // Image A should be deleted (orphaned), Image B should remain
    expect(attachmentExists(imageA)).toBe(false);
    expect(attachmentExists(imageB)).toBe(true);

    // Cleanup
    setProductFeaturedImage(testProductId, 0);
    touchProduct(testProductId);
  });

  test('removes orphaned gallery image when removed from product', () => {
    const img1 = createImageAttachment('HMC Gallery 1');
    const img2 = createImageAttachment('HMC Gallery 2');
    const img3 = createImageAttachment('HMC Gallery 3');

    // Set gallery with all three and trigger save
    setProductGallery(testProductId, [img1, img2, img3]);
    touchProduct(testProductId);

    // Remove img2 from gallery
    setProductGallery(testProductId, [img1, img3]);
    touchProduct(testProductId);

    // img2 should be deleted, others remain
    expect(attachmentExists(img1)).toBe(true);
    expect(attachmentExists(img2)).toBe(false);
    expect(attachmentExists(img3)).toBe(true);

    // Cleanup
    setProductGallery(testProductId, []);
    touchProduct(testProductId);
  });

  test('preserves image shared between two products', () => {
    const sharedImage = createImageAttachment('HMC Shared Image');

    // Product A uses the shared image
    setProductFeaturedImage(testProductId, sharedImage);
    touchProduct(testProductId);

    // Create Product B with the same image
    const productBOutput = wpCli(
      'wc product create --name="HMC Product B" --regular_price=5.00 --user=admin --porcelain',
    );
    const productBId = Number.parseInt(productBOutput.split('\n').filter(Boolean).at(-1) ?? '', 10);
    setProductFeaturedImage(productBId, sharedImage);
    touchProduct(productBId);

    // Remove from Product A
    setProductFeaturedImage(testProductId, 0);
    touchProduct(testProductId);

    // Shared image should NOT be deleted — still used by Product B
    expect(attachmentExists(sharedImage)).toBe(true);

    // Remove from Product B too
    setProductFeaturedImage(productBId, 0);
    touchProduct(productBId);

    // Now it should be deleted
    expect(attachmentExists(sharedImage)).toBe(false);

    // Cleanup
    wpCli(`post delete ${productBId} --force`);
  });

  test('cleans up images when product is permanently deleted', ({ wpCli }) => {
    const img = createImageAttachment('HMC Delete Product Image');

    // Create a temporary product with an image
    const output = wpCli(
      'wc product create --name="HMC Temp Product" --regular_price=1.00 --user=admin --porcelain',
    );
    const tempProductId = Number.parseInt(output.split('\n').filter(Boolean).at(-1) ?? '', 10);
    setProductFeaturedImage(tempProductId, img);
    touchProduct(tempProductId);

    // Permanently delete the product
    deleteProduct(tempProductId);

    // Image should be deleted (orphaned after product deletion)
    expect(attachmentExists(img)).toBe(false);
  });
});

test.describe('Headless Media Cleanup — Category Thumbnail Cleanup', () => {
  test('removes orphaned thumbnail when category image changes', () => {
    const catId = createProductCategory('HMC Test Category');
    const thumbA = createImageAttachment('HMC Cat Thumb A');
    const thumbB = createImageAttachment('HMC Cat Thumb B');

    // Set initial thumbnail
    setTermThumbnail(catId, thumbA);

    // Change to thumb B
    setTermThumbnail(catId, thumbB);

    // Thumb A should be deleted
    expect(attachmentExists(thumbA)).toBe(false);
    expect(attachmentExists(thumbB)).toBe(true);

    // Cleanup
    deleteProductCategory(catId);
  });

  test('cleans up thumbnail when category is deleted', () => {
    const catId = createProductCategory('HMC Delete Cat');
    const thumb = createImageAttachment('HMC Delete Cat Thumb');

    setTermThumbnail(catId, thumb);

    // Delete the category
    deleteProductCategory(catId);

    // Thumbnail should be deleted
    expect(attachmentExists(thumb)).toBe(false);
  });
});

test.describe('Headless Media Cleanup — REST API', () => {
  test('GET /orphans returns orphaned images', async ({ restApi }) => {
    // Create an image that's not attached to any product or term
    const orphanId = createImageAttachment('HMC Orphan Test');

    const { status, data } = await restApi.get(`${SLUG}/v1/orphans`);
    expect(status).toBe(200);
    expect(data.total).toBeGreaterThanOrEqual(1);

    const ids = data.orphans.map((o: any) => o.id);
    expect(ids).toContain(orphanId);

    // Cleanup
    wpCli(`post delete ${orphanId} --force`);
  });

  test('POST /orphans/cleanup deletes orphaned images', async ({ restApi }) => {
    const orphan1 = createImageAttachment('HMC Cleanup 1');
    const orphan2 = createImageAttachment('HMC Cleanup 2');

    const { status, data } = await restApi.post(`${SLUG}/v1/orphans/cleanup`);
    expect(status).toBe(200);
    expect(data.deleted).toBeGreaterThanOrEqual(2);
    expect(data.errors).toBe(0);

    // Orphans should be gone
    expect(attachmentExists(orphan1)).toBe(false);
    expect(attachmentExists(orphan2)).toBe(false);
  });

  test('Unauthenticated requests return 401', async () => {
    const { request } = await import('@playwright/test');
    const ctx = await request.newContext();

    const getRes = await ctx.get(`${BASE}/orphans`);
    expect(getRes.status()).toBe(401);

    const postRes = await ctx.post(`${BASE}/orphans/cleanup`);
    expect(postRes.status()).toBe(401);

    await ctx.dispose();
  });
});
