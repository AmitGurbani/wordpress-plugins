<?php

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

delete_option( 'fuzzy_find_for_woo_commerce_weight_title' );
delete_option( 'fuzzy_find_for_woo_commerce_weight_sku' );
delete_option( 'fuzzy_find_for_woo_commerce_weight_content' );
delete_option( 'fuzzy_find_for_woo_commerce_fuzzy_enabled' );
delete_option( 'fuzzy_find_for_woo_commerce_autocomplete_enabled' );
delete_option( 'fuzzy_find_for_woo_commerce_analytics_enabled' );
delete_option( 'fuzzy_find_for_woo_commerce_min_query_length' );
delete_option( 'fuzzy_find_for_woo_commerce_autocomplete_limit' );
delete_option( 'fuzzy_find_for_woo_commerce_did_you_mean_threshold' );
delete_option( 'fuzzy_find_for_woo_commerce_synonyms' );
delete_option( 'fuzzyfind_index_table' );
delete_option( 'fuzzyfind_log_table' );
delete_option( 'fuzzyfind_db_version' );
