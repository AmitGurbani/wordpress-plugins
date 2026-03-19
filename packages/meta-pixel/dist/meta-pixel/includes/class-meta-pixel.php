<?php

if ( ! defined( 'WPINC' ) ) {
	die;
}

class Meta_Pixel {

	protected $loader;
	protected $plugin_name;
	protected $version;

	public function __construct() {
		$this->version     = META_PIXEL_VERSION;
		$this->plugin_name = 'meta-pixel';
		$this->load_dependencies();
		$this->define_admin_hooks();
		$this->define_public_hooks();
	}

	private function load_dependencies() {
		require_once META_PIXEL_PLUGIN_DIR . 'includes/class-meta-pixel-loader.php';
		require_once META_PIXEL_PLUGIN_DIR . 'admin/class-meta-pixel-admin.php';
		require_once META_PIXEL_PLUGIN_DIR . 'public/class-meta-pixel-public.php';
		require_once META_PIXEL_PLUGIN_DIR . 'includes/class-meta-pixel-rest-api.php';
		$this->loader = new Meta_Pixel_Loader();
	}

	private function define_admin_hooks() {
		$admin = new Meta_Pixel_Admin( $this->plugin_name, $this->version );
		$this->loader->add_action( 'admin_menu', $admin, 'register_admin_pages' );
		$this->loader->add_action( 'admin_enqueue_scripts', $admin, 'enqueue_admin_assets' );
		$rest_api = new Meta_Pixel_Rest_Api( 'meta-pixel' );
		$this->loader->add_action( 'rest_api_init', $rest_api, 'register_routes' );
		$this->loader->add_action( 'admin_init', $admin, 'register_settings' );
		$this->loader->add_action( 'admin_notices', $admin, 'woo_notice', 10, 0 );
	}

	private function define_public_hooks() {
		$public = new Meta_Pixel_Public( $this->plugin_name, $this->version );
		$this->loader->add_action( 'woocommerce_order_status_changed', $public, 'on_order_status_changed', 10, 4 );
		$this->loader->add_filter( 'default_option_meta_pixel_currency', $public, 'filter_default_currency', 11, 1 );
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
