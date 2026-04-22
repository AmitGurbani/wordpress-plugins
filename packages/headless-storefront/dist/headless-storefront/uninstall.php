<?php

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

delete_option( 'headless_storefront_config' );

		global $wpdb;
		$wpdb->query( 'DROP TABLE IF EXISTS ' . $wpdb->prefix . 'headless_search_queries' );
		wp_clear_scheduled_hook( 'headless_storefront_search_cleanup' );
