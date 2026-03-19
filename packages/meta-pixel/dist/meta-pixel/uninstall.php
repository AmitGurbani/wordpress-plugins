<?php

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

delete_option( 'meta_pixel_pixel_id' );
delete_option( 'meta_pixel_access_token' );
delete_option( 'meta_pixel_test_event_code' );
delete_option( 'meta_pixel_currency' );
delete_option( 'meta_pixel_enable_view_content' );
delete_option( 'meta_pixel_enable_add_to_cart' );
delete_option( 'meta_pixel_enable_initiate_checkout' );
delete_option( 'meta_pixel_enable_purchase' );
delete_option( 'meta_pixel_enable_search' );
delete_option( 'meta_pixel_enable_capi' );
delete_option( 'meta_pixel_version' );
