import { request as playwrightRequest } from '@playwright/test';
import { expect, test } from '../../fixtures/wordpress';

const SLUG = 'headless-fuzzyfind';

test.describe('Headless FuzzyFind — Indexer', () => {
  test('GET /index/status requires authentication', async () => {
    const ctx = await playwrightRequest.newContext();
    const res = await ctx.get(`http://localhost:8889/wp-json/${SLUG}/v1/index/status`);
    expect(res.status()).toBe(401);
    await ctx.dispose();
  });

  test('GET /index/status returns index info', async ({ restApi }) => {
    const { status, data } = await restApi.get(`${SLUG}/v1/index/status`);
    expect(status).toBe(200);
    expect(data.total_products).toBeDefined();
    expect(data.total_indexed).toBeDefined();
    expect(typeof data.is_indexing).toBe('boolean');
  });

  test('POST /index/rebuild triggers reindex', async ({ restApi }) => {
    const { status, data } = await restApi.post(`${SLUG}/v1/index/rebuild`);
    // 200 = started, 409 = already in progress (both are valid)
    expect([200, 409]).toContain(status);
    expect(data).toBeDefined();
  });

  test('POST /index/rebuild requires authentication', async () => {
    const ctx = await playwrightRequest.newContext();
    const res = await ctx.post(`http://localhost:8889/wp-json/${SLUG}/v1/index/rebuild`);
    expect(res.status()).toBe(401);
    await ctx.dispose();
  });

  test('POST /index/delete clears the index', async ({ restApi }) => {
    const { status } = await restApi.post(`${SLUG}/v1/index/delete`);
    expect(status).toBe(200);

    // Verify index is empty
    const { data } = await restApi.get(`${SLUG}/v1/index/status`);
    expect(data.total_indexed).toBe(0);

    // Rebuild for other tests and wait for completion
    await restApi.post(`${SLUG}/v1/index/rebuild`);
    for (let i = 0; i < 30; i++) {
      const { data: s } = await restApi.get(`${SLUG}/v1/index/status`);
      if (s.total_indexed > 0 && !s.is_indexing) break;
      await new Promise((r) => setTimeout(r, 1000));
    }
  });
});
