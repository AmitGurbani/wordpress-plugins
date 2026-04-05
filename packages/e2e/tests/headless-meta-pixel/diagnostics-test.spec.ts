import { request as playwrightRequest } from '@playwright/test';
import { expect, test } from '../../fixtures/wordpress';

const SLUG = 'headless-meta-pixel';

test.describe('Headless Meta Pixel — Diagnostics', () => {
  test('POST /diagnostics/test-capi requires authentication', async () => {
    const ctx = await playwrightRequest.newContext();
    const res = await ctx.post(`http://localhost:8889/wp-json/${SLUG}/v1/diagnostics/test-capi`);
    expect(res.status()).toBe(401);
    await ctx.dispose();
  });

  test('POST /diagnostics/test-capi returns response structure', async ({ restApi }) => {
    await restApi.updateSettings(SLUG, {
      pixel_id: '123456789012345',
      access_token: 'test_token',
    });

    const { status, data } = await restApi.post(`${SLUG}/v1/diagnostics/test-capi`);
    expect(status).toBe(200);
    expect(data).toBeDefined();
  });
});
