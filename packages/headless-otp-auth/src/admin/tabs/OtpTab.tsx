import { TextControl, Button, ToggleControl, __experimentalNumberControl as NumberControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import type { TabProps, TestOtpData } from '../types';

interface OtpTabProps extends TabProps {
  testOtp: TestOtpData | null;
  fetchTestOtp: () => void;
}

export function OtpTab({ settings, update, testOtp, fetchTestOtp }: OtpTabProps) {
  return (
    <div style={{ padding: '16px 0' }}>
      <ToggleControl
        label={__('Test Mode', 'headless-otp-auth')}
        help={settings.otp_test_mode
          ? __('Test mode is ON. OTPs will not be delivered — check below for the generated code.', 'headless-otp-auth')
          : __('Enable to skip OTP delivery and display the generated code here for testing.', 'headless-otp-auth')
        }
        checked={settings.otp_test_mode}
        onChange={(v: boolean) => {
          update('otp_test_mode', v);
          if (v) fetchTestOtp();
        }}
      />
      {settings.otp_test_mode && (
        <div style={{ background: '#fff8e1', border: '1px solid #ffcc02', borderRadius: '4px', padding: '12px 16px', marginBottom: '16px' }}>
          <strong>{__('Test Mode Active', 'headless-otp-auth')}</strong>
          {testOtp && testOtp.otp ? (
            <div style={{ marginTop: '8px' }}>
              <div>{__('Phone:', 'headless-otp-auth')} <code>{testOtp.phone}</code></div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', letterSpacing: '4px', margin: '8px 0' }}>{testOtp.otp}</div>
            </div>
          ) : (
            <p style={{ margin: '8px 0 0' }}>{__('No test OTP generated yet. Send an OTP via the API to see it here.', 'headless-otp-auth')}</p>
          )}
          <Button variant="secondary" onClick={fetchTestOtp} style={{ marginTop: '8px' }}>
            {__('Refresh', 'headless-otp-auth')}
          </Button>
        </div>
      )}
      <TextControl
        label={__('OTP Server URL', 'headless-otp-auth')}
        help={__('URL of your external server that delivers OTPs via SMS/WhatsApp.', 'headless-otp-auth')}
        value={settings.otp_server_url}
        onChange={(v) => update('otp_server_url', v)}
      />
      <TextControl
        label={__('OTP Server API Key', 'headless-otp-auth')}
        help={__('API key for authenticating with the OTP delivery server.', 'headless-otp-auth')}
        value={settings.otp_server_api_key}
        onChange={(v) => update('otp_server_api_key', v)}
        type="password"
      />
      <NumberControl
        label={__('OTP Length', 'headless-otp-auth')}
        help={__('Number of digits in the generated OTP.', 'headless-otp-auth')}
        value={settings.otp_length}
        onChange={(v: string | undefined) => update('otp_length', v ? parseInt(v, 10) : 6)}
        min={4}
        max={8}
      />
      <NumberControl
        label={__('OTP Expiry (seconds)', 'headless-otp-auth')}
        help={__('How long an OTP remains valid. Default: 300 (5 minutes).', 'headless-otp-auth')}
        value={settings.otp_expiry}
        onChange={(v: string | undefined) => update('otp_expiry', v ? parseInt(v, 10) : 300)}
        min={60}
        max={3600}
      />
      <NumberControl
        label={__('Max OTP Attempts', 'headless-otp-auth')}
        help={__('Maximum OTP send attempts per phone number before rate limiting.', 'headless-otp-auth')}
        value={settings.max_otp_attempts}
        onChange={(v: string | undefined) => update('max_otp_attempts', v ? parseInt(v, 10) : 3)}
        min={1}
        max={10}
      />
    </div>
  );
}
