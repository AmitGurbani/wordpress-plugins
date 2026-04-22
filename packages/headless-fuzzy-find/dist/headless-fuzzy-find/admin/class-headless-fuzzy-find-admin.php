<?php

if ( ! defined( 'WPINC' ) ) {
	die;
}

class Headless_Fuzzy_Find_Admin {

	private $plugin_name;
	private $version;

	public function __construct( $plugin_name, $version ) {
		$this->plugin_name = $plugin_name;
		$this->version     = $version;
	}

	public function register_admin_pages() {
		add_menu_page(
			'Headless Fuzzy Find Settings',
			'Fuzzy Find',
			'manage_options',
			'headless-fuzzy-find-settings',
			array( $this, 'render_admin_page' ),
			'dashicons-search',
			null
		);
	}

	public function render_admin_page() {
		$screen = get_current_screen();
		$page   = $screen ? $screen->id : '';
		echo '<div id="headless-fuzzy-find-admin-app" data-page="' . esc_attr( $page ) . '"></div>';
	}

	public function enqueue_admin_assets( $hook_suffix ) {
		$admin_pages = array(
			'toplevel_page_headless-fuzzy-find-settings',
		);

		if ( ! in_array( $hook_suffix, $admin_pages, true ) ) {
			return;
		}

		$asset_file = HEADLESS_FUZZY_FIND_PLUGIN_DIR . 'admin/js/build/index.asset.php';

		if ( ! file_exists( $asset_file ) ) {
			return;
		}

		$asset = require $asset_file;

		wp_enqueue_script(
			'headless-fuzzy-find-admin',
			HEADLESS_FUZZY_FIND_PLUGIN_URL . 'admin/js/build/index.js',
			$asset['dependencies'],
			$asset['version'],
			true
		);

		if ( file_exists( HEADLESS_FUZZY_FIND_PLUGIN_DIR . 'admin/js/build/index.css' ) ) {
			wp_enqueue_style(
				'headless-fuzzy-find-admin',
				HEADLESS_FUZZY_FIND_PLUGIN_URL . 'admin/js/build/index.css',
				array( 'wp-components' ),
				$asset['version']
			);
		}

		wp_enqueue_style( 'wp-components' );
	}

	public function register_settings() {
		register_setting(
			'headless-fuzzy-find_options',
			'headless_fuzzy_find_weight_title',
			array(
				'type'    => 'number',
				'default' => 10,
				'sanitize_callback' => 'absint',
			)
		);
		register_setting(
			'headless-fuzzy-find_options',
			'headless_fuzzy_find_weight_sku',
			array(
				'type'    => 'number',
				'default' => 8,
				'sanitize_callback' => 'absint',
			)
		);
		register_setting(
			'headless-fuzzy-find_options',
			'headless_fuzzy_find_weight_content',
			array(
				'type'    => 'number',
				'default' => 2,
				'sanitize_callback' => 'absint',
			)
		);
		register_setting(
			'headless-fuzzy-find_options',
			'headless_fuzzy_find_fuzzy_enabled',
			array(
				'type'    => 'boolean',
				'default' => true,
				'sanitize_callback' => 'rest_sanitize_boolean',
			)
		);
		register_setting(
			'headless-fuzzy-find_options',
			'headless_fuzzy_find_autocomplete_enabled',
			array(
				'type'    => 'boolean',
				'default' => true,
				'sanitize_callback' => 'rest_sanitize_boolean',
			)
		);
		register_setting(
			'headless-fuzzy-find_options',
			'headless_fuzzy_find_analytics_enabled',
			array(
				'type'    => 'boolean',
				'default' => true,
				'sanitize_callback' => 'rest_sanitize_boolean',
			)
		);
		register_setting(
			'headless-fuzzy-find_options',
			'headless_fuzzy_find_min_query_length',
			array(
				'type'    => 'number',
				'default' => 2,
				'sanitize_callback' => 'absint',
			)
		);
		register_setting(
			'headless-fuzzy-find_options',
			'headless_fuzzy_find_autocomplete_limit',
			array(
				'type'    => 'number',
				'default' => 8,
				'sanitize_callback' => 'absint',
			)
		);
		register_setting(
			'headless-fuzzy-find_options',
			'headless_fuzzy_find_did_you_mean_threshold',
			array(
				'type'    => 'number',
				'default' => 3,
				'sanitize_callback' => 'absint',
			)
		);
		register_setting(
			'headless-fuzzy-find_options',
			'headless_fuzzy_find_synonyms',
			array(
				'type'    => 'string',
				'default' => '',
				'sanitize_callback' => 'sanitize_textarea_field',
			)
		);
	}

	public function woo_notice() {
		if ( ! class_exists( 'WooCommerce' ) ) {
			echo '<div class="notice notice-error"><p><strong>' . esc_html( 'Headless Fuzzy Find' ) . ':</strong> ';
			echo esc_html__( 'WooCommerce is required for this plugin to work.', 'headless-fuzzy-find' );
			echo '</p></div>';
		}
	}

}
