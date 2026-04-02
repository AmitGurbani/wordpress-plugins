<?php

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

delete_option( 'headless_pos_sessions_retention_days' );
delete_option( 'headless_pos_sessions_max_open_sessions' );

// Delete all POS Session posts and their meta
$pos_session_posts = get_posts( array( 'post_type' => 'pos_session', 'posts_per_page' => -1, 'post_status' => 'any', 'fields' => 'ids' ) );
foreach ( $pos_session_posts as $id ) {
	wp_delete_post( $id, true );
}
