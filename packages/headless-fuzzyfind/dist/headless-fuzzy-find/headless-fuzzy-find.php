<?php
/**
 * Plugin Name:       Headless FuzzyFind
 * Plugin URI:        https://github.com/AmitGurbani/wordpress-plugins
 * Description:       Weighted, fuzzy WooCommerce product search with autocomplete and analytics.
 * Version:           1.0.0
 * Author:            Amit Gurbani
 * Author URI:        https://github.com/AmitGurbani
 * License:           GPL-2.0+
 * License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain:       headless-fuzzyfind
 * Domain Path:       /languages
 * Requires at least: 6.0
 * Requires PHP:      8.0
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

define( 'HEADLESS_FUZZY_FIND_VERSION', '1.0.0' );
define( 'HEADLESS_FUZZY_FIND_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'HEADLESS_FUZZY_FIND_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

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
function activate_headless_fuzzy_find() {
	require_once HEADLESS_FUZZY_FIND_PLUGIN_DIR . 'includes/class-headless-fuzzy-find-activator.php';
	Headless_Fuzzyfind_Activator::activate();
}

/**
 * Plugin deactivation.
 */
function deactivate_headless_fuzzy_find() {
	require_once HEADLESS_FUZZY_FIND_PLUGIN_DIR . 'includes/class-headless-fuzzy-find-deactivator.php';
	Headless_Fuzzyfind_Deactivator::deactivate();
}

register_activation_hook( __FILE__, 'activate_headless_fuzzy_find' );
register_deactivation_hook( __FILE__, 'deactivate_headless_fuzzy_find' );

/**
 * Core plugin class.
 */
require_once HEADLESS_FUZZY_FIND_PLUGIN_DIR . 'includes/class-headless-fuzzy-find.php';

/**
 * Begin plugin execution.
 */
function run_headless_fuzzy_find() {
	$plugin = new Headless_Fuzzyfind();
	$plugin->run();
}
run_headless_fuzzy_find();
