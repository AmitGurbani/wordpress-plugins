<?php

if ( ! defined( 'WPINC' ) ) {
	die;
}

class Headless_Umami_Activator {

	public static function activate() {
		update_option( 'headless_umami_version', '1.0.0' );
	}
}
