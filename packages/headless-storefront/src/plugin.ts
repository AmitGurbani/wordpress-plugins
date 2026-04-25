/**
 * Headless Storefront — wpts Plugin
 *
 * Store branding and configuration for headless WordPress with WooCommerce.
 * Single WP option stores all settings; public REST API serves the frontend.
 *
 * Build: npx wpts build src/plugin.ts -o dist --clean
 */

import { Activate, AdminPage, Plugin } from '@amitgurbani/wpts';
import './config-routes.js';
import './revalidate-hooks.js';

@Plugin({
  name: 'Headless Storefront',
  uri: 'https://github.com/AmitGurbani/wordpress-plugins',
  description: 'Store branding and configuration REST API for headless WordPress with WooCommerce.',
  version: '1.4.0',
  author: 'Amit Gurbani',
  authorUri: 'https://github.com/AmitGurbani',
  license: 'GPL-2.0+',
  textDomain: 'headless-storefront',
  requiresWP: '6.8',
  requiresPHP: '8.2',
  wooNotice: 'required',
})
@AdminPage({
  pageTitle: 'Headless Storefront Settings',
  menuTitle: 'Headless Storefront',
  capability: 'manage_options',
  menuSlug: 'headless-storefront-settings',
  parentSlug: 'options-general.php',
})
class HeadlessStorefront {
  @Activate()
  onActivation(): void {
    // Seed the Default theme preset (colors + font + tokens).
    // Other fields (app_name, contact, etc.) remain unset until the user configures them.
    addOption('headless_storefront_config', {
      colors: { primary: '#6366f1', secondary: '#64748b', accent: '#94a3b8' },
      font_family: 'Inter',
      tokens: {
        section_gap: '2rem',
        card_padding: '0.75rem',
        card_radius: '0.75rem',
        button_radius: '0.5rem',
        image_radius: '0.5rem',
        card_shadow: 'none',
        card_hover_shadow: '0 4px 12px oklch(0 0 0 / 0.1)',
        hover_duration: '150ms',
      },
    });
  }
}
