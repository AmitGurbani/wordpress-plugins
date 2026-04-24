<?php

if ( ! defined( 'WPINC' ) ) {
	die;
}

class Headless_Storefront {

	protected $loader;
	protected $plugin_name;
	protected $version;

	public function __construct() {
		$this->version     = HEADLESS_STOREFRONT_VERSION;
		$this->plugin_name = 'headless-storefront';
		$this->load_dependencies();
		$this->define_admin_hooks();
		$this->define_public_hooks();
	}

	private function load_dependencies() {
		require_once HEADLESS_STOREFRONT_PLUGIN_DIR . 'includes/class-headless-storefront-loader.php';
		require_once HEADLESS_STOREFRONT_PLUGIN_DIR . 'admin/class-headless-storefront-admin.php';
		require_once HEADLESS_STOREFRONT_PLUGIN_DIR . 'public/class-headless-storefront-public.php';
		require_once HEADLESS_STOREFRONT_PLUGIN_DIR . 'includes/class-headless-storefront-rest-api.php';
		$this->loader = new Headless_Storefront_Loader();
	}

	private function define_admin_hooks() {
		$admin = new Headless_Storefront_Admin( $this->plugin_name, $this->version );
		$this->loader->add_action( 'admin_menu', $admin, 'register_admin_pages' );
		$this->loader->add_action( 'admin_enqueue_scripts', $admin, 'enqueue_admin_assets' );
		$rest_api = new Headless_Storefront_Rest_Api( 'headless-storefront' );
		$this->loader->add_action( 'rest_api_init', $rest_api, 'register_routes' );
		$this->loader->add_action( 'admin_notices', $admin, 'woo_notice', 10, 0 );
	}

	private function define_public_hooks() {
		$public = new Headless_Storefront_Public( $this->plugin_name, $this->version );
		$this->loader->add_action( 'update_option_headless_storefront_config', $public, 'on_config_update', 10, 1 );
		$this->loader->add_action( 'update_option_blogname', $public, 'on_blog_name_update', 10, 1 );
		$this->loader->add_action( 'update_option_blogdescription', $public, 'on_blog_description_update', 10, 1 );
		$this->loader->add_action( 'update_option_woocommerce_email_from_address', $public, 'on_woo_email_update', 10, 1 );
		$this->loader->add_action( 'headless_storefront_search_cleanup', $public, 'cleanup_old_searches', 10, 0 );
		$this->loader->add_filter( 'rest_pre_dispatch', $public, 'track_search', 10, 3 );
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
