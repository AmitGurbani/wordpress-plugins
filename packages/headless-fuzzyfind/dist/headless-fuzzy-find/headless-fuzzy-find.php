<?php
/**
 * Plugin Name:       Headless FuzzyFind
 * Plugin URI:        
 * Description:       Weighted, fuzzy WooCommerce product search with autocomplete and analytics.
 * Version:           1.0.0
 * Author:            wpts
 * Author URI:        
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
