import { ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import type { TabProps } from '../types';

export function EventsTab({ settings, update }: TabProps) {
  return (
    <div style={{ padding: '16px 0', maxWidth: '600px' }}>
      <p style={{ color: '#666', marginBottom: '16px' }}>
        {__('Browser-side gtag.js events are handled by your frontend app. These toggles control which events the plugin accepts via the /track REST endpoint and forwards to GA4 via the Measurement Protocol.', 'headless-google-analytics')}
      </p>

      <ToggleControl
        label={__('view_item', 'headless-google-analytics')}
        help={__('Product page views.', 'headless-google-analytics')}
        checked={settings.enable_view_item}
        onChange={(v) => update('enable_view_item', v)}
      />
      <ToggleControl
        label={__('add_to_cart', 'headless-google-analytics')}
        help={__('Add to cart actions.', 'headless-google-analytics')}
        checked={settings.enable_add_to_cart}
        onChange={(v) => update('enable_add_to_cart', v)}
      />
      <ToggleControl
        label={__('begin_checkout', 'headless-google-analytics')}
        help={__('Checkout page visits.', 'headless-google-analytics')}
        checked={settings.enable_begin_checkout}
        onChange={(v) => update('enable_begin_checkout', v)}
      />
      <ToggleControl
        label={__('purchase', 'headless-google-analytics')}
        help={__('Order completions. Automatically sent server-side via WooCommerce hooks.', 'headless-google-analytics')}
        checked={settings.enable_purchase}
        onChange={(v) => update('enable_purchase', v)}
      />
      <ToggleControl
        label={__('search', 'headless-google-analytics')}
        help={__('Search queries.', 'headless-google-analytics')}
        checked={settings.enable_search}
        onChange={(v) => update('enable_search', v)}
      />
    </div>
  );
}
