<?php

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

delete_option( 'headless_wishlist_version' );
delete_transient( 'headless_wishlist_gh_release_cache' );
