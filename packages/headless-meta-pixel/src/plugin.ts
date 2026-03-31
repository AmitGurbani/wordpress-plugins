/**
 * Headless Meta Pixel — wpts Plugin
 *
 * Meta Pixel with WooCommerce integration and Conversions API (CAPI)
 * for headless WordPress stores. Provides REST endpoints for frontend
 * pixel integration and server-side event forwarding.
 *
 * Build: npx wpts build src/plugin.ts -o dist --clean
 */

import { Activate, AdminPage, Deactivate, Plugin, Setting } from 'wpts';
import './capi.js';
import './track-routes.js';
import './diagnostics-routes.js';

@Plugin({
  name: 'Headless Meta Pixel',
  uri: 'https://github.com/AmitGurbani/wordpress-plugins',
  description:
    'Meta Pixel with WooCommerce integration and Conversions API for headless WordPress.',
  version: '1.0.0',
  author: 'Amit Gurbani',
  authorUri: 'https://github.com/AmitGurbani',
  license: 'GPL-2.0+',
  textDomain: 'headless-meta-pixel',
  requiresWP: '6.0',
  requiresPHP: '8.0',
  wooNotice: 'recommended',
})
@AdminPage({
  pageTitle: 'Headless Meta Pixel Settings',
  menuTitle: 'Meta Pixel',
  capability: 'manage_options',
  menuSlug: 'headless-meta-pixel-settings',
  iconUrl: 'dashicons-chart-area',
})
class MetaPixel {
  // ── General Settings ──────────────────────────────────────────────────

  @Setting({
    key: 'pixel_id',
    type: 'string',
    default: '',
    label: 'Meta Pixel ID',
    description: 'Your Meta Pixel ID from Events Manager.',
    exposeInConfig: true,
  })
  pixelId: string = '';

  @Setting({
    key: 'access_token',
    type: 'string',
    default: '',
    label: 'Conversions API Access Token',
    description: 'Server-side access token for Meta Conversions API.',
    sensitive: true,
  })
  accessToken: string = '';

  @Setting({
    key: 'test_event_code',
    type: 'string',
    default: '',
    label: 'Test Event Code',
    description: 'Test event code from Meta Events Manager. Remove for production.',
  })
  testEventCode: string = '';

  @Setting({
    key: 'currency',
    type: 'string',
    default: 'USD',
    label: 'Currency',
    description: 'Default currency for ecommerce events (ISO 4217).',
    wooCurrencyDefault: true,
  })
  currency: string = 'USD';

  // ── Event Toggles ─────────────────────────────────────────────────────

  @Setting({
    key: 'enable_view_content',
    type: 'boolean',
    default: true,
    label: 'Track ViewContent',
    description: 'Accept ViewContent events via the /track endpoint.',
  })
  enableViewContent: boolean = true;

  @Setting({
    key: 'enable_add_to_cart',
    type: 'boolean',
    default: true,
    label: 'Track AddToCart',
    description: 'Accept AddToCart events via the /track endpoint.',
  })
  enableAddToCart: boolean = true;

  @Setting({
    key: 'enable_initiate_checkout',
    type: 'boolean',
    default: true,
    label: 'Track InitiateCheckout',
    description: 'Accept InitiateCheckout events via the /track endpoint.',
  })
  enableInitiateCheckout: boolean = true;

  @Setting({
    key: 'enable_purchase',
    type: 'boolean',
    default: true,
    label: 'Track Purchase',
    description: 'Auto-send Purchase events via WooCommerce hooks.',
  })
  enablePurchase: boolean = true;

  @Setting({
    key: 'enable_search',
    type: 'boolean',
    default: true,
    label: 'Track Search',
    description: 'Accept Search events via the /track endpoint.',
  })
  enableSearch: boolean = true;

  @Setting({
    key: 'enable_capi',
    type: 'boolean',
    default: true,
    label: 'Enable Conversions API',
    description: 'Send server-side events to Meta via Conversions API.',
  })
  enableCapi: boolean = true;

  // ── Lifecycle ─────────────────────────────────────────────────────────

  @Activate()
  onActivation(): void {
    updateOption('headless_meta_pixel_version', '1.0.0');
  }

  @Deactivate()
  onDeactivation(): void {
    // Preserve settings on deactivation
  }
}
