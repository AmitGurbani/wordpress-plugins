<?php

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

delete_option( 'headless_fuzzy_find_weight_title' );
delete_option( 'headless_fuzzy_find_weight_sku' );
delete_option( 'headless_fuzzy_find_weight_content' );
delete_option( 'headless_fuzzy_find_fuzzy_enabled' );
delete_option( 'headless_fuzzy_find_autocomplete_enabled' );
delete_option( 'headless_fuzzy_find_analytics_enabled' );
delete_option( 'headless_fuzzy_find_min_query_length' );
delete_option( 'headless_fuzzy_find_autocomplete_limit' );
delete_option( 'headless_fuzzy_find_did_you_mean_threshold' );
delete_option( 'headless_fuzzy_find_synonyms' );
delete_option( 'headless_fuzzy_find_index_table' );
delete_option( 'headless_fuzzy_find_log_table' );
delete_option( 'headless_fuzzy_find_db_version' );
