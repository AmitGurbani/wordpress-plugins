<?php
/**
 * Plugin Name:       Headless Wishlist
 * Plugin URI:        https://github.com/AmitGurbani/wordpress-plugins
 * Description:       REST API wishlist for headless WordPress stores.
 * Version:           1.2.0
 * Author:            Amit Gurbani
 * Author URI:        https://github.com/AmitGurbani
 * License:           GPL-2.0+
 * License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain:       headless-wishlist
 * Domain Path:       /languages
 * Requires at least: 6.0
 * Requires PHP:      8.0
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

define( 'HEADLESS_WISHLIST_VERSION', '1.2.0' );
define( 'HEADLESS_WISHLIST_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'HEADLESS_WISHLIST_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

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
function activate_headless_wishlist() {
	require_once HEADLESS_WISHLIST_PLUGIN_DIR . 'includes/class-headless-wishlist-activator.php';
	Headless_Wishlist_Activator::activate();
}

/**
 * Plugin deactivation.
 */
function deactivate_headless_wishlist() {
	require_once HEADLESS_WISHLIST_PLUGIN_DIR . 'includes/class-headless-wishlist-deactivator.php';
	Headless_Wishlist_Deactivator::deactivate();
}

register_activation_hook( __FILE__, 'activate_headless_wishlist' );
register_deactivation_hook( __FILE__, 'deactivate_headless_wishlist' );

/**
 * Core plugin class.
 */
require_once HEADLESS_WISHLIST_PLUGIN_DIR . 'includes/class-headless-wishlist.php';

/**
 * Begin plugin execution.
 */
function run_headless_wishlist() {
	$plugin = new Headless_Wishlist();
	$plugin->run();
}
run_headless_wishlist();
