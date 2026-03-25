<?php

if ( ! defined( 'WPINC' ) ) {
	die;
}

class Headless_Google_Analytics_Activator {

	public static function activate() {
		update_option( 'headless_google_analytics_version', '1.0.0' );
	}
}
