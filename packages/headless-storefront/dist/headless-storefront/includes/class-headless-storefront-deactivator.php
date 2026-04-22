<?php

if ( ! defined( 'WPINC' ) ) {
	die;
}

class Headless_Storefront_Deactivator {

	public static function deactivate() {
		wp_clear_scheduled_hook( 'headless_storefront_search_cleanup' );
	}
}
