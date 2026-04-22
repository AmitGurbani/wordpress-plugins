import { request as playwrightRequest } from '@playwright/test';
import { expect, test } from '../../fixtures/wordpress';

const SLUG = 'headless-storefront';
const BASE = `http://localhost:8889/wp-json/${SLUG}/v1`;

test.describe('Headless Storefront — Search Tracking', () => {
  test('GET /admin/popular-searches requires authentication', async () => {
    const ctx = await playwrightRequest.newContext();
    const res = await ctx.get(`${BASE}/admin/popular-searches`);
    expect(res.status()).toBe(401);
    await ctx.dispose();
  });

  test('GET /admin/popular-searches returns array', async ({ restApi }) => {
    const { status, data } = await restApi.get(`${SLUG}/v1/admin/popular-searches`);
    expect(status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
  });

  test('POST /admin/clear-searches requires authentication', async () => {
    const ctx = await playwrightRequest.newContext();
    const res = await ctx.post(`${BASE}/admin/clear-searches`);
    expect(res.status()).toBe(401);
    await ctx.dispose();
  });

  test('POST /admin/clear-searches empties the table', async ({ restApi }) => {
    const { status, data } = await restApi.post(`${SLUG}/v1/admin/clear-searches`);
    expect(status).toBe(200);
    expect(data.success).toBe(true);

    // Verify table is empty
    const { data: searches } = await restApi.get(`${SLUG}/v1/admin/popular-searches`);
    expect(searches).toHaveLength(0);
  });
});
