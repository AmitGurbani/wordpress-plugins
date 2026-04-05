import { request as playwrightRequest } from '@playwright/test';
import { expect, test } from '../../fixtures/wordpress';

const SLUG = 'headless-google-analytics';

test.describe('Headless Google Analytics — Diagnostics', () => {
  test('POST /diagnostics/test-event requires authentication', async () => {
    const ctx = await playwrightRequest.newContext();
    const res = await ctx.post(`http://localhost:8889/wp-json/${SLUG}/v1/diagnostics/test-event`);
    expect(res.status()).toBe(401);
    await ctx.dispose();
  });

  test('POST /diagnostics/test-event returns validation result', async ({ restApi }) => {
    // Configure with dummy credentials
    await restApi.updateSettings(SLUG, {
      measurement_id: 'G-TEST12345',
      api_secret: 'test_secret',
    });

    const { status, data } = await restApi.post(`${SLUG}/v1/diagnostics/test-event`);
    expect(status).toBe(200);
    // The debug endpoint returns a validation structure
    expect(data).toBeDefined();
  });
});
