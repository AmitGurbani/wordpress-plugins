<?php

if ( ! defined( 'WPINC' ) ) {
	die;
}

class Headless_Media_Cleanup_Activator {

	public static function activate() {
		update_option( 'headless_media_cleanup_version', '1.0.0' );
	}
}
