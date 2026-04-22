<?php

if ( ! defined( 'WPINC' ) ) {
	die;
}

class Headless_Auth_Admin {

	private $plugin_name;
	private $version;

	public function __construct( $plugin_name, $version ) {
		$this->plugin_name = $plugin_name;
		$this->version     = $version;
	}

	public function register_admin_pages() {
		add_menu_page(
			'Headless Auth Settings',
			'Auth',
			'manage_options',
			'headless-auth-settings',
			array( $this, 'render_admin_page' ),
			'dashicons-admin-users',
			null
		);
	}

	public function render_admin_page() {
		$screen = get_current_screen();
		$page   = $screen ? $screen->id : '';
		echo '<div id="headless-auth-admin-app" data-page="' . esc_attr( $page ) . '"></div>';
	}

	public function enqueue_admin_assets( $hook_suffix ) {
		$admin_pages = array(
			'toplevel_page_headless-auth-settings',
		);

		if ( ! in_array( $hook_suffix, $admin_pages, true ) ) {
			return;
		}

		$asset_file = HEADLESS_AUTH_PLUGIN_DIR . 'admin/js/build/index.asset.php';

		if ( ! file_exists( $asset_file ) ) {
			return;
		}

		$asset = require $asset_file;

		wp_enqueue_script(
			'headless-auth-admin',
			HEADLESS_AUTH_PLUGIN_URL . 'admin/js/build/index.js',
			$asset['dependencies'],
			$asset['version'],
			true
		);

		if ( file_exists( HEADLESS_AUTH_PLUGIN_DIR . 'admin/js/build/index.css' ) ) {
			wp_enqueue_style(
				'headless-auth-admin',
				HEADLESS_AUTH_PLUGIN_URL . 'admin/js/build/index.css',
				array( 'wp-components' ),
				$asset['version']
			);
		}

		wp_enqueue_style( 'wp-components' );
	}

	public function register_settings() {
		register_setting(
			'headless-auth_options',
			'headless_auth_otp_test_mode',
			array(
				'type'    => 'boolean',
				'default' => false,
				'sanitize_callback' => 'rest_sanitize_boolean',
			)
		);
		register_setting(
			'headless-auth_options',
			'headless_auth_otp_server_url',
			array(
				'type'    => 'string',
				'default' => '',
				'sanitize_callback' => 'esc_url_raw',
			)
		);
		register_setting(
			'headless-auth_options',
			'headless_auth_otp_server_headers_template',
			array(
				'type'    => 'string',
				'default' => '{}',
				'sanitize_callback' => 'sanitize_textarea_field',
			)
		);
		register_setting(
			'headless-auth_options',
			'headless_auth_otp_server_payload_template',
			array(
				'type'    => 'string',
				'default' => '{}',
				'sanitize_callback' => 'sanitize_textarea_field',
			)
		);
		register_setting(
			'headless-auth_options',
			'headless_auth_otp_length',
			array(
				'type'    => 'number',
				'default' => 6,
				'sanitize_callback' => 'absint',
			)
		);
		register_setting(
			'headless-auth_options',
			'headless_auth_otp_expiry',
			array(
				'type'    => 'number',
				'default' => 300,
				'sanitize_callback' => 'absint',
			)
		);
		register_setting(
			'headless-auth_options',
			'headless_auth_max_otp_attempts',
			array(
				'type'    => 'number',
				'default' => 3,
				'sanitize_callback' => 'absint',
			)
		);
		register_setting(
			'headless-auth_options',
			'headless_auth_jwt_access_expiry',
			array(
				'type'    => 'number',
				'default' => 3600,
				'sanitize_callback' => 'absint',
			)
		);
		register_setting(
			'headless-auth_options',
			'headless_auth_jwt_refresh_expiry',
			array(
				'type'    => 'number',
				'default' => 604800,
				'sanitize_callback' => 'absint',
			)
		);
		register_setting(
			'headless-auth_options',
			'headless_auth_allowed_origins',
			array(
				'type'    => 'string',
				'default' => '',
				'sanitize_callback' => 'sanitize_text_field',
			)
		);
		register_setting(
			'headless-auth_options',
			'headless_auth_max_otp_verify_attempts',
			array(
				'type'    => 'number',
				'default' => 3,
				'sanitize_callback' => 'absint',
			)
		);
		register_setting(
			'headless-auth_options',
			'headless_auth_otp_resend_cooldown',
			array(
				'type'    => 'number',
				'default' => 60,
				'sanitize_callback' => 'absint',
			)
		);
		register_setting(
			'headless-auth_options',
			'headless_auth_rate_limit_window',
			array(
				'type'    => 'number',
				'default' => 900,
				'sanitize_callback' => 'absint',
			)
		);
		register_setting(
			'headless-auth_options',
			'headless_auth_enable_registration',
			array(
				'type'    => 'boolean',
				'default' => true,
				'sanitize_callback' => 'rest_sanitize_boolean',
			)
		);
		register_setting(
			'headless-auth_options',
			'headless_auth_default_user_role',
			array(
				'type'    => 'string',
				'default' => 'subscriber',
				'sanitize_callback' => 'sanitize_text_field',
			)
		);
		register_setting(
			'headless-auth_options',
			'headless_auth_enable_password_login',
			array(
				'type'    => 'boolean',
				'default' => true,
				'sanitize_callback' => 'rest_sanitize_boolean',
			)
		);
		register_setting(
			'headless-auth_options',
			'headless_auth_max_login_attempts',
			array(
				'type'    => 'number',
				'default' => 5,
				'sanitize_callback' => 'absint',
			)
		);
	}

	public function test_mode_notice() {
		$test_mode = get_option( 'headless_auth_otp_test_mode', '' );
		if ( $test_mode === '1' ) {
			echo '<div class="notice notice-warning"><p><strong>Headless Auth:</strong> ';
			echo esc_html__( 'Test Mode is enabled. OTPs will not be delivered to users.', 'headless-auth' );
			echo '</p></div>';
		}
	}

}
