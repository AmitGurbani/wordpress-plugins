<?php

if ( ! defined( 'WPINC' ) ) {
	die;
}

class Headless_Clarity {

	protected $loader;
	protected $plugin_name;
	protected $version;

	public function __construct() {
		$this->version     = HEADLESS_CLARITY_VERSION;
		$this->plugin_name = 'headless-clarity';
		$this->load_dependencies();
		$this->define_admin_hooks();
		$this->define_public_hooks();
	}

	private function load_dependencies() {
		require_once HEADLESS_CLARITY_PLUGIN_DIR . 'includes/class-headless-clarity-loader.php';
		require_once HEADLESS_CLARITY_PLUGIN_DIR . 'admin/class-headless-clarity-admin.php';
		require_once HEADLESS_CLARITY_PLUGIN_DIR . 'public/class-headless-clarity-public.php';
		require_once HEADLESS_CLARITY_PLUGIN_DIR . 'includes/class-headless-clarity-rest-api.php';
		$this->loader = new Headless_Clarity_Loader();
	}

	private function define_admin_hooks() {
		$admin = new Headless_Clarity_Admin( $this->plugin_name, $this->version );
		$this->loader->add_action( 'admin_menu', $admin, 'register_admin_pages' );
		$this->loader->add_action( 'admin_enqueue_scripts', $admin, 'enqueue_admin_assets' );
		$rest_api = new Headless_Clarity_Rest_Api( 'headless-clarity' );
		$this->loader->add_action( 'rest_api_init', $rest_api, 'register_routes' );
		$this->loader->add_action( 'admin_init', $admin, 'register_settings' );
	}

	private function define_public_hooks() {
		$public = new Headless_Clarity_Public( $this->plugin_name, $this->version );
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
