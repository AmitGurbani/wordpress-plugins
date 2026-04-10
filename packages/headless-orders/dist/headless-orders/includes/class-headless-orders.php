<?php

if ( ! defined( 'WPINC' ) ) {
	die;
}

class Headless_Orders {

	protected $loader;
	protected $plugin_name;
	protected $version;

	public function __construct() {
		$this->version     = HEADLESS_ORDERS_VERSION;
		$this->plugin_name = 'headless-orders';
		$this->load_dependencies();
		$this->define_admin_hooks();
		$this->define_public_hooks();
	}

	private function load_dependencies() {
		require_once HEADLESS_ORDERS_PLUGIN_DIR . 'includes/class-headless-orders-loader.php';
		require_once HEADLESS_ORDERS_PLUGIN_DIR . 'admin/class-headless-orders-admin.php';
		require_once HEADLESS_ORDERS_PLUGIN_DIR . 'public/class-headless-orders-public.php';
		require_once HEADLESS_ORDERS_PLUGIN_DIR . 'includes/class-headless-orders-rest-api.php';
		$this->loader = new Headless_Orders_Loader();
	}

	private function define_admin_hooks() {
		$admin = new Headless_Orders_Admin( $this->plugin_name, $this->version );
		$rest_api = new Headless_Orders_Rest_Api( 'headless-orders' );
		$this->loader->add_action( 'rest_api_init', $rest_api, 'register_routes' );
		$this->loader->add_action( 'admin_notices', $admin, 'woo_notice', 10, 0 );
	}

	private function define_public_hooks() {
		$public = new Headless_Orders_Public( $this->plugin_name, $this->version );
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
