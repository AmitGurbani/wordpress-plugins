/**
 * Headless Storefront — wpts Plugin
 *
 * Store branding and configuration for headless WordPress with WooCommerce.
 * Single WP option stores all settings; public REST API serves the frontend.
 *
 * Build: npx wpts build src/plugin.ts -o dist --clean
 */

import { Activate, AdminPage, Deactivate, Plugin, Uninstall } from '@amitgurbani/wpts';
import './config-routes.js';
import './search-tracking.js';

@Plugin({
  name: 'Headless Storefront',
  uri: 'https://github.com/AmitGurbani/wordpress-plugins',
  description: 'Store branding and configuration REST API for headless WordPress with WooCommerce.',
  version: '0.1.0',
  author: 'Amit Gurbani',
  authorUri: 'https://github.com/AmitGurbani',
  license: 'GPL-2.0+',
  textDomain: 'headless-storefront',
  requiresWP: '6.8',
  requiresPHP: '8.2',
  wooNotice: 'required',
})
@AdminPage({
  pageTitle: 'Headless Branding Settings',
  menuTitle: 'Headless Branding',
  capability: 'manage_options',
  menuSlug: 'headless-storefront-settings',
  parentSlug: 'options-general.php',
})
class HeadlessStorefront {
  @Activate()
  onActivation(): void {
    requireOnce(`${ABSPATH}wp-admin/includes/upgrade.php`);

    const charsetCollate: string = wpdb.getCharsetCollate();
    const table: string = `${wpdb.prefix}headless_search_queries`;

    const sql: string =
      'CREATE TABLE ' +
      table +
      ' (' +
      'id bigint(20) unsigned NOT NULL AUTO_INCREMENT, ' +
      '`query` varchar(255) NOT NULL, ' +
      'count int unsigned NOT NULL DEFAULT 1, ' +
      'last_searched datetime NOT NULL, ' +
      'PRIMARY KEY  (id), ' +
      'UNIQUE KEY query_unique (`query`)' +
      ') ENGINE=InnoDB ' +
      charsetCollate +
      ';';

    dbDelta(sql);

    addOption('headless_storefront_config', []);

    if (!wpNextScheduled('headless_storefront_search_cleanup')) {
      wpScheduleEvent(time(), 'weekly', 'headless_storefront_search_cleanup');
    }
  }

  @Deactivate()
  onDeactivation(): void {
    wpClearScheduledHook('headless_storefront_search_cleanup');
  }

  @Uninstall()
  onUninstall(): void {
    wpdb.query(`DROP TABLE IF EXISTS ${wpdb.prefix}headless_search_queries`);
    wpClearScheduledHook('headless_storefront_search_cleanup');
  }
}
