<?php
/**
 * Plugin Name:       Meta Pixel
 * Plugin URI:        
 * Description:       Meta Pixel with WooCommerce integration and Conversions API for headless WordPress.
 * Version:           1.0.0
 * Author:            wpts
 * Author URI:        
 * License:           GPL-2.0+
 * License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain:       meta-pixel
 * Domain Path:       /languages
 * Requires at least: 6.0
 * Requires PHP:      8.0
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

define( 'META_PIXEL_VERSION', '1.0.0' );
define( 'META_PIXEL_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'META_PIXEL_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

/**
 * Plugin activation.
 */
function activate_meta_pixel() {
	require_once META_PIXEL_PLUGIN_DIR . 'includes/class-meta-pixel-activator.php';
	Meta_Pixel_Activator::activate();
}

/**
 * Plugin deactivation.
 */
function deactivate_meta_pixel() {
	require_once META_PIXEL_PLUGIN_DIR . 'includes/class-meta-pixel-deactivator.php';
	Meta_Pixel_Deactivator::deactivate();
}

register_activation_hook( __FILE__, 'activate_meta_pixel' );
register_deactivation_hook( __FILE__, 'deactivate_meta_pixel' );

/**
 * Core plugin class.
 */
require_once META_PIXEL_PLUGIN_DIR . 'includes/class-meta-pixel.php';

/**
 * Begin plugin execution.
 */
function run_meta_pixel() {
	$plugin = new Meta_Pixel();
	$plugin->run();
}
run_meta_pixel();
