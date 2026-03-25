<?php
/**
 * Plugin Name:       Headless Google Analytics
 * Plugin URI:        
 * Description:       Google Analytics (GA4) with WooCommerce integration and Measurement Protocol for headless WordPress.
 * Version:           1.0.0
 * Author:            wpts
 * Author URI:        
 * License:           GPL-2.0+
 * License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain:       headless-google-analytics
 * Domain Path:       /languages
 * Requires at least: 6.0
 * Requires PHP:      8.0
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

define( 'HEADLESS_GOOGLE_ANALYTICS_VERSION', '1.0.0' );
define( 'HEADLESS_GOOGLE_ANALYTICS_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'HEADLESS_GOOGLE_ANALYTICS_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

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

/**
 * Begin plugin execution.
 */
function run_headless_google_analytics() {
	$plugin = new Headless_Google_Analytics();
	$plugin->run();
}
run_headless_google_analytics();
