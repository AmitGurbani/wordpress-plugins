<?php

if ( ! defined( 'WPINC' ) ) {
	die;
}

class Headless_Fuzzy_Find {

	protected $loader;
	protected $plugin_name;
	protected $version;

	public function __construct() {
		$this->version     = HEADLESS_FUZZY_FIND_VERSION;
		$this->plugin_name = 'headless-fuzzy-find';
		$this->load_dependencies();
		$this->define_admin_hooks();
		$this->define_public_hooks();
	}

	private function load_dependencies() {
		require_once HEADLESS_FUZZY_FIND_PLUGIN_DIR . 'includes/class-headless-fuzzy-find-loader.php';
		require_once HEADLESS_FUZZY_FIND_PLUGIN_DIR . 'admin/class-headless-fuzzy-find-admin.php';
		require_once HEADLESS_FUZZY_FIND_PLUGIN_DIR . 'public/class-headless-fuzzy-find-public.php';
		require_once HEADLESS_FUZZY_FIND_PLUGIN_DIR . 'includes/class-headless-fuzzy-find-rest-api.php';
		$this->loader = new Headless_Fuzzy_Find_Loader();
	}

	private function define_admin_hooks() {
		$admin = new Headless_Fuzzy_Find_Admin( $this->plugin_name, $this->version );
		$this->loader->add_action( 'admin_menu', $admin, 'register_admin_pages' );
		$this->loader->add_action( 'admin_enqueue_scripts', $admin, 'enqueue_admin_assets' );
		$rest_api = new Headless_Fuzzy_Find_Rest_Api( 'headless-fuzzy-find' );
		$this->loader->add_action( 'rest_api_init', $rest_api, 'register_routes' );
		$this->loader->add_action( 'admin_init', $admin, 'register_settings' );
		$this->loader->add_action( 'admin_notices', $admin, 'woo_notice', 10, 0 );
	}

	private function define_public_hooks() {
		$public = new Headless_Fuzzy_Find_Public( $this->plugin_name, $this->version );
		$this->loader->add_action( 'woocommerce_new_product', $public, 'on_product_create', 20, 1 );
		$this->loader->add_action( 'woocommerce_update_product', $public, 'on_product_update', 20, 1 );
		$this->loader->add_action( 'woocommerce_new_product_variation', $public, 'on_variation_create', 10, 1 );
		$this->loader->add_action( 'woocommerce_update_product_variation', $public, 'on_variation_update', 10, 1 );
		$this->loader->add_action( 'before_delete_post', $public, 'on_product_delete', 10, 1 );
		$this->loader->add_action( 'wp_trash_post', $public, 'on_product_trash', 10, 1 );
		$this->loader->add_action( 'untrashed_post', $public, 'on_product_untrash', 10, 1 );
		$this->loader->add_action( 'headless_fuzzy_find_do_reindex', $public, 'do_reindex', 10, 0 );
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
