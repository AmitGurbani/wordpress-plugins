<?php

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

delete_option( 'headless_clarity_project_id' );
delete_option( 'headless_clarity_enable_identify' );
delete_option( 'headless_clarity_version' );
delete_option( 'headless_clarity_last_error' );
