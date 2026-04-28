import { request as playwrightRequest } from '@playwright/test';
import { expect, test, wpCli } from '../../fixtures/wordpress';

const SLUG = 'headless-storefront';
const BASE = `http://localhost:8889/wp-json/${SLUG}/v1`;

test.describe('Headless Storefront — Diagnostics', () => {
  test.afterAll(async ({ restApi }) => {
    await restApi.updateSettings(SLUG, { frontend_url: '', revalidate_secret: '' });
    wpCli('option delete headless_storefront_last_revalidate_at');
  });

  test('POST /diagnostics/test-revalidate requires authentication', async () => {
    const ctx = await playwrightRequest.newContext();
    const res = await ctx.post(`${BASE}/diagnostics/test-revalidate`);
    expect(res.status()).toBe(401);
    await ctx.dispose();
  });

  test('POST /diagnostics/test-revalidate returns not_configured when empty', async ({
    restApi,
  }) => {
    await restApi.updateSettings(SLUG, { frontend_url: '', revalidate_secret: '' });

    const { status, data } = await restApi.post(`${SLUG}/v1/diagnostics/test-revalidate`);
    expect(status).toBe(200);
    expect(data.success).toBe(false);
    expect(data.code).toBe('not_configured');
    expect(data.http_code).toBeNull();
  });

  test('GET /settings returns _last_revalidate_at: null when never attempted', async ({
    restApi,
  }) => {
    // Empty config so the option-update hook short-circuits before writing the timestamp.
    await restApi.updateSettings(SLUG, { frontend_url: '', revalidate_secret: '' });
    wpCli('option delete headless_storefront_last_revalidate_at');

    const { data } = await restApi.getSettings(SLUG);
    expect(data).toHaveProperty('_last_revalidate_at');
    expect(data._last_revalidate_at).toBeNull();
  });

  test('POST /diagnostics/test-revalidate does NOT update _last_revalidate_at', async ({
    restApi,
  }) => {
    // Set valid-shaped config so the test endpoint passes its guard clause and
    // actually attempts the request (the auto-fire from this save will also
    // write the timestamp, which we then clear to isolate the test endpoint).
    await restApi.updateSettings(SLUG, {
      frontend_url: 'https://nope.invalid.example',
      revalidate_secret: 'test-secret',
    });
    wpCli('option delete headless_storefront_last_revalidate_at');

    await restApi.post(`${SLUG}/v1/diagnostics/test-revalidate`);

    const { data } = await restApi.getSettings(SLUG);
    expect(data._last_revalidate_at).toBeNull();
  });

  test('POST /admin/revalidate updates _last_revalidate_at', async ({ restApi }) => {
    // Configure with a valid-shaped URL/secret so the dispatch helper writes the timestamp.
    await restApi.updateSettings(SLUG, {
      frontend_url: 'https://example.com',
      revalidate_secret: 'test-secret',
    });

    await restApi.post(`${SLUG}/v1/admin/revalidate`);

    const { data } = await restApi.getSettings(SLUG);
    expect(data._last_revalidate_at).toBeTruthy();
    expect(typeof data._last_revalidate_at).toBe('string');
    // ISO 8601 starts with 4-digit year
    expect(String(data._last_revalidate_at)).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
