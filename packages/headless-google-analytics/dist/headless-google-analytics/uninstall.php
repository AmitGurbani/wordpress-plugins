<?php

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

delete_option( 'headless_google_analytics_measurement_id' );
delete_option( 'headless_google_analytics_api_secret' );
delete_option( 'headless_google_analytics_currency' );
delete_option( 'headless_google_analytics_enable_purchase' );
delete_option( 'headless_google_analytics_version' );
delete_option( 'headless_google_analytics_last_error' );
delete_transient( 'headless_google_analytics_gh_release_cache' );
