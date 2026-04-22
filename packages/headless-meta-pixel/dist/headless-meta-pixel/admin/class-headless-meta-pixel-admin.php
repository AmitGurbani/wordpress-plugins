<?php

if ( ! defined( 'WPINC' ) ) {
	die;
}

class Headless_Meta_Pixel_Admin {

	private $plugin_name;
	private $version;

	public function __construct( $plugin_name, $version ) {
		$this->plugin_name = $plugin_name;
		$this->version     = $version;
	}

	public function register_admin_pages() {
		add_menu_page(
			'Headless Meta Pixel Settings',
			'Meta Pixel',
			'manage_options',
			'headless-meta-pixel-settings',
			array( $this, 'render_admin_page' ),
			'dashicons-chart-area',
			null
		);
	}

	public function render_admin_page() {
		$screen = get_current_screen();
		$page   = $screen ? $screen->id : '';
		echo '<div id="headless-meta-pixel-admin-app" data-page="' . esc_attr( $page ) . '"></div>';
	}

	public function enqueue_admin_assets( $hook_suffix ) {
		$admin_pages = array(
			'toplevel_page_headless-meta-pixel-settings',
		);

		if ( ! in_array( $hook_suffix, $admin_pages, true ) ) {
			return;
		}

		$asset_file = HEADLESS_META_PIXEL_PLUGIN_DIR . 'admin/js/build/index.asset.php';

		if ( ! file_exists( $asset_file ) ) {
			return;
		}

		$asset = require $asset_file;

		wp_enqueue_script(
			'headless-meta-pixel-admin',
			HEADLESS_META_PIXEL_PLUGIN_URL . 'admin/js/build/index.js',
			$asset['dependencies'],
			$asset['version'],
			true
		);

		if ( file_exists( HEADLESS_META_PIXEL_PLUGIN_DIR . 'admin/js/build/index.css' ) ) {
			wp_enqueue_style(
				'headless-meta-pixel-admin',
				HEADLESS_META_PIXEL_PLUGIN_URL . 'admin/js/build/index.css',
				array( 'wp-components' ),
				$asset['version']
			);
		}

		wp_enqueue_style( 'wp-components' );
	}

	public function register_settings() {
		register_setting(
			'headless-meta-pixel_options',
			'headless_meta_pixel_pixel_id',
			array(
				'type'    => 'string',
				'default' => '',
				'sanitize_callback' => 'sanitize_text_field',
			)
		);
		register_setting(
			'headless-meta-pixel_options',
			'headless_meta_pixel_access_token',
			array(
				'type'    => 'string',
				'default' => '',
				'sanitize_callback' => 'sanitize_text_field',
			)
		);
		register_setting(
			'headless-meta-pixel_options',
			'headless_meta_pixel_test_event_code',
			array(
				'type'    => 'string',
				'default' => '',
				'sanitize_callback' => 'sanitize_text_field',
			)
		);
		register_setting(
			'headless-meta-pixel_options',
			'headless_meta_pixel_currency',
			array(
				'type'    => 'string',
				'default' => 'USD',
				'sanitize_callback' => 'sanitize_text_field',
			)
		);
		register_setting(
			'headless-meta-pixel_options',
			'headless_meta_pixel_enable_view_content',
			array(
				'type'    => 'boolean',
				'default' => true,
				'sanitize_callback' => 'rest_sanitize_boolean',
			)
		);
		register_setting(
			'headless-meta-pixel_options',
			'headless_meta_pixel_enable_add_to_cart',
			array(
				'type'    => 'boolean',
				'default' => true,
				'sanitize_callback' => 'rest_sanitize_boolean',
			)
		);
		register_setting(
			'headless-meta-pixel_options',
			'headless_meta_pixel_enable_initiate_checkout',
			array(
				'type'    => 'boolean',
				'default' => true,
				'sanitize_callback' => 'rest_sanitize_boolean',
			)
		);
		register_setting(
			'headless-meta-pixel_options',
			'headless_meta_pixel_enable_purchase',
			array(
				'type'    => 'boolean',
				'default' => true,
				'sanitize_callback' => 'rest_sanitize_boolean',
			)
		);
		register_setting(
			'headless-meta-pixel_options',
			'headless_meta_pixel_enable_search',
			array(
				'type'    => 'boolean',
				'default' => true,
				'sanitize_callback' => 'rest_sanitize_boolean',
			)
		);
		register_setting(
			'headless-meta-pixel_options',
			'headless_meta_pixel_enable_capi',
			array(
				'type'    => 'boolean',
				'default' => true,
				'sanitize_callback' => 'rest_sanitize_boolean',
			)
		);
	}

	public function woo_notice() {
		if ( ! class_exists( 'WooCommerce' ) ) {
			echo '<div class="notice notice-warning"><p><strong>' . esc_html( 'Headless Meta Pixel' ) . ':</strong> ';
			echo esc_html__( 'WooCommerce is recommended for automatic purchase event tracking.', 'headless-meta-pixel' );
			echo '</p></div>';
		}
	}

}
