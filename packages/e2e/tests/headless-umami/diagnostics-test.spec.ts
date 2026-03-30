import { test, expect } from '../../fixtures/wordpress';
import { request as playwrightRequest } from '@playwright/test';

const SLUG = 'headless-umami';

test.describe('Headless Umami — Diagnostics', () => {
  test('POST /diagnostics/test-connection requires authentication', async () => {
    const ctx = await playwrightRequest.newContext();
    const res = await ctx.post(
      `http://localhost:8889/wp-json/${SLUG}/v1/diagnostics/test-connection`,
    );
    expect(res.status()).toBe(401);
    await ctx.dispose();
  });

  test('POST /diagnostics/test-connection returns response', async ({
    restApi,
  }) => {
    await restApi.updateSettings(SLUG, {
      umami_url: 'http://localhost:19999',
      website_id: '550e8400-e29b-41d4-a716-446655440000',
    });

    const { status, data } = await restApi.post(
      `${SLUG}/v1/diagnostics/test-connection`,
    );
    expect(status).toBe(200);
    expect(data).toBeDefined();
  });
});
