import { TextControl, ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import type { TabProps } from '../types';

export function GeneralTab({ settings, update }: TabProps) {
  return (
    <div style={{ padding: '16px 0', maxWidth: '600px' }}>
      <TextControl
        label={__('Clarity Project ID', 'headless-clarity')}
        help={__(
          'Your Microsoft Clarity project ID (10-character alphanumeric string). Found in Settings > Overview in the Clarity dashboard.',
          'headless-clarity',
        )}
        value={settings.project_id}
        onChange={(v) => update('project_id', v)}
        placeholder="abcdefghij"
      />

      <hr style={{ margin: '16px 0' }} />

      <ToggleControl
        label={__('Enable User Identification', 'headless-clarity')}
        help={__(
          "Expose logged-in user info (ID and display name) via the /config endpoint for Clarity's identify() API.",
          'headless-clarity',
        )}
        checked={settings.enable_identify}
        onChange={(v) => update('enable_identify', v)}
      />
    </div>
  );
}
