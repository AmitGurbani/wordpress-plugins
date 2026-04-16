<?php
/**
 * Plugin Name:       Headless Google Analytics
 * Plugin URI:        https://github.com/AmitGurbani/wordpress-plugins
 * Description:       Google Analytics (GA4) with WooCommerce integration and Measurement Protocol for headless WordPress.
 * Version:           1.0.0
 * Author:            Amit Gurbani
 * Author URI:        https://github.com/AmitGurbani
 * License:           GPL-2.0+
 * License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain:       headless-google-analytics
 * Domain Path:       /languages
 * Requires at least: 6.0
 * Requires PHP:      8.0
 * Update URI:       https://github.com/AmitGurbani/wordpress-plugins/releases?plugin=headless-google-analytics
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

define( 'HEADLESS_GOOGLE_ANALYTICS_VERSION', '1.0.0' );
define( 'HEADLESS_GOOGLE_ANALYTICS_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'HEADLESS_GOOGLE_ANALYTICS_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

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
function activate_headless_google_analytics() {
	require_once HEADLESS_GOOGLE_ANALYTICS_PLUGIN_DIR . 'includes/class-headless-google-analytics-activator.php';
	Headless_Google_Analytics_Activator::activate();
}

/**
 * Plugin deactivation.
 */
function deactivate_headless_google_analytics() {
	require_once HEADLESS_GOOGLE_ANALYTICS_PLUGIN_DIR . 'includes/class-headless-google-analytics-deactivator.php';
	Headless_Google_Analytics_Deactivator::deactivate();
}

register_activation_hook( __FILE__, 'activate_headless_google_analytics' );
register_deactivation_hook( __FILE__, 'deactivate_headless_google_analytics' );

/**
 * Core plugin class.
 */
require_once HEADLESS_GOOGLE_ANALYTICS_PLUGIN_DIR . 'includes/class-headless-google-analytics.php';
require_once HEADLESS_GOOGLE_ANALYTICS_PLUGIN_DIR . 'includes/class-headless-google-analytics-updater.php';

/**
 * Begin plugin execution.
 */
function run_headless_google_analytics() {
	( new Headless_Google_Analytics_Updater( __FILE__, HEADLESS_GOOGLE_ANALYTICS_VERSION ) )->register();
	$plugin = new Headless_Google_Analytics();
	$plugin->run();
}
run_headless_google_analytics();
