<?php

if ( ! defined( 'WPINC' ) ) {
	die;
}

class Headless_Auth_Activator {

	public static function activate() {
		$existing_secret = get_option( 'headless_auth_jwt_secret_key', '' );
		if ( ! $existing_secret ) {
			$secret = wp_generate_password( 64, true, true );
			update_option( 'headless_auth_jwt_secret_key', $secret );
		}
	}
}
