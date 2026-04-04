<?php

if ( ! defined( 'WPINC' ) ) {
	die;
}

class Headless_Wishlist {

	protected $loader;
	protected $plugin_name;
	protected $version;

	public function __construct() {
		$this->version     = HEADLESS_WISHLIST_VERSION;
		$this->plugin_name = 'headless-wishlist';
		$this->load_dependencies();
		$this->define_admin_hooks();
		$this->define_public_hooks();
	}

	private function load_dependencies() {
		require_once HEADLESS_WISHLIST_PLUGIN_DIR . 'includes/class-headless-wishlist-loader.php';
		require_once HEADLESS_WISHLIST_PLUGIN_DIR . 'admin/class-headless-wishlist-admin.php';
		require_once HEADLESS_WISHLIST_PLUGIN_DIR . 'public/class-headless-wishlist-public.php';
		require_once HEADLESS_WISHLIST_PLUGIN_DIR . 'includes/class-headless-wishlist-rest-api.php';
		$this->loader = new Headless_Wishlist_Loader();
	}

	private function define_admin_hooks() {
		$admin = new Headless_Wishlist_Admin( $this->plugin_name, $this->version );
		$this->loader->add_action( 'admin_menu', $admin, 'register_admin_pages' );
		$this->loader->add_action( 'admin_enqueue_scripts', $admin, 'enqueue_admin_assets' );
		$rest_api = new Headless_Wishlist_Rest_Api( 'headless-wishlist' );
		$this->loader->add_action( 'rest_api_init', $rest_api, 'register_routes' );
		$this->loader->add_action( 'admin_notices', $admin, 'woo_notice', 10, 0 );
	}

	private function define_public_hooks() {
		$public = new Headless_Wishlist_Public( $this->plugin_name, $this->version );
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
