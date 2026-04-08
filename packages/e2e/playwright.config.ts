import { defineConfig } from '@playwright/test';
import baseConfig from '@wordpress/scripts/config/playwright.config.js';

export default defineConfig({
  ...baseConfig,
  testDir: './tests',
  globalSetup: './global-setup.ts',
  reporter: process.env.CI
    ? [['github'], ['html', { outputFolder: 'playwright-report', open: 'never' }]]
    : [['list']],
  webServer: {
    command: 'pnpm wp-env start',
    port: 8889,
    timeout: 120_000,
    reuseExistingServer: true,
  },
});
