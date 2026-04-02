<?php

if ( ! defined( 'WPINC' ) ) {
	die;
}

class Headless_Pos_Sessions {

	protected $loader;
	protected $plugin_name;
	protected $version;

	public function __construct() {
		$this->version     = HEADLESS_POS_SESSIONS_VERSION;
		$this->plugin_name = 'headless-pos-sessions';
		$this->load_dependencies();
		$this->define_admin_hooks();
		$this->define_public_hooks();
	}

	private function load_dependencies() {
		require_once HEADLESS_POS_SESSIONS_PLUGIN_DIR . 'includes/class-headless-pos-sessions-loader.php';
		require_once HEADLESS_POS_SESSIONS_PLUGIN_DIR . 'admin/class-headless-pos-sessions-admin.php';
		require_once HEADLESS_POS_SESSIONS_PLUGIN_DIR . 'public/class-headless-pos-sessions-public.php';
		require_once HEADLESS_POS_SESSIONS_PLUGIN_DIR . 'includes/class-headless-pos-sessions-rest-api.php';
		$this->loader = new Headless_Pos_Sessions_Loader();
	}

	private function define_admin_hooks() {
		$admin = new Headless_Pos_Sessions_Admin( $this->plugin_name, $this->version );
		$this->loader->add_action( 'admin_menu', $admin, 'register_admin_pages' );
		$this->loader->add_action( 'admin_enqueue_scripts', $admin, 'enqueue_admin_assets' );
		$rest_api = new Headless_Pos_Sessions_Rest_Api( 'headless-pos-sessions' );
		$this->loader->add_action( 'rest_api_init', $rest_api, 'register_routes' );
		$this->loader->add_action( 'admin_init', $admin, 'register_settings' );
		$this->loader->add_action( 'admin_notices', $admin, 'woo_notice', 10, 0 );
	}

	private function define_public_hooks() {
		$public = new Headless_Pos_Sessions_Public( $this->plugin_name, $this->version );
		$this->loader->add_action( 'hps_daily_cleanup', $public, 'cleanup_old_sessions', 10, 0 );
		$this->loader->add_action( 'hps_daily_auto_close', $public, 'auto_close_orphaned_sessions', 10, 0 );
		$this->loader->add_action( 'init', $public, 'schedule_cron_jobs', 10, 0 );
		$this->loader->add_action( 'init', $public, 'register_custom_post_types' );
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
