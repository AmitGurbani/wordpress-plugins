<?php

if ( ! defined( 'WPINC' ) ) {
	die;
}

class Headless_Fuzzy_Find_Activator {

	public static function activate() {
		global $wpdb;
		if ( ! class_exists( 'WooCommerce' ) ) {
			return;
		}
		require_once( ABSPATH . 'wp-admin/includes/upgrade.php' );
		$charset_collate = $wpdb->get_charset_collate();
		$prefix = $wpdb->prefix;
		$index_table = $prefix . 'ff_search_index';
		$log_table = $prefix . 'ff_search_log';
		$sql_index = 'CREATE TABLE ' . $index_table . ' (' . 'id bigint(20) unsigned NOT NULL AUTO_INCREMENT, ' . 'product_id bigint(20) unsigned NOT NULL, ' . 'title text NOT NULL, ' . 'sku varchar(100) NOT NULL DEFAULT \'\', ' . 'short_desc text NOT NULL, ' . 'content longtext NOT NULL, ' . 'attributes text NOT NULL, ' . 'categories text NOT NULL, ' . 'tags text NOT NULL, ' . 'variation_skus text NOT NULL, ' . 'indexed_at datetime NOT NULL, ' . 'PRIMARY KEY  (id), ' . 'UNIQUE KEY product_id (product_id), ' . 'FULLTEXT KEY ft_title (title), ' . 'FULLTEXT KEY ft_sku (sku), ' . 'FULLTEXT KEY ft_all (title, sku, short_desc, attributes, categories, tags, variation_skus)' . ') ENGINE=InnoDB ' . $charset_collate . ';';
		$sql_log = 'CREATE TABLE ' . $log_table . ' (' . 'id bigint(20) unsigned NOT NULL AUTO_INCREMENT, ' . 'query varchar(200) NOT NULL, ' . 'result_count int NOT NULL DEFAULT 0, ' . 'search_count int NOT NULL DEFAULT 1, ' . 'last_searched datetime NOT NULL, ' . 'PRIMARY KEY  (id), ' . 'UNIQUE KEY query_unique (query), ' . 'KEY result_count (result_count)' . ') ENGINE=InnoDB ' . $charset_collate . ';';
		dbDelta( $sql_index );
		dbDelta( $sql_log );
		update_option( 'headless_fuzzy_find_index_table', $index_table );
		update_option( 'headless_fuzzy_find_log_table', $log_table );
		update_option( 'headless_fuzzy_find_db_version', '1.0.0' );
	}
}
