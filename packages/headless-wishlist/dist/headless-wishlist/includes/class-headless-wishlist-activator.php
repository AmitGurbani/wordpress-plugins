<?php

if ( ! defined( 'WPINC' ) ) {
	die;
}

class Headless_Wishlist_Activator {

	public static function activate() {
		update_option( 'headless_wishlist_version', '1.0.0' );
	}
}
