import { expect, test } from '../../fixtures/wordpress';

const SLUG = 'headless-umami';

test.describe('Headless Umami — Config Endpoint', () => {
  test.afterAll(async ({ restApi }) => {
    await restApi.updateSettings(SLUG, { umami_url: '', website_id: '' });
  });

  test('GET /config returns umami_url and website_id', async ({ restApi }) => {
    await restApi.updateSettings(SLUG, {
      umami_url: 'https://umami.example.com',
      website_id: '550e8400-e29b-41d4-a716-446655440000',
    });

    const { status, data } = await restApi.getConfig(SLUG);
    expect(status).toBe(200);
    expect(data.umami_url).toBe('https://umami.example.com');
    expect(data.website_id).toBe('550e8400-e29b-41d4-a716-446655440000');
  });

  test('GET /config is publicly accessible', async ({ request }) => {
    const res = await request.get('http://localhost:8889/wp-json/headless-umami/v1/config');
    expect(res.status()).toBe(200);
  });
});
