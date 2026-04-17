<?php
/**
 * Plugin Name:       Headless Auth
 * Plugin URI:        https://github.com/AmitGurbani/wordpress-plugins
 * Description:       OTP and password authentication with JWT for headless WordPress stores.
 * Version:           1.2.2
 * Author:            Amit Gurbani
 * Author URI:        https://github.com/AmitGurbani
 * License:           GPL-2.0+
 * License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain:       headless-auth
 * Domain Path:       /languages
 * Requires at least: 6.7
 * Requires PHP:      8.2
 * Update URI:       https://github.com/AmitGurbani/wordpress-plugins/releases?plugin=headless-auth
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

define( 'HEADLESS_AUTH_VERSION', '1.2.2' );
define( 'HEADLESS_AUTH_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'HEADLESS_AUTH_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

/**
 * Plugin activation.
 */
function activate_headless_auth() {
	require_once HEADLESS_AUTH_PLUGIN_DIR . 'includes/class-headless-auth-activator.php';
	Headless_Auth_Activator::activate();
}

/**
 * Plugin deactivation.
 */
function deactivate_headless_auth() {
	require_once HEADLESS_AUTH_PLUGIN_DIR . 'includes/class-headless-auth-deactivator.php';
	Headless_Auth_Deactivator::deactivate();
}

register_activation_hook( __FILE__, 'activate_headless_auth' );
register_deactivation_hook( __FILE__, 'deactivate_headless_auth' );

/**
 * Core plugin class.
 */
require_once HEADLESS_AUTH_PLUGIN_DIR . 'includes/class-headless-auth.php';
require_once HEADLESS_AUTH_PLUGIN_DIR . 'includes/class-headless-auth-updater.php';

/**
 * Begin plugin execution.
 */
function run_headless_auth() {
	( new Headless_Auth_Updater( __FILE__, HEADLESS_AUTH_VERSION ) )->register();
	$plugin = new Headless_Auth();
	$plugin->run();
}
run_headless_auth();
