<?php

if ( ! defined( 'WPINC' ) ) {
	die;
}

class Headless_Pos_Sessions_Public {

	private $plugin_name;
	private $version;

	public function __construct( $plugin_name, $version ) {
		$this->plugin_name = $plugin_name;
		$this->version     = $version;
	}

	public function cleanup_old_sessions() {
		$retention_days = intval( get_option( 'headless_pos_sessions_retention_days', 90 ) );
		if ( $retention_days <= 0 ) {
			return;
		}
		$cutoff_timestamp = time() - $retention_days * 86400;
		$cutoff_date = gmdate( 'c', $cutoff_timestamp );
		$old_sessions = get_posts( array( 'post_type' => 'hpss_pos_session', 'post_status' => 'publish', 'posts_per_page' => 100, 'meta_query' => array( array( 'key' => '_session_status', 'value' => 'closed' ), array( 'key' => '_closed_at', 'value' => $cutoff_date, 'compare' => '<', 'type' => 'CHAR' ) ), 'fields' => 'ids' ) );
		foreach ( $old_sessions as $session_id ) {
			wp_delete_post( intval( $session_id ), true );
		}
	}

	public function auto_close_orphaned_sessions() {
		$cutoff_timestamp = time() - 86400;
		$cutoff_date = gmdate( 'c', $cutoff_timestamp );
		$orphaned_sessions = get_posts( array( 'post_type' => 'hpss_pos_session', 'post_status' => 'publish', 'posts_per_page' => 100, 'meta_query' => array( array( 'key' => '_session_status', 'value' => 'open' ), array( 'key' => '_opened_at', 'value' => $cutoff_date, 'compare' => '<', 'type' => 'CHAR' ) ), 'fields' => 'ids' ) );
		$now = gmdate( 'c', time() );
		foreach ( $orphaned_sessions as $session_id ) {
			$id = intval( $session_id );
			update_post_meta( $id, '_session_status', 'closed' );
			update_post_meta( $id, '_closed_at', $now );
			update_post_meta( $id, '_notes', 'Auto-closed: orphaned session' );
		}
	}

	public function schedule_cron_jobs() {
		if ( ! wp_next_scheduled( 'headless_pos_sessions_daily_cleanup' ) ) {
			wp_schedule_event( time(), 'daily', 'headless_pos_sessions_daily_cleanup' );
		}
		if ( ! wp_next_scheduled( 'headless_pos_sessions_daily_auto_close' ) ) {
			wp_schedule_event( time(), 'daily', 'headless_pos_sessions_daily_auto_close' );
		}
	}

	public function register_custom_post_types() {
		register_post_type( 'hpss_pos_session', array(
			'labels' => array(
				'name'               => __( 'POS Sessions', 'headless-pos-sessions' ),
				'singular_name'      => __( 'POS Session', 'headless-pos-sessions' ),
				'add_new'            => __( 'Add New', 'headless-pos-sessions' ),
				'add_new_item'       => __( 'Add New POS Session', 'headless-pos-sessions' ),
				'edit_item'          => __( 'Edit POS Session', 'headless-pos-sessions' ),
				'new_item'           => __( 'New POS Session', 'headless-pos-sessions' ),
				'view_item'          => __( 'View POS Session', 'headless-pos-sessions' ),
				'search_items'       => __( 'Search POS Sessions', 'headless-pos-sessions' ),
				'not_found'          => __( 'No POS Sessions found', 'headless-pos-sessions' ),
				'not_found_in_trash' => __( 'No POS Sessions found in Trash', 'headless-pos-sessions' ),
				'all_items'          => __( 'All POS Sessions', 'headless-pos-sessions' ),
				'menu_name'          => __( 'POS Sessions', 'headless-pos-sessions' ),
			),
			'public'          => false,
			'show_in_rest'    => false,
			'has_archive'     => false,
			'supports'        => array( 'title' ),
			'menu_icon'       => 'dashicons-admin-post',
			'capability_type'  => 'post',
					) );
	}

}
