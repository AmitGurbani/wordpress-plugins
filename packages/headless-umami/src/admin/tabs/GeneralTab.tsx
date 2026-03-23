import { TextControl, ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import type { TabProps } from '../types';

export function GeneralTab({ settings, update }: TabProps) {
  return (
    <div style={{ padding: '16px 0', maxWidth: '600px' }}>
      <TextControl
        label={__('Umami URL', 'headless-umami')}
        help={__('Your Umami instance URL. Use https://cloud.umami.is for Umami Cloud, or your self-hosted URL.', 'headless-umami')}
        value={settings.umami_url}
        onChange={(v) => update('umami_url', v)}
        placeholder="https://cloud.umami.is"
      />
      <TextControl
        label={__('Website ID', 'headless-umami')}
        help={__('The website ID from your Umami dashboard (UUID format).', 'headless-umami')}
        value={settings.website_id}
        onChange={(v) => update('website_id', v)}
        placeholder="a1b2c3d4-e5f6-7890-abcd-ef1234567890"
      />

      <hr style={{ margin: '16px 0' }} />

      <ToggleControl
        label={__('Track Purchases', 'headless-umami')}
        help={__('Automatically send purchase events to Umami when WooCommerce orders are completed. No frontend code needed.', 'headless-umami')}
        checked={settings.enable_purchase}
        onChange={(v) => update('enable_purchase', v)}
      />
    </div>
  );
}
