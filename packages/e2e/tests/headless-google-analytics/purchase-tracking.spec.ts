import { test, expect } from '../../fixtures/wordpress';
import {
  createOrder,
  updateOrderStatus,
  getOrderMeta,
  deleteOrder,
} from '../../fixtures/woocommerce';

const SLUG = 'headless-google-analytics';

test.describe('Headless Google Analytics — Purchase Tracking', () => {
  let productId: number;

  test.beforeAll(async ({ restApi, wpCli }) => {
    // Get the first test product ID
    const output = wpCli('post list --post_type=product --field=ID');
    productId = Number.parseInt(output.split('\n')[0], 10);

    // Configure GA4 with dummy credentials (GA4 MP always returns 2xx)
    await restApi.updateSettings(SLUG, {
      measurement_id: 'G-TEST12345',
      api_secret: 'test_secret',
      enable_purchase: true,
    });
  });

  test.afterAll(async ({ restApi }) => {
    await restApi.updateSettings(SLUG, {
      measurement_id: '',
      api_secret: '',
      enable_purchase: true,
    });
  });

  test('sets _headless_ga_sent order meta on order completion', async () => {
    const orderId = createOrder({ productId });

    try {
      updateOrderStatus(orderId, 'completed');

      // GA4 MP returns 2xx always, so the flag should be set
      const meta = getOrderMeta(orderId, '_headless_ga_sent');
      expect(meta).toBeTruthy();
    } finally {
      deleteOrder(orderId);
    }
  });

  test('prevents duplicate tracking on repeated status changes', async () => {
    const orderId = createOrder({ productId });

    try {
      // First transition — should send
      updateOrderStatus(orderId, 'completed');
      const meta1 = getOrderMeta(orderId, '_headless_ga_sent');
      expect(meta1).toBeTruthy();

      // Change back and complete again — should NOT re-send (dedup flag set)
      updateOrderStatus(orderId, 'processing');
      updateOrderStatus(orderId, 'completed');

      // The dedup flag should still be set from the first send
      const meta2 = getOrderMeta(orderId, '_headless_ga_sent');
      expect(meta2).toBeTruthy();
    } finally {
      deleteOrder(orderId);
    }
  });
});
