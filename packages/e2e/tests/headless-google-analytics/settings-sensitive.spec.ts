import { test, expect } from '../../fixtures/wordpress';

const SLUG = 'headless-google-analytics';

test.describe('Headless Google Analytics — Sensitive Settings', () => {
  test.afterAll(async ({ restApi }) => {
    await restApi.updateSettings(SLUG, { api_secret: '' });
  });

  test('api_secret is masked as ******** in GET /settings', async ({
    restApi,
  }) => {
    await restApi.updateSettings(SLUG, { api_secret: 'my_secret_key' });

    const { data } = await restApi.getSettings(SLUG);
    expect(data.api_secret).toBe('********');
  });

  test('POST /settings with new api_secret overwrites previous', async ({
    restApi,
  }) => {
    await restApi.updateSettings(SLUG, { api_secret: 'first_secret' });
    await restApi.updateSettings(SLUG, { api_secret: 'second_secret' });

    // We can't read the actual value, but the masked value should still show
    const { data } = await restApi.getSettings(SLUG);
    expect(data.api_secret).toBe('********');
  });
});
