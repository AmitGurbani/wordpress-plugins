<?php

if ( ! defined( 'WPINC' ) ) {
	die;
}

class Headless_Wishlist_Admin {

	private $plugin_name;
	private $version;

	public function __construct( $plugin_name, $version ) {
		$this->plugin_name = $plugin_name;
		$this->version     = $version;
	}

	public function register_admin_pages() {
		add_menu_page(
			'Headless Wishlist',
			'Wishlist',
			'manage_options',
			'headless-wishlist',
			array( $this, 'render_admin_page' ),
			'dashicons-heart',
			null
		);
	}

	public function render_admin_page() {
		$screen = get_current_screen();
		$page   = $screen ? $screen->id : '';
		echo '<div id="headless-wishlist-admin-app" data-page="' . esc_attr( $page ) . '"></div>';
	}

	public function enqueue_admin_assets( $hook_suffix ) {
		$admin_pages = array(
			'toplevel_page_headless-wishlist',
		);

		if ( ! in_array( $hook_suffix, $admin_pages, true ) ) {
			return;
		}

		$asset_file = HEADLESS_WISHLIST_PLUGIN_DIR . 'admin/js/build/index.asset.php';

		if ( ! file_exists( $asset_file ) ) {
			return;
		}

		$asset = require $asset_file;

		wp_enqueue_script(
			'headless-wishlist-admin',
			HEADLESS_WISHLIST_PLUGIN_URL . 'admin/js/build/index.js',
			$asset['dependencies'],
			$asset['version'],
			true
		);

		if ( file_exists( HEADLESS_WISHLIST_PLUGIN_DIR . 'admin/js/build/index.css' ) ) {
			wp_enqueue_style(
				'headless-wishlist-admin',
				HEADLESS_WISHLIST_PLUGIN_URL . 'admin/js/build/index.css',
				array( 'wp-components' ),
				$asset['version']
			);
		}

		wp_enqueue_style( 'wp-components' );
	}


	public function woo_notice() {
		if ( ! class_exists( 'WooCommerce' ) ) {
			echo '<div class="notice notice-error"><p><strong>' . esc_html( 'Headless Wishlist' ) . ':</strong> ';
			echo esc_html__( 'WooCommerce is required for this plugin to work.', 'headless-wishlist' );
			echo '</p></div>';
		}
	}

}
