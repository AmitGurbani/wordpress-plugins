import { request as playwrightRequest } from '@playwright/test';
import { expect, test } from '../../fixtures/wordpress';

const SLUG = 'headless-fuzzyfind';
const BASE = `http://localhost:8889/wp-json/${SLUG}/v1`;

test.describe('Headless FuzzyFind — Search', () => {
  test.beforeAll(async ({ restApi }) => {
    // Check if index already has products
    const { data: status } = await restApi.get(`${SLUG}/v1/index/status`);
    if (status.total_indexed > 0 && !status.is_indexing) return;

    // Trigger rebuild (ignore 409 if already in progress)
    await restApi.post(`${SLUG}/v1/index/rebuild`);

    // Wait for index to be ready
    let indexed = false;
    for (let i = 0; i < 30; i++) {
      const { data } = await restApi.get(`${SLUG}/v1/index/status`);
      if (data.total_indexed > 0 && !data.is_indexing) {
        indexed = true;
        break;
      }
      await new Promise((r) => setTimeout(r, 1000));
    }
    expect(indexed).toBe(true);
  });

  test('GET /search returns results for matching query', async () => {
    const ctx = await playwrightRequest.newContext();
    const res = await ctx.get(`${BASE}/search?query=Widget`);
    expect(res.status()).toBe(200);

    const data = await res.json();
    expect(data.results).toBeDefined();
    expect(data.results.length).toBeGreaterThan(0);
    expect(data.total).toBeGreaterThan(0);
    expect(data.page).toBe(1);

    await ctx.dispose();
  });

  test('GET /search with short query returns empty', async ({ restApi }) => {
    // Default min_query_length is 2
    await restApi.updateSettings(SLUG, { min_query_length: 3 });

    const ctx = await playwrightRequest.newContext();
    const res = await ctx.get(`${BASE}/search?query=ab`);
    expect(res.status()).toBe(200);

    const data = await res.json();
    expect(data.results).toEqual([]);

    await ctx.dispose();

    // Reset
    await restApi.updateSettings(SLUG, { min_query_length: 2 });
  });

  test('GET /search is publicly accessible', async () => {
    const ctx = await playwrightRequest.newContext();
    const res = await ctx.get(`${BASE}/search?query=Test`);
    expect(res.status()).toBe(200);
    await ctx.dispose();
  });

  test('GET /search returns pagination info', async () => {
    const ctx = await playwrightRequest.newContext();
    const res = await ctx.get(`${BASE}/search?query=Test&per_page=1`);
    expect(res.status()).toBe(200);

    const data = await res.json();
    expect(data.per_page).toBe(1);
    expect(data.total_pages).toBeDefined();

    await ctx.dispose();
  });
});
