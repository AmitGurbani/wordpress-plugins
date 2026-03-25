<?php

if ( ! defined( 'WPINC' ) ) {
	die;
}

class Headless_Clarity_Activator {

	public static function activate() {
		update_option( 'headless_clarity_version', '1.0.0' );
	}
}
