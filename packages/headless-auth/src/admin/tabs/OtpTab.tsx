import {
  Button,
  __experimentalNumberControl as NumberControl,
  TextControl,
  ToggleControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { AlertBox, FormSection, InfoPopover } from 'admin-ui';
import type { TabProps, TestOtpData } from '../types';

interface OtpTabProps extends TabProps {
  testOtp: TestOtpData | null;
  fetchTestOtp: () => void;
}

function PlaceholderHelp({ example }: { example: string }) {
  return (
    <InfoPopover label={__('Placeholder reference', 'headless-auth')}>
      <strong>{__('Available Placeholders', 'headless-auth')}</strong>
      <table style={{ marginTop: '8px', borderCollapse: 'collapse', width: '100%' }}>
        <tbody>
          <tr>
            <td>
              <code>{'{{phone}}'}</code>
            </td>
            <td>{__("User's phone number", 'headless-auth')}</td>
          </tr>
          <tr>
            <td>
              <code>{'{{otp}}'}</code>
            </td>
            <td>{__('Generated OTP code', 'headless-auth')}</td>
          </tr>
          <tr>
            <td>
              <code>{'{{siteName}}'}</code>
            </td>
            <td>{__('WordPress site title', 'headless-auth')}</td>
          </tr>
          <tr>
            <td>
              <code>{'{{siteUrl}}'}</code>
            </td>
            <td>{__('WordPress site URL', 'headless-auth')}</td>
          </tr>
        </tbody>
      </table>
      <div style={{ marginTop: '10px' }}>
        <strong>{__('Example:', 'headless-auth')}</strong>
        <code
          style={{
            display: 'block',
            marginTop: '4px',
            padding: '6px 8px',
            background: '#f0f0f0',
            borderRadius: '3px',
            wordBreak: 'break-all',
          }}
        >
          {example}
        </code>
      </div>
    </InfoPopover>
  );
}

export function OtpTab({ settings, update, testOtp, fetchTestOtp }: OtpTabProps) {
  return (
    <FormSection narrow={false}>
      <ToggleControl
        label={__('Test Mode', 'headless-auth')}
        help={
          settings.otp_test_mode
            ? __(
                'Test mode is ON. OTPs will not be delivered — check below for the generated code.',
                'headless-auth',
              )
            : __(
                'Enable to skip OTP delivery and display the generated code here for testing.',
                'headless-auth',
              )
        }
        checked={settings.otp_test_mode}
        onChange={(v: boolean) => {
          update('otp_test_mode', v);
          if (v) fetchTestOtp();
        }}
      />
      {settings.otp_test_mode && (
        <AlertBox variant="warning" title={__('Test Mode Active', 'headless-auth')}>
          {testOtp?.otp ? (
            <div style={{ marginTop: '8px' }}>
              <div>
                {__('Phone:', 'headless-auth')} <code>{testOtp.phone}</code>
              </div>
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  letterSpacing: '4px',
                  margin: '8px 0',
                }}
              >
                {testOtp.otp}
              </div>
            </div>
          ) : (
            <p style={{ margin: '8px 0 0' }}>
              {__(
                'No test OTP generated yet. Send an OTP via the API to see it here.',
                'headless-auth',
              )}
            </p>
          )}
          <Button variant="secondary" onClick={fetchTestOtp} style={{ marginTop: '8px' }}>
            {__('Refresh', 'headless-auth')}
          </Button>
        </AlertBox>
      )}
      <TextControl
        label={__('OTP Server URL', 'headless-auth')}
        help={__(
          'URL of your external server that delivers OTPs via SMS/WhatsApp.',
          'headless-auth',
        )}
        value={settings.otp_server_url}
        onChange={(v) => update('otp_server_url', v)}
      />
      <TextControl
        label={
          <>
            {__('OTP Server Headers Template', 'headless-auth')}
            <PlaceholderHelp example='{"X-API-Key":"your-api-key","X-Store":"{{siteName}}"}' />
          </>
        }
        help={__('JSON template for custom HTTP headers.', 'headless-auth')}
        value={settings.otp_server_headers_template}
        onChange={(v) => update('otp_server_headers_template', v)}
      />
      <TextControl
        label={
          <>
            {__('OTP Server Payload Template', 'headless-auth')}
            <PlaceholderHelp example='{"phoneNumber":"{{phone}}","var1":{{otp}},"var2":"{{siteName}}"}' />
          </>
        }
        help={__('JSON template for the request body.', 'headless-auth')}
        value={settings.otp_server_payload_template}
        onChange={(v) => update('otp_server_payload_template', v)}
      />
      <NumberControl
        label={__('OTP Length', 'headless-auth')}
        help={__('Number of digits in the generated OTP.', 'headless-auth')}
        value={settings.otp_length}
        onChange={(v: string | undefined) => update('otp_length', v ? parseInt(v, 10) : 6)}
        min={4}
        max={8}
      />
      <NumberControl
        label={__('OTP Expiry (seconds)', 'headless-auth')}
        help={__('How long an OTP remains valid. Default: 300 (5 minutes).', 'headless-auth')}
        value={settings.otp_expiry}
        onChange={(v: string | undefined) => update('otp_expiry', v ? parseInt(v, 10) : 300)}
        min={60}
        max={3600}
      />
      <NumberControl
        label={__('Max OTP Attempts', 'headless-auth')}
        help={__(
          'Maximum OTP send attempts per phone number before rate limiting.',
          'headless-auth',
        )}
        value={settings.max_otp_attempts}
        onChange={(v: string | undefined) => update('max_otp_attempts', v ? parseInt(v, 10) : 3)}
        min={1}
        max={10}
      />
    </FormSection>
  );
}
