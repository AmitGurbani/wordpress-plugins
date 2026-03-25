<?php

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

delete_option( 'headless_google_analytics_measurement_id' );
delete_option( 'headless_google_analytics_api_secret' );
delete_option( 'headless_google_analytics_currency' );
delete_option( 'headless_google_analytics_enable_view_item' );
delete_option( 'headless_google_analytics_enable_add_to_cart' );
delete_option( 'headless_google_analytics_enable_begin_checkout' );
delete_option( 'headless_google_analytics_enable_purchase' );
delete_option( 'headless_google_analytics_enable_search' );
delete_option( 'headless_google_analytics_version' );
