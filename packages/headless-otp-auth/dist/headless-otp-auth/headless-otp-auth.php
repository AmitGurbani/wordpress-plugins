<?php
/**
 * Plugin Name:       Headless OTP Auth
 * Plugin URI:        https://github.com/AmitGurbani/wordpress-plugins
 * Description:       Mobile OTP authentication with JWT for headless WordPress stores.
 * Version:           1.0.0
 * Author:            Amit Gurbani
 * Author URI:        https://github.com/AmitGurbani
 * License:           GPL-2.0+
 * License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain:       headless-otp-auth
 * Domain Path:       /languages
 * Requires at least: 6.7
 * Requires PHP:      8.2
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

define( 'HEADLESS_OTP_AUTH_VERSION', '1.0.0' );
define( 'HEADLESS_OTP_AUTH_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'HEADLESS_OTP_AUTH_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

/**
 * Plugin activation.
 */
function activate_headless_otp_auth() {
	require_once HEADLESS_OTP_AUTH_PLUGIN_DIR . 'includes/class-headless-otp-auth-activator.php';
	Headless_Otp_Auth_Activator::activate();
}

/**
 * Plugin deactivation.
 */
function deactivate_headless_otp_auth() {
	require_once HEADLESS_OTP_AUTH_PLUGIN_DIR . 'includes/class-headless-otp-auth-deactivator.php';
	Headless_Otp_Auth_Deactivator::deactivate();
}

register_activation_hook( __FILE__, 'activate_headless_otp_auth' );
register_deactivation_hook( __FILE__, 'deactivate_headless_otp_auth' );

/**
 * Core plugin class.
 */
require_once HEADLESS_OTP_AUTH_PLUGIN_DIR . 'includes/class-headless-otp-auth.php';

/**
 * Begin plugin execution.
 */
function run_headless_otp_auth() {
	$plugin = new Headless_Otp_Auth();
	$plugin->run();
}
run_headless_otp_auth();
