import {
  createOrder,
  deleteOrder,
  getOrderMeta,
  updateOrderStatus,
} from '../../fixtures/woocommerce';
import { expect, test } from '../../fixtures/wordpress';

const SLUG = 'headless-meta-pixel';

test.describe('Headless Meta Pixel — Purchase Tracking', () => {
  let productId: number;

  test.beforeAll(async ({ restApi, wpCli }) => {
    const output = wpCli('post list --post_type=product --field=ID');
    productId = Number.parseInt(output.split('\n')[0], 10);

    // Configure with dummy CAPI credentials
    await restApi.updateSettings(SLUG, {
      pixel_id: '123456789012345',
      access_token: 'invalid_test_token',
      enable_capi: true,
      enable_purchase: true,
    });
  });

  test.afterAll(async ({ restApi }) => {
    await restApi.updateSettings(SLUG, {
      pixel_id: '',
      access_token: '',
      enable_capi: true,
      enable_purchase: true,
    });
  });

  test('purchase tracking hook fires on order completion', async ({ restApi }) => {
    const orderId = createOrder({ productId });

    try {
      updateOrderStatus(orderId, 'completed');

      // Verify the hook fired: either the dedup flag was set (CAPI call attempted)
      // or an error was logged in diagnostics (CAPI call failed with dummy credentials).
      let hasDedup = false;
      try {
        const meta = getOrderMeta(orderId, '_headless_meta_pixel_capi_sent');
        if (meta) hasDedup = true;
      } catch {
        // Post meta doesn't exist
      }

      const { data: diag } = await restApi.getDiagnostics(SLUG);
      const hasError = !!diag.last_error;

      expect(hasDedup || hasError).toBe(true);
    } finally {
      deleteOrder(orderId);
    }
  });
});
