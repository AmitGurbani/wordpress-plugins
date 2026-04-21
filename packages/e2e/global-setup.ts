import { execSync } from 'node:child_process';
import { type FullConfig, request } from '@playwright/test';
import { RequestUtils } from '@wordpress/e2e-test-utils-playwright';

/**
 * Run a WP-CLI command against the wp-env test instance.
 * Only called with hardcoded strings — no user input, no injection risk.
 * Ignores non-zero exit codes to keep setup fully idempotent.
 */
function wpCli(command: string): string {
  try {
    return execSync(`pnpm wp-env run tests-cli wp ${command}`, {
      cwd: __dirname,
      encoding: 'utf-8',
      timeout: 60_000,
    }).trim();
  } catch {
    return '';
  }
}

async function globalSetup(config: FullConfig) {
  const { storageState, baseURL } = config.projects[0].use;
  const storageStatePath = typeof storageState === 'string' ? storageState : undefined;

  // 1. Authenticate as admin and save storage state
  const requestContext = await request.newContext({ baseURL });
  const requestUtils = new RequestUtils(requestContext, { storageStatePath });
  await requestUtils.setupRest();
  await requestContext.dispose();

  // 2. Ensure all plugins are active (wp-env may miss activations if the
  //    Docker container is unstable during startup — retry up to 3 times)
  const allPlugins =
    'headless-clarity headless-google-analytics headless-meta-pixel headless-umami headless-auth headless-pos-sessions headless-fuzzy-find headless-wishlist headless-orders headless-media-cleanup';
  for (let attempt = 0; attempt < 3; attempt++) {
    wpCli(`plugin activate ${allPlugins}`);
    const active = wpCli('plugin list --status=active --field=name');
    if (active.includes('headless-fuzzy-find') && active.includes('headless-pos-sessions')) break;
  }

  // 3. Fire activation hooks for plugins that create DB tables.
  //    Uses wp eval instead of deactivate/activate cycle — idempotent
  //    (dbDelta + update_option) and doesn't risk leaving a plugin
  //    deactivated if re-activation fails.
  wpCli('eval "activate_headless_fuzzy_find();"');
  wpCli('eval "activate_headless_pos_sessions();"');

  // 4. Enable pretty permalinks (required for REST API /wp-json/ URLs)
  wpCli('rewrite structure "/%postname%/"');

  // 5. Bypass WooCommerce onboarding
  wpCli('option patch insert woocommerce_onboarding_profile skipped 1');
  wpCli('option update woocommerce_task_list_hidden yes');
  wpCli('option update woocommerce_task_list_complete yes');
  wpCli('wc tool run install_pages --user=admin');

  // 6. Configure WooCommerce basics
  wpCli('option update woocommerce_store_address "123 Test St"');
  wpCli('option update woocommerce_store_city "Test City"');
  wpCli('option update woocommerce_default_country "US:CA"');
  wpCli('option update woocommerce_currency "USD"');

  // 7. Create test products (silently ignores duplicate SKU errors)
  wpCli(
    'wc product create --name="Test Widget" --regular_price=25.00 --sku=TEST-001 --status=publish --user=admin',
  );
  wpCli(
    'wc product create --name="Premium Gadget" --regular_price=99.50 --sku=PREM-001 --status=publish --user=admin',
  );

  // 8. Trigger fuzzy-find reindex so search tests have data ready
  wpCli('eval "do_action(\'headless_fuzzy_find_do_reindex\');"');

  // 9. Enable auth test mode
  wpCli('option update headless_auth_otp_test_mode 1');

  // 10. Flush rewrite rules
  wpCli('rewrite flush');
}

export default globalSetup;
