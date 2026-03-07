<?php
/**
 * Plugin Name:       FuzzyFind for WooCommerce
 * Plugin URI:        
 * Description:       Weighted, fuzzy WooCommerce product search with autocomplete and analytics.
 * Version:           1.0.0
 * Author:            wpts
 * Author URI:        
 * License:           GPL-2.0+
 * License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain:       fuzzyfind
 * Domain Path:       /languages
 * Requires at least: 6.0
 * Requires PHP:      8.0
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

define( 'FUZZY_FIND_FOR_WOO_COMMERCE_VERSION', '1.0.0' );
define( 'FUZZY_FIND_FOR_WOO_COMMERCE_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'FUZZY_FIND_FOR_WOO_COMMERCE_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

/**
 * Plugin activation.
 */
function activate_fuzzy_find_for_woo_commerce() {
	require_once FUZZY_FIND_FOR_WOO_COMMERCE_PLUGIN_DIR . 'includes/class-fuzzy-find-for-woo-commerce-activator.php';
	Fuzzyfind_For_Woocommerce_Activator::activate();
}

/**
 * Plugin deactivation.
 */
function deactivate_fuzzy_find_for_woo_commerce() {
	require_once FUZZY_FIND_FOR_WOO_COMMERCE_PLUGIN_DIR . 'includes/class-fuzzy-find-for-woo-commerce-deactivator.php';
	Fuzzyfind_For_Woocommerce_Deactivator::deactivate();
}

register_activation_hook( __FILE__, 'activate_fuzzy_find_for_woo_commerce' );
register_deactivation_hook( __FILE__, 'deactivate_fuzzy_find_for_woo_commerce' );

/**
 * Core plugin class.
 */
require_once FUZZY_FIND_FOR_WOO_COMMERCE_PLUGIN_DIR . 'includes/class-fuzzy-find-for-woo-commerce.php';

/**
 * Begin plugin execution.
 */
function run_fuzzy_find_for_woo_commerce() {
	$plugin = new Fuzzyfind_For_Woocommerce();
	$plugin->run();
}
run_fuzzy_find_for_woo_commerce();
