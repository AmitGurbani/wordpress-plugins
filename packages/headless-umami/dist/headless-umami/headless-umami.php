<?php
/**
 * Plugin Name:       Headless Umami
 * Plugin URI:        https://github.com/AmitGurbani/wordpress-plugins
 * Description:       Umami Analytics with WooCommerce purchase tracking for headless WordPress.
 * Version:           1.1.0
 * Author:            Amit Gurbani
 * Author URI:        https://github.com/AmitGurbani
 * License:           GPL-2.0+
 * License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain:       headless-umami
 * Domain Path:       /languages
 * Requires at least: 6.0
 * Requires PHP:      8.0
 * Update URI:       https://github.com/AmitGurbani/wordpress-plugins/releases?plugin=headless-umami
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

define( 'HEADLESS_UMAMI_VERSION', '1.1.0' );
define( 'HEADLESS_UMAMI_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'HEADLESS_UMAMI_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

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
function activate_headless_umami() {
	require_once HEADLESS_UMAMI_PLUGIN_DIR . 'includes/class-headless-umami-activator.php';
	Headless_Umami_Activator::activate();
}

/**
 * Plugin deactivation.
 */
function deactivate_headless_umami() {
	require_once HEADLESS_UMAMI_PLUGIN_DIR . 'includes/class-headless-umami-deactivator.php';
	Headless_Umami_Deactivator::deactivate();
}

register_activation_hook( __FILE__, 'activate_headless_umami' );
register_deactivation_hook( __FILE__, 'deactivate_headless_umami' );

/**
 * Core plugin class.
 */
require_once HEADLESS_UMAMI_PLUGIN_DIR . 'includes/class-headless-umami.php';
require_once HEADLESS_UMAMI_PLUGIN_DIR . 'includes/class-headless-umami-updater.php';

/**
 * Begin plugin execution.
 */
function run_headless_umami() {
	( new Headless_Umami_Updater( __FILE__, HEADLESS_UMAMI_VERSION ) )->register();
	$plugin = new Headless_Umami();
	$plugin->run();
}
run_headless_umami();
