<?php

if ( ! defined( 'WPINC' ) ) {
	die;
}

class Fuzzyfind_For_Woocommerce_Admin {

	private $plugin_name;
	private $version;

	public function __construct( $plugin_name, $version ) {
		$this->plugin_name = $plugin_name;
		$this->version     = $version;
	}

	public function register_admin_pages() {
		add_menu_page(
			'FuzzyFind Settings',
			'FuzzyFind',
			'manage_options',
			'fuzzyfind-settings',
			array( $this, 'render_admin_page' ),
			'dashicons-search',
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
			'toplevel_page_fuzzyfind-settings',
		);

		if ( ! in_array( $hook_suffix, $admin_pages, true ) ) {
			return;
		}

		$asset_file = FUZZY_FIND_FOR_WOO_COMMERCE_PLUGIN_DIR . 'admin/js/build/index.asset.php';

		if ( ! file_exists( $asset_file ) ) {
			return;
		}

		$asset = require $asset_file;

		wp_enqueue_script(
			'fuzzyfind-admin',
			FUZZY_FIND_FOR_WOO_COMMERCE_PLUGIN_URL . 'admin/js/build/index.js',
			$asset['dependencies'],
			$asset['version'],
			true
		);

		if ( file_exists( FUZZY_FIND_FOR_WOO_COMMERCE_PLUGIN_DIR . 'admin/js/build/index.css' ) ) {
			wp_enqueue_style(
				'fuzzyfind-admin',
				FUZZY_FIND_FOR_WOO_COMMERCE_PLUGIN_URL . 'admin/js/build/index.css',
				array( 'wp-components' ),
				$asset['version']
			);
		}

		wp_enqueue_style( 'wp-components' );
	}

	public function register_settings() {
		register_setting(
			'fuzzyfind_options',
			'fuzzy_find_for_woo_commerce_weight_title',
			array(
				'type'    => 'number',
				'default' => 10,
				'sanitize_callback' => 'absint',
			)
		);
		register_setting(
			'fuzzyfind_options',
			'fuzzy_find_for_woo_commerce_weight_sku',
			array(
				'type'    => 'number',
				'default' => 8,
				'sanitize_callback' => 'absint',
			)
		);
		register_setting(
			'fuzzyfind_options',
			'fuzzy_find_for_woo_commerce_weight_content',
			array(
				'type'    => 'number',
				'default' => 2,
				'sanitize_callback' => 'absint',
			)
		);
		register_setting(
			'fuzzyfind_options',
			'fuzzy_find_for_woo_commerce_fuzzy_enabled',
			array(
				'type'    => 'boolean',
				'default' => true,
				'sanitize_callback' => 'rest_sanitize_boolean',
			)
		);
		register_setting(
			'fuzzyfind_options',
			'fuzzy_find_for_woo_commerce_autocomplete_enabled',
			array(
				'type'    => 'boolean',
				'default' => true,
				'sanitize_callback' => 'rest_sanitize_boolean',
			)
		);
		register_setting(
			'fuzzyfind_options',
			'fuzzy_find_for_woo_commerce_analytics_enabled',
			array(
				'type'    => 'boolean',
				'default' => true,
				'sanitize_callback' => 'rest_sanitize_boolean',
			)
		);
		register_setting(
			'fuzzyfind_options',
			'fuzzy_find_for_woo_commerce_min_query_length',
			array(
				'type'    => 'number',
				'default' => 2,
				'sanitize_callback' => 'absint',
			)
		);
		register_setting(
			'fuzzyfind_options',
			'fuzzy_find_for_woo_commerce_autocomplete_limit',
			array(
				'type'    => 'number',
				'default' => 8,
				'sanitize_callback' => 'absint',
			)
		);
		register_setting(
			'fuzzyfind_options',
			'fuzzy_find_for_woo_commerce_did_you_mean_threshold',
			array(
				'type'    => 'number',
				'default' => 3,
				'sanitize_callback' => 'absint',
			)
		);
		register_setting(
			'fuzzyfind_options',
			'fuzzy_find_for_woo_commerce_synonyms',
			array(
				'type'    => 'string',
				'default' => '',
				'sanitize_callback' => 'sanitize_textarea_field',
			)
		);
	}

	public function woo_required_notice() {
		if ( ! class_exists( 'WooCommerce' ) ) {
			echo '<div class="notice notice-error"><p><strong>FuzzyFind:</strong> ';
			echo esc_html__( 'WooCommerce is required for this plugin to work.', 'fuzzyfind' );
			echo '</p></div>';
		}
	}

}
