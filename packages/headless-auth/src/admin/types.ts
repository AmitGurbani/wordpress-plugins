import { __ } from '@wordpress/i18n';
import type { TabProps as GenericTabProps } from 'admin-ui';

export interface Settings {
  otp_test_mode: boolean;
  otp_server_url: string;
  otp_server_headers_template: string;
  otp_server_payload_template: string;
  otp_length: number;
  otp_expiry: number;
  max_otp_attempts: number;
  max_otp_verify_attempts: number;
  otp_resend_cooldown: number;
  rate_limit_window: number;
  jwt_access_expiry: number;
  jwt_refresh_expiry: number;
  allowed_origins: string;
  enable_registration: boolean;
  default_user_role: string;
  enable_password_login: boolean;
  max_login_attempts: number;
}

export interface TestOtpData {
  test_mode: boolean;
  otp?: string | null;
  phone?: string;
  created_at?: number;
}

export type TabProps = GenericTabProps<Settings>;

export const DEFAULTS: Settings = {
  otp_test_mode: false,
  otp_server_url: '',
  otp_server_headers_template: '{}',
  otp_server_payload_template: '{}',
  otp_length: 6,
  otp_expiry: 300,
  max_otp_attempts: 3,
  max_otp_verify_attempts: 3,
  otp_resend_cooldown: 60,
  rate_limit_window: 900,
  jwt_access_expiry: 3600,
  jwt_refresh_expiry: 604800,
  allowed_origins: '',
  enable_registration: true,
  default_user_role: 'subscriber',
  enable_password_login: true,
  max_login_attempts: 5,
};

export const TABS = [
  { name: 'otp', title: __('OTP', 'headless-auth') },
  { name: 'login', title: __('Login', 'headless-auth') },
  { name: 'security', title: __('Security', 'headless-auth') },
  { name: 'auth', title: __('Authentication', 'headless-auth') },
  { name: 'advanced', title: __('Advanced', 'headless-auth') },
];
