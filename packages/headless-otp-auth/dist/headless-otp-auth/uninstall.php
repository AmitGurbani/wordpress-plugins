<?php

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

delete_option( 'headless_otp_auth_otp_test_mode' );
delete_option( 'headless_otp_auth_otp_server_url' );
delete_option( 'headless_otp_auth_otp_server_api_key' );
delete_option( 'headless_otp_auth_otp_length' );
delete_option( 'headless_otp_auth_otp_expiry' );
delete_option( 'headless_otp_auth_max_otp_attempts' );
delete_option( 'headless_otp_auth_jwt_access_expiry' );
delete_option( 'headless_otp_auth_jwt_refresh_expiry' );
delete_option( 'headless_otp_auth_allowed_origins' );
delete_option( 'headless_otp_auth_max_otp_verify_attempts' );
delete_option( 'headless_otp_auth_otp_resend_cooldown' );
delete_option( 'headless_otp_auth_rate_limit_window' );
delete_option( 'headless_otp_auth_enable_registration' );
delete_option( 'headless_otp_auth_default_user_role' );
delete_option( 'headless_otp_auth_jwt_secret_key' );
