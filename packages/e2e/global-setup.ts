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

  // 2. Enable pretty permalinks (required for REST API /wp-json/ URLs)
  wpCli('rewrite structure "/%postname%/"');

  // 3. Bypass WooCommerce onboarding
  wpCli('option patch insert woocommerce_onboarding_profile skipped 1');
  wpCli('option update woocommerce_task_list_hidden yes');
  wpCli('option update woocommerce_task_list_complete yes');
  wpCli('wc tool run install_pages --user=admin');

  // 4. Configure WooCommerce basics
  wpCli('option update woocommerce_store_address "123 Test St"');
  wpCli('option update woocommerce_store_city "Test City"');
  wpCli('option update woocommerce_default_country "US:CA"');
  wpCli('option update woocommerce_currency "USD"');

  // 5. Create test products (silently ignores duplicate SKU errors)
  wpCli(
    'wc product create --name="Test Widget" --regular_price=25.00 --sku=TEST-001 --status=publish --user=admin',
  );
  wpCli(
    'wc product create --name="Premium Gadget" --regular_price=99.50 --sku=PREM-001 --status=publish --user=admin',
  );

  // 6. Re-activate plugins that create DB tables on activation
  //    (wp-env marks them active but may not fire activation hooks)
  //    Done AFTER WooCommerce setup so WooCommerce is fully loaded during activation
  wpCli('plugin deactivate headless-fuzzy-find');
  wpCli('plugin activate headless-fuzzy-find');
  wpCli('plugin deactivate headless-pos-sessions');
  wpCli('plugin activate headless-pos-sessions');

  // 7. Trigger fuzzy-find reindex so search tests have data ready
  wpCli('eval "do_action(\'headless_fuzzy_find_do_reindex\');"');

  // 8. Enable auth test mode
  wpCli('option update headless_auth_otp_test_mode 1');

  // 9. Flush rewrite rules
  wpCli('rewrite flush');
}

export default globalSetup;
