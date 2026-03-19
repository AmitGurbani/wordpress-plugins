<?php

if ( ! defined( 'WPINC' ) ) {
	die;
}

class Meta_Pixel_Activator {

	public static function activate() {
		update_option( 'meta_pixel_version', '1.0.0' );
	}
}
