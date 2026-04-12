import { request as playwrightRequest } from '@playwright/test';
import { createOrder, updateOrderStatus } from '../../fixtures/woocommerce';
import { expect, test } from '../../fixtures/wordpress';

const SLUG = 'headless-orders';
const BASE = `http://localhost:8889/wp-json/${SLUG}/v1`;

test.describe('Headless Orders — Single Order', () => {
  let productId: number;
  let orderId: number;
  let otherOrderId: number;
  let otherUserId: number;

  test.beforeAll(async ({ wpCli }) => {
    // Get test product (created by global-setup.ts)
    const ids = wpCli('post list --post_type=product --post_status=publish --format=ids');
    productId = parseInt(ids.split(' ')[0], 10);
    expect(productId).toBeGreaterThan(0);

    // Create a second user for isolation test
    try {
      wpCli('user create orderother orderother@test.com --role=customer --user_pass=TestPass123!');
    } catch {
      // May already exist
    }
    otherUserId = parseInt(wpCli('user get orderother --field=ID'), 10);

    // Create order for admin (customer_id=1)
    orderId = createOrder({ productId, customerId: 1 });
    updateOrderStatus(orderId, 'processing');

    // Create order for other user
    otherOrderId = createOrder({ productId, customerId: otherUserId });
    updateOrderStatus(otherOrderId, 'processing');
  });

  test('GET /orders/:id returns single order', async ({ restApi }) => {
    const { status, data } = await restApi.get(`${SLUG}/v1/orders/${orderId}`);
    expect(status).toBe(200);
    expect(data.id).toBe(orderId);
  });

  test('single order contains expected fields', async ({ restApi }) => {
    const { data } = await restApi.get(`${SLUG}/v1/orders/${orderId}`);

    expect(data.id).toBe(orderId);
    expect(data.order_number).toBeDefined();
    expect(data.status).toBe('processing');
    expect(data.created_at).toBeDefined();
    expect(data.updated_at).toBeDefined();
    expect(data.total).toBeDefined();
    expect(data.shipping_total).toBeDefined();
    expect(data.currency).toBe('USD');
    expect(data.payment_method).toBeDefined();
    expect(data.customer_note).toBeDefined();

    expect(data.billing).toBeDefined();
    expect(data.billing.first_name).toBeDefined();

    expect(data.shipping).toBeDefined();
    expect(data.shipping.first_name).toBeDefined();

    expect(Array.isArray(data.items)).toBe(true);
    expect(data.items.length).toBeGreaterThan(0);
    expect(data.items[0].product_id).toBe(productId);
  });

  test('non-existent order returns 404', async ({ restApi }) => {
    const { status, data } = await restApi.get(`${SLUG}/v1/orders/999999`);
    expect(status).toBe(404);
    expect(data.code).toBe('order_not_found');
  });

  test('other customers order returns 404', async ({ restApi }) => {
    const { status, data } = await restApi.get(`${SLUG}/v1/orders/${otherOrderId}`);
    expect(status).toBe(404);
    expect(data.code).toBe('order_not_found');
  });

  test('unauthenticated request returns 401', async () => {
    const ctx = await playwrightRequest.newContext();
    const res = await ctx.get(`${BASE}/orders/${orderId}`);
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.code).toBe('rest_forbidden');
    await ctx.dispose();
  });
});
