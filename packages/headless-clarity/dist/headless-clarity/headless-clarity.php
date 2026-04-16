<?php
/**
 * Plugin Name:       Headless Clarity
 * Plugin URI:        https://github.com/AmitGurbani/wordpress-plugins
 * Description:       Microsoft Clarity session recordings and heatmaps for headless WordPress.
 * Version:           1.0.0
 * Author:            Amit Gurbani
 * Author URI:        https://github.com/AmitGurbani
 * License:           GPL-2.0+
 * License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain:       headless-clarity
 * Domain Path:       /languages
 * Requires at least: 6.0
 * Requires PHP:      8.0
 * Update URI:       https://github.com/AmitGurbani/wordpress-plugins/releases?plugin=headless-clarity
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

define( 'HEADLESS_CLARITY_VERSION', '1.0.0' );
define( 'HEADLESS_CLARITY_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'HEADLESS_CLARITY_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

/**
 * Plugin activation.
 */
function activate_headless_clarity() {
	require_once HEADLESS_CLARITY_PLUGIN_DIR . 'includes/class-headless-clarity-activator.php';
	Headless_Clarity_Activator::activate();
}

/**
 * Plugin deactivation.
 */
function deactivate_headless_clarity() {
	require_once HEADLESS_CLARITY_PLUGIN_DIR . 'includes/class-headless-clarity-deactivator.php';
	Headless_Clarity_Deactivator::deactivate();
}

register_activation_hook( __FILE__, 'activate_headless_clarity' );
register_deactivation_hook( __FILE__, 'deactivate_headless_clarity' );

/**
 * Core plugin class.
 */
require_once HEADLESS_CLARITY_PLUGIN_DIR . 'includes/class-headless-clarity.php';
require_once HEADLESS_CLARITY_PLUGIN_DIR . 'includes/class-headless-clarity-updater.php';

/**
 * Begin plugin execution.
 */
function run_headless_clarity() {
	( new Headless_Clarity_Updater( __FILE__, HEADLESS_CLARITY_VERSION ) )->register();
	$plugin = new Headless_Clarity();
	$plugin->run();
}
run_headless_clarity();
