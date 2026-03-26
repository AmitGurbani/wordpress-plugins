import { TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import type { TabProps } from '../types';

export function GeneralTab({ settings, update }: TabProps) {
  return (
    <div style={{ padding: '16px 0', maxWidth: '600px' }}>
      <TextControl
        label={__('Meta Pixel ID', 'headless-meta-pixel')}
        help={__(
          'Your Pixel ID from Meta Events Manager (numeric, 15-16 digits).',
          'headless-meta-pixel',
        )}
        value={settings.pixel_id}
        onChange={(v) => update('pixel_id', v)}
        placeholder="123456789012345"
      />
      <TextControl
        label={__('Conversions API Access Token', 'headless-meta-pixel')}
        help={__(
          'Server-side access token from Meta Events Manager. Never exposed to the browser.',
          'headless-meta-pixel',
        )}
        value={settings.access_token}
        onChange={(v) => update('access_token', v)}
        type="password"
      />
      <TextControl
        label={__('Test Event Code', 'headless-meta-pixel')}
        help={__(
          'Optional. Events with this code appear in Test Events tab in Events Manager. Remove for production.',
          'headless-meta-pixel',
        )}
        value={settings.test_event_code}
        onChange={(v) => update('test_event_code', v)}
        placeholder="TEST12345"
      />
      <TextControl
        label={__('Currency', 'headless-meta-pixel')}
        help={__(
          'Default currency code (ISO 4217). Auto-detected from WooCommerce if installed.',
          'headless-meta-pixel',
        )}
        value={settings.currency}
        onChange={(v) => update('currency', v)}
        placeholder="USD"
      />
    </div>
  );
}
