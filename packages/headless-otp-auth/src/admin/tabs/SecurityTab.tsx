import { __experimentalNumberControl as NumberControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import type { TabProps } from '../types';

export function SecurityTab({ settings, update }: TabProps) {
  return (
    <div style={{ padding: '16px 0' }}>
      <NumberControl
        label={__('Max OTP Verify Attempts', 'headless-otp-auth')}
        help={__('Maximum wrong OTP guesses before lockout. OWASP recommends 3.', 'headless-otp-auth')}
        value={settings.max_otp_verify_attempts}
        onChange={(v: string | undefined) => update('max_otp_verify_attempts', v ? parseInt(v, 10) : 3)}
        min={1}
        max={10}
      />
      <NumberControl
        label={__('OTP Resend Cooldown (seconds)', 'headless-otp-auth')}
        help={__('Minimum wait time between OTP resend requests.', 'headless-otp-auth')}
        value={settings.otp_resend_cooldown}
        onChange={(v: string | undefined) => update('otp_resend_cooldown', v ? parseInt(v, 10) : 60)}
        min={10}
        max={300}
      />
      <NumberControl
        label={__('Rate Limit Window (seconds)', 'headless-otp-auth')}
        help={__('How long OTP send rate limits persist. Default: 900 (15 minutes).', 'headless-otp-auth')}
        value={settings.rate_limit_window}
        onChange={(v: string | undefined) => update('rate_limit_window', v ? parseInt(v, 10) : 900)}
        min={60}
        max={3600}
      />
    </div>
  );
}
