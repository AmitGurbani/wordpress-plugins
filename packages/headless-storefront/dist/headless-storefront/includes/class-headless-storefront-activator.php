<?php

if ( ! defined( 'WPINC' ) ) {
	die;
}

class Headless_Storefront_Activator {

	public static function activate() {
		global $wpdb;
		require_once( ABSPATH . 'wp-admin/includes/upgrade.php' );
		$charset_collate = $wpdb->get_charset_collate();
		$table = $wpdb->prefix . 'headless_search_queries';
		$sql = 'CREATE TABLE ' . $table . ' (' . 'id bigint(20) unsigned NOT NULL AUTO_INCREMENT, ' . '`query` varchar(255) NOT NULL, ' . 'count int unsigned NOT NULL DEFAULT 1, ' . 'last_searched datetime NOT NULL, ' . 'PRIMARY KEY  (id), ' . 'UNIQUE KEY query_unique (`query`)' . ') ENGINE=InnoDB ' . $charset_collate . ';';
		dbDelta( $sql );
		add_option( 'headless_storefront_config', array() );
		if ( ! wp_next_scheduled( 'headless_storefront_search_cleanup' ) ) {
			wp_schedule_event( time(), 'weekly', 'headless_storefront_search_cleanup' );
		}
	}
}
