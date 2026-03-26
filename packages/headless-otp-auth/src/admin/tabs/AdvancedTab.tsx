import { TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import type { TabProps } from '../types';

export function AdvancedTab({ settings, update }: TabProps) {
  return (
    <div style={{ padding: '16px 0' }}>
      <TextControl
        label={__('Allowed Origins', 'headless-otp-auth')}
        help={__(
          'Comma-separated list of allowed CORS origins (e.g., https://mystore.com,https://admin.mystore.com).',
          'headless-otp-auth',
        )}
        value={settings.allowed_origins}
        onChange={(v) => update('allowed_origins', v)}
      />
    </div>
  );
}
