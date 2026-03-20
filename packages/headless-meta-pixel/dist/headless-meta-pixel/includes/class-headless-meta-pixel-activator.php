<?php

if ( ! defined( 'WPINC' ) ) {
	die;
}

class Headless_Meta_Pixel_Activator {

	public static function activate() {
		update_option( 'headless_meta_pixel_version', '1.0.0' );
	}
}
