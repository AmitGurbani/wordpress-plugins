import { test, expect } from '../../fixtures/wordpress';
import { PLUGINS } from '../../utils/settings';
import { request as playwrightRequest } from '@playwright/test';

const pluginsWithDiagnostics = PLUGINS.filter((p) => p.hasDiagnostics);

for (const plugin of pluginsWithDiagnostics) {
  test.describe(`${plugin.name} — Diagnostics`, () => {
    test('GET /diagnostics/last-error requires authentication', async () => {
      const ctx = await playwrightRequest.newContext();
      const res = await ctx.get(
        `http://localhost:8889/wp-json/${plugin.slug}/v1/diagnostics/last-error`,
      );
      expect(res.status()).toBe(401);
      await ctx.dispose();
    });

    test('GET /diagnostics/last-error returns empty when no error', async ({
      restApi,
      wpCli,
    }) => {
      // Clear any existing error
      const suffix = plugin.errorOptionSuffix ?? 'last_error';
      const optionKey = plugin.slug.replace(/-/g, '_') + '_' + suffix;
      try {
        wpCli(`option delete ${optionKey}`);
      } catch {
        // Option might not exist yet
      }

      const { status, data } = await restApi.getDiagnostics(plugin.slug);
      expect(status).toBe(200);
      expect(data.last_error).toBe('');
    });

    test('GET /diagnostics/last-error returns error when set', async ({
      restApi,
      wpCli,
    }) => {
      const suffix = plugin.errorOptionSuffix ?? 'last_error';
      const optionKey = plugin.slug.replace(/-/g, '_') + '_' + suffix;
      wpCli(`option update ${optionKey} "Test error message"`);

      const { status, data } = await restApi.getDiagnostics(plugin.slug);
      expect(status).toBe(200);
      expect(data.last_error).toBe('Test error message');

      // Clean up
      wpCli(`option delete ${optionKey}`);
    });
  });
}
