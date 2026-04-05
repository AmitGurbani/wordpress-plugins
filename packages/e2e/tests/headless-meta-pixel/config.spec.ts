import { expect, test } from '../../fixtures/wordpress';

const SLUG = 'headless-meta-pixel';

test.describe('Headless Meta Pixel — Config Endpoint', () => {
  test.afterAll(async ({ restApi }) => {
    await restApi.updateSettings(SLUG, {
      pixel_id: '',
      enable_view_content: true,
      enable_add_to_cart: true,
      enable_initiate_checkout: true,
      enable_purchase: true,
      enable_search: true,
      enable_capi: true,
    });
  });

  test('GET /config returns pixel_id and event toggles', async ({ restApi }) => {
    await restApi.updateSettings(SLUG, {
      pixel_id: '123456789012345',
      enable_view_content: false,
      enable_search: false,
    });

    const { status, data } = await restApi.getConfig(SLUG);
    expect(status).toBe(200);
    expect(data.pixel_id).toBe('123456789012345');
  });

  test('GET /config does not expose access_token', async ({ restApi }) => {
    await restApi.updateSettings(SLUG, { access_token: 'secret_token' });

    const { data } = await restApi.getConfig(SLUG);
    expect(data.access_token).toBeUndefined();
  });
});
