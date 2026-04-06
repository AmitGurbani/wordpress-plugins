import { TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { FormSection } from 'admin-ui';
import type { TabProps } from '../types';

export function AdvancedTab({ settings, update }: TabProps) {
  return (
    <FormSection narrow={false}>
      <TextControl
        label={__('Allowed Origins', 'headless-auth')}
        help={__(
          'Comma-separated list of allowed CORS origins (e.g., https://mystore.com,https://admin.mystore.com).',
          'headless-auth',
        )}
        value={settings.allowed_origins}
        onChange={(v) => update('allowed_origins', v)}
      />
    </FormSection>
  );
}
