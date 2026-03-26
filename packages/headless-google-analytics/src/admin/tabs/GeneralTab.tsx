import { TextControl, ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import type { TabProps } from '../types';

export function GeneralTab({ settings, update }: TabProps) {
  return (
    <div style={{ padding: '16px 0', maxWidth: '600px' }}>
      <TextControl
        label={__('Measurement ID', 'headless-google-analytics')}
        help={__(
          'Your GA4 Measurement ID from Google Analytics Admin > Data Streams (starts with G-).',
          'headless-google-analytics',
        )}
        value={settings.measurement_id}
        onChange={(v) => update('measurement_id', v)}
        placeholder="G-XXXXXXXXXX"
      />
      <TextControl
        label={__('API Secret', 'headless-google-analytics')}
        help={__(
          'Measurement Protocol API secret from GA4 Admin > Data Streams > Measurement Protocol API secrets. Never exposed to the browser.',
          'headless-google-analytics',
        )}
        value={settings.api_secret}
        onChange={(v) => update('api_secret', v)}
        type="password"
      />
      <TextControl
        label={__('Currency', 'headless-google-analytics')}
        help={__(
          'Default currency code (ISO 4217). Auto-detected from WooCommerce if installed.',
          'headless-google-analytics',
        )}
        value={settings.currency}
        onChange={(v) => update('currency', v)}
        placeholder="USD"
      />

      <hr style={{ margin: '16px 0' }} />

      <ToggleControl
        label={__('Track Purchases', 'headless-google-analytics')}
        help={__(
          'Automatically send purchase events to GA4 via WooCommerce order hooks. No frontend action required.',
          'headless-google-analytics',
        )}
        checked={settings.enable_purchase}
        onChange={(v) => update('enable_purchase', v)}
      />
    </div>
  );
}
