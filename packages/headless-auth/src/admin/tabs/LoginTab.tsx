import { __experimentalNumberControl as NumberControl, ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { FormSection } from 'admin-ui';
import type { TabProps } from '../types';

export function LoginTab({ settings, update }: TabProps) {
  return (
    <FormSection narrow={false}>
      <ToggleControl
        label={__('Enable Password Login', 'headless-auth')}
        help={__('Allow users to log in with username/email and password.', 'headless-auth')}
        checked={settings.enable_password_login}
        onChange={(v: boolean) => update('enable_password_login', v)}
      />
      <NumberControl
        label={__('Max Login Attempts', 'headless-auth')}
        help={__(
          'Maximum failed password login attempts before rate limiting. Default: 5.',
          'headless-auth',
        )}
        value={settings.max_login_attempts}
        onChange={(v: string | undefined) => update('max_login_attempts', v ? parseInt(v, 10) : 5)}
        min={1}
        max={20}
      />
    </FormSection>
  );
}
