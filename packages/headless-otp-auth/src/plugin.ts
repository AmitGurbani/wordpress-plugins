/**
 * Headless OTP Auth — wpts Plugin
 *
 * Mobile OTP-based authentication with JWT for headless WordPress stores.
 * Generates OTPs locally, delivers via external server, issues JWT tokens.
 *
 * Build: npx wpts build src/plugin.ts -o dist --clean
 */

import { Plugin, Setting, AdminPage, Activate, Deactivate, Action, Filter } from 'wpts';
import './jwt.js';
import './otp-routes.js';
import './auth-routes.js';

@Plugin({
  name: 'Headless OTP Auth',
  description: 'Mobile OTP authentication with JWT for headless WordPress stores.',
  version: '1.0.0',
  author: 'wpts',
  license: 'GPL-2.0+',
  textDomain: 'headless-otp-auth',
})
@AdminPage({
  pageTitle: 'Headless OTP Auth Settings',
  menuTitle: 'OTP Auth',
  capability: 'manage_options',
  menuSlug: 'headless-otp-auth-settings',
  iconUrl: 'dashicons-smartphone',
})
class HeadlessOtpAuth {

  // ── Settings ──────────────────────────────────────────────────────────

  @Setting({
    key: 'otp_test_mode',
    type: 'boolean',
    default: false,
    label: 'Test Mode',
    description: 'Skip OTP delivery and display generated OTP in admin settings for testing.',
  })
  otpTestMode: boolean = false;

  @Setting({
    key: 'otp_server_url',
    type: 'string',
    default: '',
    label: 'OTP Server URL',
    description: 'URL of the external server that delivers OTPs via SMS/WhatsApp.',
  })
  otpServerUrl: string = '';

  @Setting({
    key: 'otp_server_api_key',
    type: 'string',
    default: '',
    label: 'OTP Server API Key',
    description: 'API key for authenticating with the OTP delivery server.',
  })
  otpServerApiKey: string = '';

  @Setting({
    key: 'otp_length',
    type: 'number',
    default: 6,
    label: 'OTP Length',
    description: 'Number of digits in the generated OTP.',
  })
  otpLength: number = 6;

  @Setting({
    key: 'otp_expiry',
    type: 'number',
    default: 300,
    label: 'OTP Expiry (seconds)',
    description: 'How long an OTP remains valid. Default: 300 (5 minutes).',
  })
  otpExpiry: number = 300;

  @Setting({
    key: 'max_otp_attempts',
    type: 'number',
    default: 3,
    label: 'Max OTP Attempts',
    description: 'Maximum OTP send attempts per phone number before rate limiting.',
  })
  maxOtpAttempts: number = 3;

  @Setting({
    key: 'jwt_access_expiry',
    type: 'number',
    default: 3600,
    label: 'Access Token Expiry (seconds)',
    description: 'JWT access token lifetime. Default: 3600 (1 hour).',
  })
  jwtAccessExpiry: number = 3600;

  @Setting({
    key: 'jwt_refresh_expiry',
    type: 'number',
    default: 604800,
    label: 'Refresh Token Expiry (seconds)',
    description: 'JWT refresh token lifetime. Default: 604800 (7 days).',
  })
  jwtRefreshExpiry: number = 604800;

  @Setting({
    key: 'allowed_origins',
    type: 'string',
    default: '',
    label: 'Allowed Origins',
    description: 'Comma-separated list of allowed CORS origins (e.g., https://mystore.com).',
  })
  allowedOrigins: string = '';

  // ── Security ───────────────────────────────────────────────────────────

  @Setting({
    key: 'max_otp_verify_attempts',
    type: 'number',
    default: 3,
    label: 'Max OTP Verify Attempts',
    description: 'Maximum wrong OTP guesses before lockout. OWASP recommends 3.',
  })
  maxOtpVerifyAttempts: number = 3;

  @Setting({
    key: 'otp_resend_cooldown',
    type: 'number',
    default: 60,
    label: 'OTP Resend Cooldown (seconds)',
    description: 'Minimum wait time between OTP resend requests. Default: 60.',
  })
  otpResendCooldown: number = 60;

  @Setting({
    key: 'rate_limit_window',
    type: 'number',
    default: 900,
    label: 'Rate Limit Window (seconds)',
    description: 'How long OTP send rate limits persist. Default: 900 (15 minutes).',
  })
  rateLimitWindow: number = 900;

  // ── Registration ───────────────────────────────────────────────────────

  @Setting({
    key: 'enable_registration',
    type: 'boolean',
    default: true,
    label: 'Enable New User Registration',
    description: 'Allow new users to register via OTP. Disable to restrict to existing users only.',
  })
  enableRegistration: boolean = true;

  @Setting({
    key: 'default_user_role',
    type: 'string',
    default: 'subscriber',
    label: 'Default New User Role',
    description: 'WordPress role assigned to newly registered users.',
  })
  defaultUserRole: string = 'subscriber';

  // ── Admin Notices ────────────────────────────────────────────────────

  @Action('admin_notices')
  testModeNotice(): void {
    const testMode: string = getOption('headless_otp_auth_otp_test_mode', '');
    if (testMode === '1') {
      echo('<div class="notice notice-warning"><p><strong>Headless OTP Auth:</strong> ');
      echo(escHtml__('Test Mode is enabled. OTPs will not be delivered to users.', 'headless-otp-auth'));
      echo('</p></div>');
    }
  }

  // ── Dynamic Defaults ─────────────────────────────────────────────────

  @Filter('default_option_headless_otp_auth_default_user_role', { priority: 11 })
  filterDefaultUserRole(defaultValue: string): string {
    if (classExists('WooCommerce')) {
      return 'customer';
    }
    return defaultValue;
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────

  @Activate()
  onActivation(): void {
    const existingSecret: string = getOption('headless_otp_auth_jwt_secret_key', '');
    if (!existingSecret) {
      const secret: string = wpGeneratePassword(64, true, true);
      updateOption('headless_otp_auth_jwt_secret_key', secret);
    }
  }

  @Deactivate()
  onDeactivation(): void {
    // Nothing to clean up on deactivation
  }
}
