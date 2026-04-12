import fs from 'node:fs';
import path from 'node:path';
import { request as playwrightRequest } from '@playwright/test';
import { createOrder, deleteOrder, updateOrderStatus } from '../../fixtures/woocommerce';
import { expect, test } from '../../fixtures/wordpress';

const STORAGE_STATE = path.resolve(__dirname, '../../artifacts/storage-states/admin.json');

const SLUG = 'headless-orders';
const BASE = `http://localhost:8889/wp-json/${SLUG}/v1`;

test.describe('Headless Orders — List Orders', () => {
  let productId: number;
  let orderId1: number;
  let orderId2: number;
  let orderId3: number;
  let otherUserId: number;

  test.beforeAll(async ({ wpCli }) => {
    // Get test product (created by global-setup.ts)
    const ids = wpCli('post list --post_type=product --post_status=publish --format=ids');
    productId = parseInt(ids.split(' ')[0], 10);
    expect(productId).toBeGreaterThan(0);

    // Clean up any existing orders for admin (customer_id=1)
    const existing = wpCli('wc shop_order list --customer=1 --format=ids --user=admin');
    if (existing.trim()) {
      for (const id of existing.trim().split(' ').filter(Boolean)) {
        deleteOrder(parseInt(id, 10));
      }
    }

    // Create a second user for isolation test
    try {
      wpCli('user create orderother orderother@test.com --role=customer --user_pass=TestPass123!');
    } catch {
      // May already exist
    }
    otherUserId = parseInt(wpCli('user get orderother --field=ID'), 10);

    // Create 2 orders for admin
    orderId1 = createOrder({ productId, customerId: 1 });
    updateOrderStatus(orderId1, 'processing');

    orderId2 = createOrder({ productId, customerId: 1 });
    updateOrderStatus(orderId2, 'completed');

    // Create 1 order for other user (should never appear in admin's results)
    orderId3 = createOrder({ productId, customerId: otherUserId });
    updateOrderStatus(orderId3, 'processing');
  });

  test('GET /orders returns orders for authenticated user', async ({ restApi }) => {
    const { status, data } = await restApi.get(`${SLUG}/v1/orders`);
    expect(status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(2);
  });

  test('orders contain expected fields', async ({ restApi }) => {
    const { data } = await restApi.get(`${SLUG}/v1/orders`);
    const order = data[0];

    expect(order.id).toBeDefined();
    expect(order.order_number).toBeDefined();
    expect(order.status).toBeDefined();
    expect(order.created_at).toBeDefined();
    expect(order.updated_at).toBeDefined();
    expect(order.total).toBeDefined();
    expect(order.shipping_total).toBeDefined();
    expect(order.currency).toBe('USD');
    expect(order.payment_method).toBeDefined();
    expect(order.customer_note).toBeDefined();

    // Billing address
    expect(order.billing).toBeDefined();
    expect(order.billing.first_name).toBeDefined();
    expect(order.billing.email).toBeDefined();

    // Shipping address
    expect(order.shipping).toBeDefined();
    expect(order.shipping.first_name).toBeDefined();

    // Line items
    expect(Array.isArray(order.items)).toBe(true);
    expect(order.items.length).toBeGreaterThan(0);
    const item = order.items[0];
    expect(item.product_id).toBe(productId);
    expect(item.name).toBeDefined();
    expect(item.quantity).toBe(1);
    expect(item.total).toBeDefined();
  });

  test('orders are sorted by date descending', async ({ restApi }) => {
    const { data } = await restApi.get(`${SLUG}/v1/orders`);
    expect(data[0].id).toBe(orderId2);
    expect(data[1].id).toBe(orderId1);
  });

  test('does not return other customers orders', async ({ restApi }) => {
    const { data } = await restApi.get(`${SLUG}/v1/orders`);
    const ids = data.map((o: any) => o.id);
    expect(ids).not.toContain(orderId3);
  });

  test('response includes pagination headers', async () => {
    const state = JSON.parse(fs.readFileSync(STORAGE_STATE, 'utf-8'));
    const ctx = await playwrightRequest.newContext({
      storageState: STORAGE_STATE,
      extraHTTPHeaders: { 'X-WP-Nonce': state.nonce },
    });
    const res = await ctx.get(`${BASE}/orders`);
    expect(res.status()).toBe(200);
    expect(res.headers()['x-wp-total']).toBe('2');
    expect(res.headers()['x-wp-totalpages']).toBe('1');
    await ctx.dispose();
  });

  test('per_page limits results', async () => {
    const state = JSON.parse(fs.readFileSync(STORAGE_STATE, 'utf-8'));
    const ctx = await playwrightRequest.newContext({
      storageState: STORAGE_STATE,
      extraHTTPHeaders: { 'X-WP-Nonce': state.nonce },
    });
    const res = await ctx.get(`${BASE}/orders?per_page=1&page=1`);
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.length).toBe(1);
    expect(res.headers()['x-wp-total']).toBe('2');
    expect(res.headers()['x-wp-totalpages']).toBe('2');
    await ctx.dispose();
  });

  test('page=2 returns second page', async ({ restApi }) => {
    const { status, data } = await restApi.get(`${SLUG}/v1/orders?per_page=1&page=2`);
    expect(status).toBe(200);
    expect(data.length).toBe(1);
    expect(data[0].id).toBe(orderId1);
  });

  test('status filter returns only matching orders', async ({ restApi }) => {
    const { status, data } = await restApi.get(`${SLUG}/v1/orders?status=completed`);
    expect(status).toBe(200);
    expect(data.length).toBe(1);
    expect(data[0].status).toBe('completed');
    expect(data[0].id).toBe(orderId2);
  });

  test('status filter with no matches returns empty array', async ({ restApi }) => {
    const { status, data } = await restApi.get(`${SLUG}/v1/orders?status=refunded`);
    expect(status).toBe(200);
    expect(data.length).toBe(0);
  });

  test('invalid status returns 400', async ({ restApi }) => {
    const { status, data } = await restApi.get(`${SLUG}/v1/orders?status=bogus`);
    expect(status).toBe(400);
    expect(data.code).toBe('invalid_status');
  });

  test('unauthenticated request returns 401', async () => {
    const ctx = await playwrightRequest.newContext();
    const res = await ctx.get(`${BASE}/orders`);
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.code).toBe('rest_forbidden');
    await ctx.dispose();
  });
});
