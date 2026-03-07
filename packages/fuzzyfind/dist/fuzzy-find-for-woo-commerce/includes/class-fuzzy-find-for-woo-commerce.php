<?php

if ( ! defined( 'WPINC' ) ) {
	die;
}

class Fuzzyfind_For_Woocommerce {

	protected $loader;
	protected $plugin_name;
	protected $version;

	public function __construct() {
		$this->version     = FUZZY_FIND_FOR_WOO_COMMERCE_VERSION;
		$this->plugin_name = 'fuzzyfind';
		$this->load_dependencies();
		$this->define_admin_hooks();
		$this->define_public_hooks();
	}

	private function load_dependencies() {
		require_once FUZZY_FIND_FOR_WOO_COMMERCE_PLUGIN_DIR . 'includes/class-fuzzy-find-for-woo-commerce-loader.php';
		require_once FUZZY_FIND_FOR_WOO_COMMERCE_PLUGIN_DIR . 'admin/class-fuzzy-find-for-woo-commerce-admin.php';
		require_once FUZZY_FIND_FOR_WOO_COMMERCE_PLUGIN_DIR . 'public/class-fuzzy-find-for-woo-commerce-public.php';
		require_once FUZZY_FIND_FOR_WOO_COMMERCE_PLUGIN_DIR . 'includes/class-fuzzy-find-for-woo-commerce-rest-api.php';
		$this->loader = new Fuzzyfind_For_Woocommerce_Loader();
	}

	private function define_admin_hooks() {
		$admin = new Fuzzyfind_For_Woocommerce_Admin( $this->plugin_name, $this->version );
		$this->loader->add_action( 'admin_menu', $admin, 'register_admin_pages' );
		$this->loader->add_action( 'admin_enqueue_scripts', $admin, 'enqueue_admin_assets' );
		$rest_api = new Fuzzyfind_For_Woocommerce_Rest_Api( 'fuzzyfind' );
		$this->loader->add_action( 'rest_api_init', $rest_api, 'register_routes' );
		$this->loader->add_action( 'admin_init', $admin, 'register_settings' );
		$this->loader->add_action( 'admin_notices', $admin, 'woo_required_notice', 10, 0 );
	}

	private function define_public_hooks() {
		$public = new Fuzzyfind_For_Woocommerce_Public( $this->plugin_name, $this->version );
		$this->loader->add_action( 'woocommerce_new_product', $public, 'on_product_create', 20, 1 );
		$this->loader->add_action( 'woocommerce_update_product', $public, 'on_product_update', 20, 1 );
		$this->loader->add_action( 'woocommerce_new_product_variation', $public, 'on_variation_create', 10, 1 );
		$this->loader->add_action( 'woocommerce_update_product_variation', $public, 'on_variation_update', 10, 1 );
		$this->loader->add_action( 'before_delete_post', $public, 'on_product_delete', 10, 1 );
		$this->loader->add_action( 'wp_trash_post', $public, 'on_product_trash', 10, 1 );
		$this->loader->add_action( 'untrashed_post', $public, 'on_product_untrash', 10, 1 );
		$this->loader->add_action( 'fuzzyfind_do_reindex', $public, 'do_reindex', 10, 0 );
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
