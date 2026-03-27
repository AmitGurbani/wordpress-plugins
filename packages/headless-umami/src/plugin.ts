/**
 * Headless Umami — wpts Plugin
 *
 * Umami Analytics with WooCommerce purchase tracking
 * for headless WordPress stores. Provides a REST endpoint for frontend
 * script configuration and server-side purchase event forwarding.
 *
 * Build: npx wpts build src/plugin.ts -o dist --clean
 */

import { Activate, AdminPage, Deactivate, Plugin, Setting } from 'wpts';
import './server-tracking.js';
import './config-routes.js';
import './diagnostics-routes.js';

@Plugin({
  name: 'Headless Umami',
  description: 'Umami Analytics with WooCommerce purchase tracking for headless WordPress.',
  version: '1.0.0',
  author: 'wpts',
  license: 'GPL-2.0+',
  textDomain: 'headless-umami',
  requiresWP: '6.0',
  requiresPHP: '8.0',
  wooNotice: 'recommended',
})
@AdminPage({
  pageTitle: 'Headless Umami Settings',
  menuTitle: 'Umami Analytics',
  capability: 'manage_options',
  menuSlug: 'headless-umami-settings',
  iconUrl: 'dashicons-chart-bar',
})
class HeadlessUmami {
  // ── General Settings ──────────────────────────────────────────────────

  @Setting({
    key: 'umami_url',
    type: 'string',
    default: '',
    label: 'Umami URL',
    description: 'Your Umami instance URL (e.g., https://cloud.umami.is or self-hosted URL).',
  })
  umamiUrl: string = '';

  @Setting({
    key: 'website_id',
    type: 'string',
    default: '',
    label: 'Website ID',
    description: 'Your Umami website ID (UUID format).',
  })
  websiteId: string = '';

  @Setting({
    key: 'enable_purchase',
    type: 'boolean',
    default: true,
    label: 'Track Purchase',
    description: 'Auto-send purchase events via WooCommerce hooks.',
  })
  enablePurchase: boolean = true;

  // ── Lifecycle ─────────────────────────────────────────────────────────

  @Activate()
  onActivation(): void {
    updateOption('headless_umami_version', '1.0.0');
  }

  @Deactivate()
  onDeactivation(): void {
    // Preserve settings on deactivation
  }
}
