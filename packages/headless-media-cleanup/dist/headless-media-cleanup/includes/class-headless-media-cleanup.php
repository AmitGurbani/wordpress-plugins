<?php

if ( ! defined( 'WPINC' ) ) {
	die;
}

class Headless_Media_Cleanup {

	protected $loader;
	protected $plugin_name;
	protected $version;

	public function __construct() {
		$this->version     = HEADLESS_MEDIA_CLEANUP_VERSION;
		$this->plugin_name = 'headless-media-cleanup';
		$this->load_dependencies();
		$this->define_admin_hooks();
		$this->define_public_hooks();
	}

	private function load_dependencies() {
		require_once HEADLESS_MEDIA_CLEANUP_PLUGIN_DIR . 'includes/class-headless-media-cleanup-loader.php';
		require_once HEADLESS_MEDIA_CLEANUP_PLUGIN_DIR . 'admin/class-headless-media-cleanup-admin.php';
		require_once HEADLESS_MEDIA_CLEANUP_PLUGIN_DIR . 'public/class-headless-media-cleanup-public.php';
		require_once HEADLESS_MEDIA_CLEANUP_PLUGIN_DIR . 'includes/class-headless-media-cleanup-rest-api.php';
		$this->loader = new Headless_Media_Cleanup_Loader();
	}

	private function define_admin_hooks() {
		$admin = new Headless_Media_Cleanup_Admin( $this->plugin_name, $this->version );
		$rest_api = new Headless_Media_Cleanup_Rest_Api( 'headless-media-cleanup' );
		$this->loader->add_action( 'rest_api_init', $rest_api, 'register_routes' );
		$this->loader->add_action( 'admin_notices', $admin, 'woo_notice', 10, 0 );
	}

	private function define_public_hooks() {
		$public = new Headless_Media_Cleanup_Public( $this->plugin_name, $this->version );
		$this->loader->add_action( 'woocommerce_new_product', $public, 'on_product_create', 10, 1 );
		$this->loader->add_action( 'woocommerce_new_product_variation', $public, 'on_variation_create', 10, 1 );
		$this->loader->add_action( 'woocommerce_update_product', $public, 'on_product_update', 99, 1 );
		$this->loader->add_action( 'woocommerce_update_product_variation', $public, 'on_variation_update', 99, 1 );
		$this->loader->add_action( 'updated_post_meta', $public, 'on_post_meta_updated', 10, 4 );
		$this->loader->add_action( 'delete_post_meta', $public, 'on_post_meta_delete', 10, 4 );
		$this->loader->add_action( 'before_delete_post', $public, 'on_before_delete_post', 10, 2 );
		$this->loader->add_action( 'deleted_post', $public, 'on_deleted_post', 10, 2 );
		$this->loader->add_action( 'added_term_meta', $public, 'on_term_meta_added', 10, 4 );
		$this->loader->add_action( 'updated_term_meta', $public, 'on_term_meta_updated', 10, 4 );
		$this->loader->add_action( 'delete_term_meta', $public, 'on_term_meta_delete', 10, 4 );
		$this->loader->add_action( 'pre_delete_term', $public, 'on_pre_delete_term', 10, 2 );
		$this->loader->add_action( 'delete_term', $public, 'on_delete_term', 10, 5 );
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
