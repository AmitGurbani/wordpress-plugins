<?php

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

delete_option( 'headless_umami_umami_url' );
delete_option( 'headless_umami_website_id' );
delete_option( 'headless_umami_enable_purchase' );
delete_option( 'headless_umami_version' );
delete_option( 'headless_umami_last_error' );
delete_transient( 'headless_umami_gh_release_cache' );
