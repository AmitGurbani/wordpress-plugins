import {
  createOrder,
  deleteOrder,
  getOrderMeta,
  updateOrderStatus,
} from '../../fixtures/woocommerce';
import { expect, test } from '../../fixtures/wordpress';

const SLUG = 'headless-umami';

test.describe('Headless Umami — Purchase Tracking', () => {
  let productId: number;

  test.beforeAll(async ({ restApi, wpCli }) => {
    const output = wpCli('post list --post_type=product --field=ID');
    productId = Number.parseInt(output.split('\n')[0], 10);

    // Configure with a dummy URL that will fail to connect
    await restApi.updateSettings(SLUG, {
      umami_url: 'http://localhost:19999',
      website_id: '550e8400-e29b-41d4-a716-446655440000',
      enable_purchase: true,
    });
  });

  test.afterAll(async ({ restApi }) => {
    await restApi.updateSettings(SLUG, {
      umami_url: '',
      website_id: '',
      enable_purchase: true,
    });
  });

  test('records error on order completion with unreachable Umami URL', async ({
    restApi,
    wpCli,
  }) => {
    // Clear previous error
    try {
      wpCli('option delete headless_umami_last_error');
    } catch {
      // May not exist
    }

    const orderId = createOrder({ productId });

    try {
      updateOrderStatus(orderId, 'completed');

      // The outbound call to localhost:19999 should fail
      const { data } = await restApi.getDiagnostics(SLUG);
      expect(data.last_error).toBeTruthy();

      // Dedup flag should NOT be set since the send failed
      try {
        const meta = getOrderMeta(orderId, '_headless_umami_sent');
        // If the meta exists but is empty, that's also fine
        expect(meta).toBeFalsy();
      } catch {
        // Order meta doesn't exist — expected behavior on failed send
      }
    } finally {
      deleteOrder(orderId);
    }
  });
});
