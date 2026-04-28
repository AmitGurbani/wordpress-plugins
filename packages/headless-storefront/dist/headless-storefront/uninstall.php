<?php

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

delete_option( 'headless_storefront_config' );
delete_option( 'headless_storefront_last_revalidate_at' );
