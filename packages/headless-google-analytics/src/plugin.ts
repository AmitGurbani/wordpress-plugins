/**
 * Headless Google Analytics — wpts Plugin
 *
 * Google Analytics (GA4) with WooCommerce integration and Measurement Protocol
 * for headless WordPress stores. Provides the Measurement ID for frontend
 * gtag.js initialization and server-side purchase event tracking.
 *
 * Build: npx wpts build src/plugin.ts -o dist --clean
 */

import { Activate, AdminPage, Deactivate, Plugin, Setting } from 'wpts';
import './server-tracking.js';
import './diagnostics-routes.js';

@Plugin({
  name: 'Headless Google Analytics',
  uri: 'https://github.com/AmitGurbani/wordpress-plugins',
  description:
    'Google Analytics (GA4) with WooCommerce integration and Measurement Protocol for headless WordPress.',
  version: '1.1.0',
  author: 'Amit Gurbani',
  authorUri: 'https://github.com/AmitGurbani',
  license: 'GPL-2.0+',
  textDomain: 'headless-google-analytics',
  githubRepo: 'AmitGurbani/wordpress-plugins',
  requiresWP: '6.0',
  requiresPHP: '8.0',
  wooNotice: 'recommended',
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
    exposeInConfig: true,
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
    wooCurrencyDefault: true,
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
