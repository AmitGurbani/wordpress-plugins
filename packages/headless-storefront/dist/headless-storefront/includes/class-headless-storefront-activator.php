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
		add_option( 'headless_storefront_config', array( 'colors' => array( 'primary' => '#6366f1', 'secondary' => '#64748b', 'accent' => '#94a3b8' ), 'font_family' => 'Inter', 'tokens' => array( 'section_gap' => '2rem', 'card_padding' => '0.75rem', 'card_radius' => '0.75rem', 'button_radius' => '0.5rem', 'image_radius' => '0.5rem', 'card_shadow' => 'none', 'card_hover_shadow' => '0 4px 12px oklch(0 0 0 / 0.1)', 'hover_duration' => '150ms' ) ) );
		if ( ! wp_next_scheduled( 'headless_storefront_search_cleanup' ) ) {
			wp_schedule_event( time(), 'weekly', 'headless_storefront_search_cleanup' );
		}
	}
}
