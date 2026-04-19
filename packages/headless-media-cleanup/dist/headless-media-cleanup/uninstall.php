<?php

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

delete_option( 'headless_media_cleanup_version' );
delete_transient( 'headless_media_cleanup_gh_release_cache' );

		global $wpdb;
		$wpdb->query( $wpdb->prepare( 'DELETE FROM ' . $wpdb->postmeta . ' WHERE meta_key = %s', '_hmc_tracked_images' ) );
		$wpdb->query( $wpdb->prepare( 'DELETE FROM ' . $wpdb->termmeta . ' WHERE meta_key = %s', '_hmc_tracked_image' ) );
