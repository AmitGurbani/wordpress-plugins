<?php

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

delete_option( 'headless_auth_otp_test_mode' );
delete_option( 'headless_auth_otp_server_url' );
delete_option( 'headless_auth_otp_server_headers_template' );
delete_option( 'headless_auth_otp_server_payload_template' );
delete_option( 'headless_auth_otp_length' );
delete_option( 'headless_auth_otp_expiry' );
delete_option( 'headless_auth_max_otp_attempts' );
delete_option( 'headless_auth_jwt_access_expiry' );
delete_option( 'headless_auth_jwt_refresh_expiry' );
delete_option( 'headless_auth_allowed_origins' );
delete_option( 'headless_auth_max_otp_verify_attempts' );
delete_option( 'headless_auth_otp_resend_cooldown' );
delete_option( 'headless_auth_rate_limit_window' );
delete_option( 'headless_auth_enable_registration' );
delete_option( 'headless_auth_default_user_role' );
delete_option( 'headless_auth_enable_password_login' );
delete_option( 'headless_auth_max_login_attempts' );
delete_option( 'headless_auth_jwt_secret_key' );
