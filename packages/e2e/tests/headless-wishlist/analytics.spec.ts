import { test, expect } from '../../fixtures/wordpress';
import { request as playwrightRequest } from '@playwright/test';

const SLUG = 'headless-wishlist';
const BASE = `http://localhost:8889/wp-json/${SLUG}/v1`;

test.describe('Headless Wishlist — Analytics', () => {
  let productIds: number[] = [];

  test.beforeAll(async ({ wpCli, restApi }) => {
    // Get test product IDs
    const ids = wpCli('post list --post_type=product --post_status=publish --format=ids');
    productIds = ids
      .split(' ')
      .map((id) => parseInt(id, 10))
      .filter((id) => !isNaN(id));

    // Clean and seed: add both products to admin user's wishlist
    try {
      wpCli('user meta delete 1 _headless_wishlist');
    } catch {
      // ignore
    }
    await restApi.post(`${SLUG}/v1/items`, { product_id: productIds[0] });
    await restApi.post(`${SLUG}/v1/items`, { product_id: productIds[1] });
  });

  test('GET /analytics/popular returns popular products', async ({ restApi }) => {
    const { status, data } = await restApi.get(`${SLUG}/v1/analytics/popular`);
    expect(status).toBe(200);
    expect(data.popular).toBeDefined();
    expect(data.popular.length).toBeGreaterThanOrEqual(1);
    for (const item of data.popular) {
      expect(item.product_id).toBeDefined();
      expect(item.name).toBeDefined();
      expect(item.slug).toBeDefined();
      expect(item.count).toBeGreaterThanOrEqual(1);
    }
  });

  test('GET /analytics/popular returns aggregate stats', async ({ restApi }) => {
    const { data } = await restApi.get(`${SLUG}/v1/analytics/popular`);
    expect(data.total_users).toBeGreaterThanOrEqual(1);
    expect(data.total_items).toBeGreaterThanOrEqual(2);
  });

  test('Unauthenticated requests return 401', async () => {
    const ctx = await playwrightRequest.newContext();
    const res = await ctx.get(`${BASE}/analytics/popular`);
    expect(res.status()).toBe(401);
    await ctx.dispose();
  });

  test.afterAll(async ({ wpCli }) => {
    // Clean up
    try {
      wpCli('user meta delete 1 _headless_wishlist');
    } catch {
      // ignore
    }
  });
});
