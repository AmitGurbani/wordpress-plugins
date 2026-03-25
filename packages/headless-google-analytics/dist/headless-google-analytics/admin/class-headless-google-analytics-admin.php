<?php

if ( ! defined( 'WPINC' ) ) {
	die;
}

class Headless_Google_Analytics_Admin {

	private $plugin_name;
	private $version;

	public function __construct( $plugin_name, $version ) {
		$this->plugin_name = $plugin_name;
		$this->version     = $version;
	}

	public function register_admin_pages() {
		add_menu_page(
			'Headless Google Analytics Settings',
			'Google Analytics',
			'manage_options',
			'headless-google-analytics-settings',
			array( $this, 'render_admin_page' ),
			'dashicons-chart-line',
			null
		);
	}

	public function render_admin_page() {
		$screen = get_current_screen();
		$page   = $screen ? $screen->id : '';
		echo '<div id="wpts-admin-app" data-page="' . esc_attr( $page ) . '"></div>';
	}

	public function enqueue_admin_assets( $hook_suffix ) {
		$admin_pages = array(
			'toplevel_page_headless-google-analytics-settings',
		);

		if ( ! in_array( $hook_suffix, $admin_pages, true ) ) {
			return;
		}

		$asset_file = HEADLESS_GOOGLE_ANALYTICS_PLUGIN_DIR . 'admin/js/build/index.asset.php';

		if ( ! file_exists( $asset_file ) ) {
			return;
		}

		$asset = require $asset_file;

		wp_enqueue_script(
			'headless-google-analytics-admin',
			HEADLESS_GOOGLE_ANALYTICS_PLUGIN_URL . 'admin/js/build/index.js',
			$asset['dependencies'],
			$asset['version'],
			true
		);

		if ( file_exists( HEADLESS_GOOGLE_ANALYTICS_PLUGIN_DIR . 'admin/js/build/index.css' ) ) {
			wp_enqueue_style(
				'headless-google-analytics-admin',
				HEADLESS_GOOGLE_ANALYTICS_PLUGIN_URL . 'admin/js/build/index.css',
				array( 'wp-components' ),
				$asset['version']
			);
		}

		wp_enqueue_style( 'wp-components' );
	}

	public function register_settings() {
		register_setting(
			'headless-google-analytics_options',
			'headless_google_analytics_measurement_id',
			array(
				'type'    => 'string',
				'default' => '',
				'sanitize_callback' => 'sanitize_text_field',
			)
		);
		register_setting(
			'headless-google-analytics_options',
			'headless_google_analytics_api_secret',
			array(
				'type'    => 'string',
				'default' => '',
				'sanitize_callback' => 'sanitize_text_field',
			)
		);
		register_setting(
			'headless-google-analytics_options',
			'headless_google_analytics_currency',
			array(
				'type'    => 'string',
				'default' => 'USD',
				'sanitize_callback' => 'sanitize_text_field',
			)
		);
		register_setting(
			'headless-google-analytics_options',
			'headless_google_analytics_enable_purchase',
			array(
				'type'    => 'boolean',
				'default' => true,
				'sanitize_callback' => 'rest_sanitize_boolean',
			)
		);
	}

	public function woo_notice() {
		if ( ! class_exists( 'WooCommerce' ) ) {
			echo '<div class="notice notice-warning"><p><strong>Headless Google Analytics:</strong> ';
			echo esc_html__( 'WooCommerce is recommended for automatic Purchase event tracking.', 'headless-google-analytics' );
			echo '</p></div>';
		}
	}

}
