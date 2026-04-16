/**
 * Headless Clarity — wpts Plugin
 *
 * Microsoft Clarity session recordings and heatmaps
 * for headless WordPress stores. Provides a REST endpoint for frontend
 * script configuration and optional user identification.
 *
 * Build: npx wpts build src/plugin.ts -o dist --clean
 */

import { Activate, AdminPage, Deactivate, Plugin, Setting } from 'wpts';
import './config-routes.js';
import './diagnostics-routes.js';

@Plugin({
  name: 'Headless Clarity',
  uri: 'https://github.com/AmitGurbani/wordpress-plugins',
  description: 'Microsoft Clarity session recordings and heatmaps for headless WordPress.',
  version: '1.0.0',
  author: 'Amit Gurbani',
  authorUri: 'https://github.com/AmitGurbani',
  license: 'GPL-2.0+',
  textDomain: 'headless-clarity',
  githubRepo: 'AmitGurbani/wordpress-plugins',
  requiresWP: '6.0',
  requiresPHP: '8.0',
})
@AdminPage({
  pageTitle: 'Headless Clarity Settings',
  menuTitle: 'Microsoft Clarity',
  capability: 'manage_options',
  menuSlug: 'headless-clarity-settings',
  iconUrl: 'dashicons-visibility',
})
class HeadlessClarity {
  // ── General Settings ──────────────────────────────────────────────────

  @Setting({
    key: 'project_id',
    type: 'string',
    default: '',
    label: 'Clarity Project ID',
    description:
      'Your Microsoft Clarity project ID (10-character alphanumeric string from Settings > Overview).',
  })
  projectId: string = '';

  @Setting({
    key: 'enable_identify',
    type: 'boolean',
    default: true,
    label: 'Enable user identification',
    description: 'Expose logged-in user info via the /config endpoint for Clarity identify() API.',
  })
  enableIdentify: boolean = true;

  // ── Lifecycle ─────────────────────────────────────────────────────────

  @Activate()
  onActivation(): void {
    updateOption('headless_clarity_version', '1.0.0');
  }

  @Deactivate()
  onDeactivation(): void {
    // Preserve settings on deactivation
  }
}
