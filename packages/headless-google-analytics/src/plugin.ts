/**
 * Headless Google Analytics — wpts Plugin
 *
 * Google Analytics (GA4) with WooCommerce integration and Measurement Protocol
 * for headless WordPress stores. Provides the Measurement ID for frontend
 * gtag.js initialization and server-side purchase event tracking.
 *
 * Build: npx wpts build src/plugin.ts -o dist --clean
 */

import { Action, Activate, AdminPage, Deactivate, Filter, Plugin, Setting } from 'wpts';
import './server-tracking.js';
import './config-routes.js';
import './diagnostics-routes.js';

@Plugin({
  name: 'Headless Google Analytics',
  description:
    'Google Analytics (GA4) with WooCommerce integration and Measurement Protocol for headless WordPress.',
  version: '1.0.0',
  author: 'wpts',
  license: 'GPL-2.0+',
  textDomain: 'headless-google-analytics',
  requiresWP: '6.0',
  requiresPHP: '8.0',
})
@AdminPage({
  pageTitle: 'Headless Google Analytics Settings',
  menuTitle: 'Google Analytics',
  capability: 'manage_options',
  menuSlug: 'headless-google-analytics-settings',
  iconUrl: 'dashicons-chart-line',
})
class GoogleAnalytics {
  // ── General Settings ──────────────────────────────────────────────────

  @Setting({
    key: 'measurement_id',
    type: 'string',
    default: '',
    label: 'Measurement ID',
    description: 'GA4 Measurement ID (G-XXXXXXXX) from Google Analytics.',
  })
  measurementId: string = '';

  @Setting({
    key: 'api_secret',
    type: 'string',
    default: '',
    label: 'API Secret',
    description: 'Measurement Protocol API secret from GA4 Admin > Data Streams.',
    sensitive: true,
  })
  apiSecret: string = '';

  @Setting({
    key: 'currency',
    type: 'string',
    default: 'USD',
    label: 'Currency',
    description: 'Default currency for ecommerce events (ISO 4217).',
  })
  currency: string = 'USD';

  // ── WooCommerce Toggle ───────────────────────────────────────────────

  @Setting({
    key: 'enable_purchase',
    type: 'boolean',
    default: true,
    label: 'Track purchase',
    description: 'Auto-send purchase events via WooCommerce hooks.',
  })
  enablePurchase: boolean = true;

  // ── Admin Notices ────────────────────────────────────────────────────

  @Action('admin_notices')
  wooNotice(): void {
    if (!classExists('WooCommerce')) {
      echo('<div class="notice notice-warning"><p><strong>Headless Google Analytics:</strong> ');
      echo(
        escHtml__(
          'WooCommerce is recommended for automatic Purchase event tracking.',
          'headless-google-analytics',
        ),
      );
      echo('</p></div>');
    }
  }

  // ── Dynamic Defaults ─────────────────────────────────────────────────

  @Filter('default_option_headless_google_analytics_currency', { priority: 11 })
  filterDefaultCurrency(defaultValue: string): string {
    if (classExists('WooCommerce')) {
      return getOption('woocommerce_currency', 'USD');
    }
    return defaultValue;
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────

  @Activate()
  onActivation(): void {
    updateOption('headless_google_analytics_version', '1.0.0');
  }

  @Deactivate()
  onDeactivation(): void {
    // Preserve settings on deactivation
  }
}
