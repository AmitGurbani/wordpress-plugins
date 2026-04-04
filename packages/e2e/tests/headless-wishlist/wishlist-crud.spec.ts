import { test, expect } from '../../fixtures/wordpress';
import { request as playwrightRequest } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const STORAGE_STATE = path.resolve(__dirname, '../../artifacts/storage-states/admin.json');

const SLUG = 'headless-wishlist';
const BASE = `http://localhost:8889/wp-json/${SLUG}/v1`;

test.describe('Headless Wishlist — Wishlist CRUD', () => {
  let productIds: number[] = [];

  test.beforeAll(async ({ wpCli }) => {
    // Get test product IDs (created by global-setup.ts)
    const ids = wpCli('post list --post_type=product --post_status=publish --format=ids');
    productIds = ids
      .split(' ')
      .map((id) => parseInt(id, 10))
      .filter((id) => !isNaN(id));
    expect(productIds.length).toBeGreaterThanOrEqual(2);

    // Clean leftover wishlist data from admin user (ID 1)
    try {
      wpCli('user meta delete 1 _headless_wishlist');
    } catch {
      // Meta may not exist yet — ignore
    }
  });

  test('POST /items adds product to wishlist (201)', async ({ restApi }) => {
    const { status, data } = await restApi.post(`${SLUG}/v1/items`, {
      product_id: productIds[0],
    });
    expect(status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.item.product_id).toBe(productIds[0]);
    expect(data.item.slug).toBeDefined();
    expect(data.item.added_at).toBeDefined();
  });

  test('POST /items with same product returns 409', async ({ restApi }) => {
    const { status, data } = await restApi.post(`${SLUG}/v1/items`, {
      product_id: productIds[0],
    });
    expect(status).toBe(409);
    expect(data.code).toBe('already_exists');
  });

  test('POST /items with second product succeeds', async ({ restApi }) => {
    const { status, data } = await restApi.post(`${SLUG}/v1/items`, {
      product_id: productIds[1],
    });
    expect(status).toBe(201);
    expect(data.item.product_id).toBe(productIds[1]);
  });

  test('POST /items with non-existent product returns 404', async ({ restApi }) => {
    const { status, data } = await restApi.post(`${SLUG}/v1/items`, {
      product_id: 999999,
    });
    expect(status).toBe(404);
    expect(data.code).toBe('product_not_found');
  });

  test('POST /items without product_id returns 400', async ({ restApi }) => {
    const { status, data } = await restApi.post(`${SLUG}/v1/items`, {});
    expect(status).toBe(400);
    expect(data.code).toBe('missing_product_id');
  });

  test('GET /items returns wishlist ordered by added_at descending', async ({ restApi }) => {
    const { status, data } = await restApi.get(`${SLUG}/v1/items`);
    expect(status).toBe(200);
    expect(data.items).toHaveLength(2);
    // Most recently added first
    expect(data.items[0].product_id).toBe(productIds[1]);
    expect(data.items[1].product_id).toBe(productIds[0]);
    // Each item has required fields
    for (const item of data.items) {
      expect(item.slug).toBeDefined();
      expect(item.added_at).toBeDefined();
    }
  });

  test('DELETE /items/{product_id} removes item', async () => {
    const ctx = await playwrightRequest.newContext({
      storageState: STORAGE_STATE,
      extraHTTPHeaders: {
        'X-WP-Nonce': JSON.parse(fs.readFileSync(STORAGE_STATE, 'utf-8')).nonce,
      },
    });
    const res = await ctx.delete(`${BASE}/items/${productIds[1]}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    await ctx.dispose();
  });

  test('GET /items reflects removal', async ({ restApi }) => {
    const { data } = await restApi.get(`${SLUG}/v1/items`);
    expect(data.items).toHaveLength(1);
    expect(data.items[0].product_id).toBe(productIds[0]);
  });

  test('DELETE /items/{product_id} for missing item returns 404', async () => {
    const ctx = await playwrightRequest.newContext({
      storageState: STORAGE_STATE,
      extraHTTPHeaders: {
        'X-WP-Nonce': JSON.parse(fs.readFileSync(STORAGE_STATE, 'utf-8')).nonce,
      },
    });
    const res = await ctx.delete(`${BASE}/items/${productIds[1]}`);
    expect(res.status()).toBe(404);
    const body = await res.json();
    expect(body.code).toBe('not_found');
    await ctx.dispose();
  });

  test('DELETE /items clears entire wishlist', async () => {
    const ctx = await playwrightRequest.newContext({
      storageState: STORAGE_STATE,
      extraHTTPHeaders: {
        'X-WP-Nonce': JSON.parse(fs.readFileSync(STORAGE_STATE, 'utf-8')).nonce,
      },
    });
    const res = await ctx.delete(`${BASE}/items`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    await ctx.dispose();
  });

  test('GET /items after clear returns empty list', async ({ restApi }) => {
    const { status, data } = await restApi.get(`${SLUG}/v1/items`);
    expect(status).toBe(200);
    expect(data.items).toHaveLength(0);
  });

  test('Unauthenticated requests return 401', async () => {
    const ctx = await playwrightRequest.newContext();
    const getRes = await ctx.get(`${BASE}/items`);
    expect(getRes.status()).toBe(401);

    const postRes = await ctx.post(`${BASE}/items`, {
      data: { product_id: productIds[0] },
    });
    expect(postRes.status()).toBe(401);
    await ctx.dispose();
  });
});
