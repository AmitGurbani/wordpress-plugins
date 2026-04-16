<?php
/**
 * Plugin Name:       Headless POS Sessions
 * Plugin URI:        https://github.com/AmitGurbani/wordpress-plugins
 * Description:       POS register session storage with REST API for headless WordPress.
 * Version:           1.0.0
 * Author:            Amit Gurbani
 * Author URI:        https://github.com/AmitGurbani
 * License:           GPL-2.0+
 * License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain:       headless-pos-sessions
 * Domain Path:       /languages
 * Requires at least: 6.7
 * Requires PHP:      8.2
 * Update URI:       https://github.com/AmitGurbani/wordpress-plugins/releases?plugin=headless-pos-sessions
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

define( 'HEADLESS_POS_SESSIONS_VERSION', '1.0.0' );
define( 'HEADLESS_POS_SESSIONS_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'HEADLESS_POS_SESSIONS_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

/**
 * Declare WooCommerce HPOS compatibility.
 */
add_action( 'before_woocommerce_init', function() {
	if ( class_exists( \Automattic\WooCommerce\Utilities\FeaturesUtil::class ) ) {
		\Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility( 'custom_order_tables', __FILE__, true );
	}
} );

/**
 * Plugin activation.
 */
function activate_headless_pos_sessions() {
	require_once HEADLESS_POS_SESSIONS_PLUGIN_DIR . 'includes/class-headless-pos-sessions-activator.php';
	Headless_Pos_Sessions_Activator::activate();
}

/**
 * Plugin deactivation.
 */
function deactivate_headless_pos_sessions() {
	require_once HEADLESS_POS_SESSIONS_PLUGIN_DIR . 'includes/class-headless-pos-sessions-deactivator.php';
	Headless_Pos_Sessions_Deactivator::deactivate();
}

register_activation_hook( __FILE__, 'activate_headless_pos_sessions' );
register_deactivation_hook( __FILE__, 'deactivate_headless_pos_sessions' );

/**
 * Core plugin class.
 */
require_once HEADLESS_POS_SESSIONS_PLUGIN_DIR . 'includes/class-headless-pos-sessions.php';
require_once HEADLESS_POS_SESSIONS_PLUGIN_DIR . 'includes/class-headless-pos-sessions-updater.php';

/**
 * Begin plugin execution.
 */
function run_headless_pos_sessions() {
	( new Headless_Pos_Sessions_Updater( __FILE__, HEADLESS_POS_SESSIONS_VERSION ) )->register();
	$plugin = new Headless_Pos_Sessions();
	$plugin->run();
}
run_headless_pos_sessions();
