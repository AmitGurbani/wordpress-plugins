<?php

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

delete_option( 'headless_media_cleanup_version' );

		global $wpdb;
		$wpdb->query( $wpdb->prepare( 'DELETE FROM ' . $wpdb->postmeta . ' WHERE meta_key = %s', '_headless_media_cleanup_tracked_images' ) );
		$wpdb->query( $wpdb->prepare( 'DELETE FROM ' . $wpdb->termmeta . ' WHERE meta_key = %s', '_headless_media_cleanup_tracked_image' ) );
