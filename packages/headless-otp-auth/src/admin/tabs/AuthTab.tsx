import {
  __experimentalNumberControl as NumberControl,
  SelectControl,
  ToggleControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { FormSection } from 'admin-ui';
import type { TabProps } from '../types';

export function AuthTab({ settings, update }: TabProps) {
  return (
    <FormSection narrow={false}>
      <NumberControl
        label={__('Access Token Expiry (seconds)', 'headless-otp-auth')}
        help={__('JWT access token lifetime. Default: 3600 (1 hour).', 'headless-otp-auth')}
        value={settings.jwt_access_expiry}
        onChange={(v: string | undefined) =>
          update('jwt_access_expiry', v ? parseInt(v, 10) : 3600)
        }
        min={300}
        max={86400}
      />
      <NumberControl
        label={__('Refresh Token Expiry (seconds)', 'headless-otp-auth')}
        help={__('JWT refresh token lifetime. Default: 604800 (7 days).', 'headless-otp-auth')}
        value={settings.jwt_refresh_expiry}
        onChange={(v: string | undefined) =>
          update('jwt_refresh_expiry', v ? parseInt(v, 10) : 604800)
        }
        min={3600}
        max={2592000}
      />
      <ToggleControl
        label={__('Enable New User Registration', 'headless-otp-auth')}
        help={__(
          'Allow new users to register via OTP. Disable to restrict to existing users only.',
          'headless-otp-auth',
        )}
        checked={settings.enable_registration}
        onChange={(v: boolean) => update('enable_registration', v)}
      />
      <SelectControl<string>
        label={__('Default New User Role', 'headless-otp-auth')}
        help={__('WordPress role assigned to newly registered users.', 'headless-otp-auth')}
        value={settings.default_user_role}
        options={[
          { label: __('Subscriber', 'headless-otp-auth'), value: 'subscriber' },
          { label: __('Customer', 'headless-otp-auth'), value: 'customer' },
          { label: __('Contributor', 'headless-otp-auth'), value: 'contributor' },
          { label: __('Author', 'headless-otp-auth'), value: 'author' },
          { label: __('Editor', 'headless-otp-auth'), value: 'editor' },
          { label: __('Administrator', 'headless-otp-auth'), value: 'administrator' },
        ]}
        onChange={(v) => update('default_user_role', v)}
      />
    </FormSection>
  );
}
