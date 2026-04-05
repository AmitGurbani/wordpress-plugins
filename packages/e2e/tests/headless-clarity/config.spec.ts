import { expect, test } from '../../fixtures/wordpress';

const SLUG = 'headless-clarity';

test.describe('Headless Clarity — Config Endpoint', () => {
  test.afterAll(async ({ restApi }) => {
    await restApi.updateSettings(SLUG, {
      project_id: '',
      enable_identify: true,
    });
  });

  test('GET /config returns project_id', async ({ restApi }) => {
    await restApi.updateSettings(SLUG, { project_id: 'abc1234567' });

    const { status, data } = await restApi.getConfig(SLUG);
    expect(status).toBe(200);
    expect(data.project_id).toBe('abc1234567');
  });

  test('GET /config returns user info when identify enabled', async ({ restApi }) => {
    await restApi.updateSettings(SLUG, {
      project_id: 'abc1234567',
      enable_identify: true,
    });

    const { data } = await restApi.getConfig(SLUG);
    // Authenticated request — should include user object
    expect(data.user).toBeDefined();
    expect(data.user.id).toBeTruthy();
    expect(data.user.display_name).toBeTruthy();
  });

  test('GET /config omits user info when identify disabled', async ({ restApi }) => {
    await restApi.updateSettings(SLUG, {
      project_id: 'abc1234567',
      enable_identify: false,
    });

    const { data } = await restApi.getConfig(SLUG);
    expect(data.user).toBeUndefined();
  });
});
