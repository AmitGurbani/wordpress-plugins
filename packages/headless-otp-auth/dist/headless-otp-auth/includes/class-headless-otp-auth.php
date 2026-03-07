<?php

if ( ! defined( 'WPINC' ) ) {
	die;
}

class Headless_Otp_Auth {

	protected $loader;
	protected $plugin_name;
	protected $version;

	public function __construct() {
		$this->version     = HEADLESS_OTP_AUTH_VERSION;
		$this->plugin_name = 'headless-otp-auth';
		$this->load_dependencies();
		$this->define_admin_hooks();
		$this->define_public_hooks();
	}

	private function load_dependencies() {
		require_once HEADLESS_OTP_AUTH_PLUGIN_DIR . 'includes/class-headless-otp-auth-loader.php';
		require_once HEADLESS_OTP_AUTH_PLUGIN_DIR . 'admin/class-headless-otp-auth-admin.php';
		require_once HEADLESS_OTP_AUTH_PLUGIN_DIR . 'public/class-headless-otp-auth-public.php';
		require_once HEADLESS_OTP_AUTH_PLUGIN_DIR . 'includes/class-headless-otp-auth-rest-api.php';
		$this->loader = new Headless_Otp_Auth_Loader();
	}

	private function define_admin_hooks() {
		$admin = new Headless_Otp_Auth_Admin( $this->plugin_name, $this->version );
		$this->loader->add_action( 'admin_menu', $admin, 'register_admin_pages' );
		$this->loader->add_action( 'admin_enqueue_scripts', $admin, 'enqueue_admin_assets' );
		$rest_api = new Headless_Otp_Auth_Rest_Api( 'headless-otp-auth' );
		$this->loader->add_action( 'rest_api_init', $rest_api, 'register_routes' );
		$this->loader->add_action( 'admin_init', $admin, 'register_settings' );
		$this->loader->add_action( 'admin_notices', $admin, 'test_mode_notice', 10, 0 );
	}

	private function define_public_hooks() {
		$public = new Headless_Otp_Auth_Public( $this->plugin_name, $this->version );
		$this->loader->add_action( 'init', $public, 'register_jwt_helper', 10, 0 );
		$this->loader->add_filter( 'rest_pre_serve_request', $public, 'handle_cors', 10, 1 );
		$this->loader->add_filter( 'determine_current_user', $public, 'authenticate_with_jwt', 20, 1 );
		$this->loader->add_filter( 'default_option_headless_otp_auth_default_user_role', $public, 'filter_default_user_role', 11, 1 );
	}

	public function run() {
		$this->loader->run();
	}

	public function get_plugin_name() {
		return $this->plugin_name;
	}

	public function get_version() {
		return $this->version;
	}
}
