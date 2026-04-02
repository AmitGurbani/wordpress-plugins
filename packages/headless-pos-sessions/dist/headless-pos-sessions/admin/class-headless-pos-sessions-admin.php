<?php

if ( ! defined( 'WPINC' ) ) {
	die;
}

class Headless_Pos_Sessions_Admin {

	private $plugin_name;
	private $version;

	public function __construct( $plugin_name, $version ) {
		$this->plugin_name = $plugin_name;
		$this->version     = $version;
	}

	public function register_admin_pages() {
		add_menu_page(
			'POS Sessions Settings',
			'POS Sessions',
			'manage_options',
			'headless-pos-sessions-settings',
			array( $this, 'render_admin_page' ),
			'dashicons-store',
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
			'toplevel_page_headless-pos-sessions-settings',
		);

		if ( ! in_array( $hook_suffix, $admin_pages, true ) ) {
			return;
		}

		$asset_file = HEADLESS_POS_SESSIONS_PLUGIN_DIR . 'admin/js/build/index.asset.php';

		if ( ! file_exists( $asset_file ) ) {
			return;
		}

		$asset = require $asset_file;

		wp_enqueue_script(
			'headless-pos-sessions-admin',
			HEADLESS_POS_SESSIONS_PLUGIN_URL . 'admin/js/build/index.js',
			$asset['dependencies'],
			$asset['version'],
			true
		);

		if ( file_exists( HEADLESS_POS_SESSIONS_PLUGIN_DIR . 'admin/js/build/index.css' ) ) {
			wp_enqueue_style(
				'headless-pos-sessions-admin',
				HEADLESS_POS_SESSIONS_PLUGIN_URL . 'admin/js/build/index.css',
				array( 'wp-components' ),
				$asset['version']
			);
		}

		wp_enqueue_style( 'wp-components' );
	}

	public function register_settings() {
		register_setting(
			'headless-pos-sessions_options',
			'headless_pos_sessions_retention_days',
			array(
				'type'    => 'number',
				'default' => 90,
				'sanitize_callback' => 'absint',
			)
		);
		register_setting(
			'headless-pos-sessions_options',
			'headless_pos_sessions_max_open_sessions',
			array(
				'type'    => 'number',
				'default' => 10,
				'sanitize_callback' => 'absint',
			)
		);
	}

	public function woo_notice() {
		if ( ! class_exists( 'WooCommerce' ) ) {
			echo '<div class="notice notice-error"><p><strong>' . esc_html( 'Headless POS Sessions' ) . ':</strong> ';
			echo esc_html__( 'WooCommerce is required for this plugin to work.', 'headless-pos-sessions' );
			echo '</p></div>';
		}
	}

}
