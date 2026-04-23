<?php
/**
 * Plugin Name:       Headless Storefront
 * Plugin URI:        https://github.com/AmitGurbani/wordpress-plugins
 * Description:       Store branding and configuration REST API for headless WordPress with WooCommerce.
 * Version:           1.1.0
 * Author:            Amit Gurbani
 * Author URI:        https://github.com/AmitGurbani
 * License:           GPL-2.0+
 * License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain:       headless-storefront
 * Domain Path:       /languages
 * Requires at least: 6.8
 * Requires PHP:      8.2
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

define( 'HEADLESS_STOREFRONT_VERSION', '1.1.0' );
define( 'HEADLESS_STOREFRONT_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'HEADLESS_STOREFRONT_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

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
function activate_headless_storefront() {
	require_once HEADLESS_STOREFRONT_PLUGIN_DIR . 'includes/class-headless-storefront-activator.php';
	Headless_Storefront_Activator::activate();
}

/**
 * Plugin deactivation.
 */
function deactivate_headless_storefront() {
	require_once HEADLESS_STOREFRONT_PLUGIN_DIR . 'includes/class-headless-storefront-deactivator.php';
	Headless_Storefront_Deactivator::deactivate();
}

register_activation_hook( __FILE__, 'activate_headless_storefront' );
register_deactivation_hook( __FILE__, 'deactivate_headless_storefront' );

/**
 * Core plugin class.
 */
require_once HEADLESS_STOREFRONT_PLUGIN_DIR . 'includes/class-headless-storefront.php';

/**
 * Begin plugin execution.
 */
function run_headless_storefront() {
	$plugin = new Headless_Storefront();
	$plugin->run();
}
run_headless_storefront();
