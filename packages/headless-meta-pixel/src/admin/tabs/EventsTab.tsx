import { ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import type { TabProps } from '../types';

export function EventsTab({ settings, update }: TabProps) {
  return (
    <div style={{ padding: '16px 0', maxWidth: '600px' }}>
      <p style={{ color: '#666', marginBottom: '16px' }}>
        {__(
          'Browser-side pixel events are handled by your frontend app. These toggles control which events the plugin accepts via the /track REST endpoint and forwards to Meta Conversions API.',
          'headless-meta-pixel',
        )}
      </p>

      <ToggleControl
        label={__('Enable Conversions API', 'headless-meta-pixel')}
        help={__(
          'Master switch for server-side event sending via Meta Conversions API.',
          'headless-meta-pixel',
        )}
        checked={settings.enable_capi}
        onChange={(v) => update('enable_capi', v)}
      />

      <hr style={{ margin: '16px 0' }} />

      <h3 style={{ marginBottom: '12px' }}>{__('Event Types', 'headless-meta-pixel')}</h3>

      <ToggleControl
        label={__('ViewContent', 'headless-meta-pixel')}
        help={__('Product page views.', 'headless-meta-pixel')}
        checked={settings.enable_view_content}
        onChange={(v) => update('enable_view_content', v)}
      />
      <ToggleControl
        label={__('AddToCart', 'headless-meta-pixel')}
        help={__('Add to cart actions.', 'headless-meta-pixel')}
        checked={settings.enable_add_to_cart}
        onChange={(v) => update('enable_add_to_cart', v)}
      />
      <ToggleControl
        label={__('InitiateCheckout', 'headless-meta-pixel')}
        help={__('Checkout page visits.', 'headless-meta-pixel')}
        checked={settings.enable_initiate_checkout}
        onChange={(v) => update('enable_initiate_checkout', v)}
      />
      <ToggleControl
        label={__('Purchase', 'headless-meta-pixel')}
        help={__(
          'Order completions. Automatically sent server-side via WooCommerce hooks.',
          'headless-meta-pixel',
        )}
        checked={settings.enable_purchase}
        onChange={(v) => update('enable_purchase', v)}
      />
      <ToggleControl
        label={__('Search', 'headless-meta-pixel')}
        help={__('Search queries.', 'headless-meta-pixel')}
        checked={settings.enable_search}
        onChange={(v) => update('enable_search', v)}
      />
    </div>
  );
}
