<?php
/**
 * Plugin Name:       Headless Orders
 * Plugin URI:        https://github.com/AmitGurbani/wordpress-plugins
 * Description:       REST API for authenticated customers to view their WooCommerce orders.
 * Version:           1.1.0
 * Author:            Amit Gurbani
 * Author URI:        https://github.com/AmitGurbani
 * License:           GPL-2.0+
 * License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain:       headless-orders
 * Domain Path:       /languages
 * Requires at least: 6.2
 * Requires PHP:      8.0
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

define( 'HEADLESS_ORDERS_VERSION', '1.1.0' );
define( 'HEADLESS_ORDERS_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'HEADLESS_ORDERS_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

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
function activate_headless_orders() {
	require_once HEADLESS_ORDERS_PLUGIN_DIR . 'includes/class-headless-orders-activator.php';
	Headless_Orders_Activator::activate();
}

/**
 * Plugin deactivation.
 */
function deactivate_headless_orders() {
	require_once HEADLESS_ORDERS_PLUGIN_DIR . 'includes/class-headless-orders-deactivator.php';
	Headless_Orders_Deactivator::deactivate();
}

register_activation_hook( __FILE__, 'activate_headless_orders' );
register_deactivation_hook( __FILE__, 'deactivate_headless_orders' );

/**
 * Core plugin class.
 */
require_once HEADLESS_ORDERS_PLUGIN_DIR . 'includes/class-headless-orders.php';

/**
 * Begin plugin execution.
 */
function run_headless_orders() {
	$plugin = new Headless_Orders();
	$plugin->run();
}
run_headless_orders();
