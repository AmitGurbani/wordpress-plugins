import { request as playwrightRequest } from '@playwright/test';
import { expect, test } from '../../fixtures/wordpress';

const SLUG = 'headless-fuzzy-find';
const BASE = `http://localhost:8889/wp-json/${SLUG}/v1`;

test.describe('Headless Fuzzy Find — Popular Searches', () => {
  test.afterAll(async ({ restApi }) => {
    await restApi.updateSettings(SLUG, {
      popular_searches_override: '',
      popular_searches_max: 12,
    });
  });

  test('GET /popular-searches is publicly accessible', async () => {
    const ctx = await playwrightRequest.newContext();
    const res = await ctx.get(`${BASE}/popular-searches`);
    expect(res.status()).toBe(200);
    await ctx.dispose();
  });

  test('GET /popular-searches returns { items: string[] }', async () => {
    const ctx = await playwrightRequest.newContext();
    const res = await ctx.get(`${BASE}/popular-searches`);
    const data = await res.json();

    expect(data).toHaveProperty('items');
    expect(Array.isArray(data.items)).toBe(true);

    await ctx.dispose();
  });

  test('GET /popular-searches returns admin overrides when set', async ({ restApi }) => {
    await restApi.updateSettings(SLUG, {
      popular_searches_override: 'tea\ncoffee\nmilk',
      popular_searches_max: 12,
    });

    const ctx = await playwrightRequest.newContext();
    const res = await ctx.get(`${BASE}/popular-searches`);
    const data = await res.json();

    expect(data.items).toEqual(['tea', 'coffee', 'milk']);

    await ctx.dispose();
  });

  test('GET /popular-searches respects ?limit=N within override list', async ({ restApi }) => {
    await restApi.updateSettings(SLUG, {
      popular_searches_override: 'tea\ncoffee\nmilk\nsugar',
      popular_searches_max: 12,
    });

    const ctx = await playwrightRequest.newContext();
    const res = await ctx.get(`${BASE}/popular-searches?limit=2`);
    const data = await res.json();

    expect(data.items).toEqual(['tea', 'coffee']);

    await ctx.dispose();
  });

  test('GET /popular-searches falls back to popular_searches_max when ?limit omitted', async ({
    restApi,
  }) => {
    await restApi.updateSettings(SLUG, {
      popular_searches_override: 'tea\ncoffee\nmilk\nsugar\nbread',
      popular_searches_max: 3,
    });

    const ctx = await playwrightRequest.newContext();
    const res = await ctx.get(`${BASE}/popular-searches`);
    const data = await res.json();

    expect(data.items).toEqual(['tea', 'coffee', 'milk']);

    await ctx.dispose();
  });

  test('GET /popular-searches skips blank lines in overrides', async ({ restApi }) => {
    await restApi.updateSettings(SLUG, {
      popular_searches_override: 'tea\n\n  \ncoffee\n',
      popular_searches_max: 12,
    });

    const ctx = await playwrightRequest.newContext();
    const res = await ctx.get(`${BASE}/popular-searches`);
    const data = await res.json();

    expect(data.items).toEqual(['tea', 'coffee']);

    await ctx.dispose();
  });

  test('GET /popular-searches returns array (auto-tracked) when overrides empty', async ({
    restApi,
  }) => {
    await restApi.updateSettings(SLUG, { popular_searches_override: '' });

    const ctx = await playwrightRequest.newContext();
    const res = await ctx.get(`${BASE}/popular-searches`);
    const data = await res.json();

    // Shape only — log table state depends on prior tests
    expect(Array.isArray(data.items)).toBe(true);

    await ctx.dispose();
  });
});
