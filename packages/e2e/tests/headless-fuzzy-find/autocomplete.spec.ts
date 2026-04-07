import { request as playwrightRequest } from '@playwright/test';
import { expect, test } from '../../fixtures/wordpress';

const SLUG = 'headless-fuzzy-find';
const BASE = `http://localhost:8889/wp-json/${SLUG}/v1`;

test.describe('Headless Fuzzy Find — Autocomplete', () => {
  test('GET /autocomplete returns limited results', async () => {
    const ctx = await playwrightRequest.newContext();
    const res = await ctx.get(`${BASE}/autocomplete?query=Test&limit=1`);
    expect(res.status()).toBe(200);

    const data = await res.json();
    expect(data.results).toBeDefined();
    expect(data.results.length).toBeLessThanOrEqual(1);

    await ctx.dispose();
  });

  test('GET /autocomplete is publicly accessible', async () => {
    const ctx = await playwrightRequest.newContext();
    const res = await ctx.get(`${BASE}/autocomplete?query=Widget`);
    expect(res.status()).toBe(200);
    await ctx.dispose();
  });
});
