import { test, expect } from '../../fixtures/wordpress';

const SLUG = 'headless-google-analytics';

test.describe('Headless Google Analytics — Config Endpoint', () => {
  test.afterAll(async ({ restApi }) => {
    await restApi.updateSettings(SLUG, { measurement_id: '' });
  });

  test('GET /config returns measurement_id', async ({ restApi }) => {
    await restApi.updateSettings(SLUG, { measurement_id: 'G-TEST12345' });

    const { status, data } = await restApi.getConfig(SLUG);
    expect(status).toBe(200);
    expect(data.measurement_id).toBe('G-TEST12345');
  });

  test('GET /config does not expose api_secret', async ({ restApi }) => {
    await restApi.updateSettings(SLUG, { api_secret: 'secret123' });

    const { data } = await restApi.getConfig(SLUG);
    expect(data.api_secret).toBeUndefined();
  });
});
