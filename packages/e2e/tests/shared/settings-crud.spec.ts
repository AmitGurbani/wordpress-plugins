import { request as playwrightRequest } from '@playwright/test';
import { expect, test } from '../../fixtures/wordpress';
import { PLUGINS } from '../../utils/settings';

for (const plugin of PLUGINS) {
  test.describe(`${plugin.name} — Settings CRUD`, () => {
    test.afterAll(async ({ restApi }) => {
      // Reset to defaults after each plugin's tests
      await restApi.updateSettings(plugin.slug, plugin.defaults);
    });

    test('GET /settings requires authentication', async () => {
      // Create a fresh context without stored auth
      const ctx = await playwrightRequest.newContext();
      const res = await ctx.get(`http://localhost:8889/wp-json/${plugin.slug}/v1/settings`);
      expect(res.status()).toBe(401);
      await ctx.dispose();
    });

    test('GET /settings returns all expected keys', async ({ restApi }) => {
      const { status, data } = await restApi.getSettings(plugin.slug);
      expect(status).toBe(200);

      for (const key of Object.keys(plugin.defaults)) {
        expect(data).toHaveProperty(key);
      }
    });

    test('POST /settings updates values', async ({ restApi }) => {
      const { status: updateStatus } = await restApi.updateSettings(plugin.slug, plugin.settings);
      expect(updateStatus).toBe(200);

      const { status, data } = await restApi.getSettings(plugin.slug);
      expect(status).toBe(200);

      for (const [key, value] of Object.entries(plugin.settings)) {
        if (plugin.sensitiveKeys.includes(key)) {
          expect(data[key]).toBe('********');
        } else if (typeof value === 'boolean') {
          expect(data[key]).toBe(value);
        } else {
          // WordPress get_option returns numbers as strings
          expect(String(data[key])).toBe(String(value));
        }
      }
    });

    test('POST /settings round-trip preserves types', async ({ restApi }) => {
      // First update with test values
      await restApi.updateSettings(plugin.slug, plugin.settings);

      // Read back and verify types match
      const { data } = await restApi.getSettings(plugin.slug);

      for (const [key, value] of Object.entries(plugin.settings)) {
        if (plugin.sensitiveKeys.includes(key)) continue;
        if (typeof value === 'boolean') {
          expect(typeof data[key]).toBe('boolean');
        } else {
          // WordPress returns numbers as strings via get_option
          expect(data[key]).toBeDefined();
        }
      }
    });

    if (plugin.sensitiveKeys.length > 0) {
      test('sensitive fields are masked in GET response', async ({ restApi }) => {
        // Set a sensitive value
        const sensitiveUpdate: Record<string, string> = {};
        for (const key of plugin.sensitiveKeys) {
          sensitiveUpdate[key] = 'secret_test_value';
        }
        await restApi.updateSettings(plugin.slug, sensitiveUpdate);

        // Verify it's masked
        const { data } = await restApi.getSettings(plugin.slug);
        for (const key of plugin.sensitiveKeys) {
          expect(data[key]).toBe('********');
        }
      });

      test('sensitive field preserved when client re-submits the mask', async ({
        restApi,
        wpCli,
      }) => {
        // Regression guard for the wpts class-rest-api.hbs preserve-on-mask fix:
        // the admin UI re-sends '********' as the current value for sensitive fields
        // the user did not edit; the server must preserve the real stored value.
        const optionPrefix = plugin.slug.replace(/-/g, '_');
        for (const key of plugin.sensitiveKeys) {
          const originalValue = `original_preserve_value_${key}_${Date.now()}`;
          const optionName = `${optionPrefix}_${key}`;

          await restApi.updateSettings(plugin.slug, { [key]: originalValue });
          await restApi.updateSettings(plugin.slug, { [key]: '********' });

          // Raw stored value must still be the original, not the mask string.
          const stored = wpCli(`option get ${optionName}`);
          expect(stored).toBe(originalValue);
        }
      });
    }

    test('POST /settings requires authentication', async () => {
      const ctx = await playwrightRequest.newContext();
      const res = await ctx.post(`http://localhost:8889/wp-json/${plugin.slug}/v1/settings`, {
        data: plugin.settings,
      });
      expect(res.status()).toBe(401);
      await ctx.dispose();
    });
  });
}
