<?php

if ( ! defined( 'WPINC' ) ) {
	die;
}

class Headless_Fuzzyfind_Rest_Api {

	private $namespace;

	public function __construct( $plugin_slug ) {
		$this->namespace = $plugin_slug . '/v1';
	}

	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/settings',
			array(
				array(
					'methods'             => 'GET',
					'callback'            => array( $this, 'get_settings' ),
					'permission_callback' => array( $this, 'check_permissions' ),
				),
				array(
					'methods'             => 'POST',
					'callback'            => array( $this, 'update_settings' ),
					'permission_callback' => array( $this, 'check_permissions' ),
				),
			)
		);
		register_rest_route(
			$this->namespace,
			'/search',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'search' ),
				'permission_callback' => '__return_true',
			)
		);
		register_rest_route(
			$this->namespace,
			'/autocomplete',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'autocomplete' ),
				'permission_callback' => '__return_true',
			)
		);
		register_rest_route(
			$this->namespace,
			'/index/status',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'get_index_status' ),
				'permission_callback' => function() {
					return current_user_can( 'manage_options' );
				},
			)
		);
		register_rest_route(
			$this->namespace,
			'/index/rebuild',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'rebuild_index' ),
				'permission_callback' => function() {
					return current_user_can( 'manage_options' );
				},
			)
		);
		register_rest_route(
			$this->namespace,
			'/index/delete',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'delete_index' ),
				'permission_callback' => function() {
					return current_user_can( 'manage_options' );
				},
			)
		);
		register_rest_route(
			$this->namespace,
			'/analytics',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'get_analytics' ),
				'permission_callback' => function() {
					return current_user_can( 'manage_options' );
				},
			)
		);
		register_rest_route(
			$this->namespace,
			'/analytics/clear',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'clear_analytics' ),
				'permission_callback' => function() {
					return current_user_can( 'manage_options' );
				},
			)
		);
	}

	public function check_permissions() {
		return current_user_can( 'manage_options' );
	}

	public function get_settings( $request ) {
		$settings = array(
			'weight_title' => get_option( 'headless_fuzzy_find_weight_title', 10 ),
			'weight_sku' => get_option( 'headless_fuzzy_find_weight_sku', 8 ),
			'weight_content' => get_option( 'headless_fuzzy_find_weight_content', 2 ),
			'fuzzy_enabled' => (bool) get_option( 'headless_fuzzy_find_fuzzy_enabled', true ),
			'autocomplete_enabled' => (bool) get_option( 'headless_fuzzy_find_autocomplete_enabled', true ),
			'analytics_enabled' => (bool) get_option( 'headless_fuzzy_find_analytics_enabled', true ),
			'min_query_length' => get_option( 'headless_fuzzy_find_min_query_length', 2 ),
			'autocomplete_limit' => get_option( 'headless_fuzzy_find_autocomplete_limit', 8 ),
			'did_you_mean_threshold' => get_option( 'headless_fuzzy_find_did_you_mean_threshold', 3 ),
			'synonyms' => get_option( 'headless_fuzzy_find_synonyms', '' ),
		);

		return rest_ensure_response( $settings );
	}

	public function update_settings( $request ) {
		$params = $request->get_json_params();

		if ( isset( $params['weight_title'] ) ) {
			$value = absint( $params['weight_title'] );
			if ( null === $value ) {
				return new \WP_Error(
					'invalid_weight_title',
					'Invalid value for weight_title.',
					array( 'status' => 400 )
				);
			}
			update_option( 'headless_fuzzy_find_weight_title', $value );
		}
		if ( isset( $params['weight_sku'] ) ) {
			$value = absint( $params['weight_sku'] );
			if ( null === $value ) {
				return new \WP_Error(
					'invalid_weight_sku',
					'Invalid value for weight_sku.',
					array( 'status' => 400 )
				);
			}
			update_option( 'headless_fuzzy_find_weight_sku', $value );
		}
		if ( isset( $params['weight_content'] ) ) {
			$value = absint( $params['weight_content'] );
			if ( null === $value ) {
				return new \WP_Error(
					'invalid_weight_content',
					'Invalid value for weight_content.',
					array( 'status' => 400 )
				);
			}
			update_option( 'headless_fuzzy_find_weight_content', $value );
		}
		if ( isset( $params['fuzzy_enabled'] ) ) {
			$value = rest_sanitize_boolean( $params['fuzzy_enabled'] );
			if ( null === $value ) {
				return new \WP_Error(
					'invalid_fuzzy_enabled',
					'Invalid value for fuzzy_enabled.',
					array( 'status' => 400 )
				);
			}
			update_option( 'headless_fuzzy_find_fuzzy_enabled', $value );
		}
		if ( isset( $params['autocomplete_enabled'] ) ) {
			$value = rest_sanitize_boolean( $params['autocomplete_enabled'] );
			if ( null === $value ) {
				return new \WP_Error(
					'invalid_autocomplete_enabled',
					'Invalid value for autocomplete_enabled.',
					array( 'status' => 400 )
				);
			}
			update_option( 'headless_fuzzy_find_autocomplete_enabled', $value );
		}
		if ( isset( $params['analytics_enabled'] ) ) {
			$value = rest_sanitize_boolean( $params['analytics_enabled'] );
			if ( null === $value ) {
				return new \WP_Error(
					'invalid_analytics_enabled',
					'Invalid value for analytics_enabled.',
					array( 'status' => 400 )
				);
			}
			update_option( 'headless_fuzzy_find_analytics_enabled', $value );
		}
		if ( isset( $params['min_query_length'] ) ) {
			$value = absint( $params['min_query_length'] );
			if ( null === $value ) {
				return new \WP_Error(
					'invalid_min_query_length',
					'Invalid value for min_query_length.',
					array( 'status' => 400 )
				);
			}
			update_option( 'headless_fuzzy_find_min_query_length', $value );
		}
		if ( isset( $params['autocomplete_limit'] ) ) {
			$value = absint( $params['autocomplete_limit'] );
			if ( null === $value ) {
				return new \WP_Error(
					'invalid_autocomplete_limit',
					'Invalid value for autocomplete_limit.',
					array( 'status' => 400 )
				);
			}
			update_option( 'headless_fuzzy_find_autocomplete_limit', $value );
		}
		if ( isset( $params['did_you_mean_threshold'] ) ) {
			$value = absint( $params['did_you_mean_threshold'] );
			if ( null === $value ) {
				return new \WP_Error(
					'invalid_did_you_mean_threshold',
					'Invalid value for did_you_mean_threshold.',
					array( 'status' => 400 )
				);
			}
			update_option( 'headless_fuzzy_find_did_you_mean_threshold', $value );
		}
		if ( isset( $params['synonyms'] ) ) {
			$value = sanitize_textarea_field( $params['synonyms'] );
			if ( null === $value ) {
				return new \WP_Error(
					'invalid_synonyms',
					'Invalid value for synonyms.',
					array( 'status' => 400 )
				);
			}
			update_option( 'headless_fuzzy_find_synonyms', $value );
		}

		return rest_ensure_response( array( 'success' => true ) );
	}

	public function search( $request ) {
		global $wpdb;
		if ( ! class_exists( 'WooCommerce' ) ) {
			return new WP_Error( 'woocommerce_required', 'WooCommerce is not active.', array( 'status' => 400 ) );
		}
		$query = sanitize_text_field( $request->get_param( 'query' ) ?? '' );
		$page = intval( $request->get_param( 'page' ) ?? 1 );
		$raw_per_page = intval( $request->get_param( 'per_page' ) ?? 10 );
		$per_page = $raw_per_page > 100 ? 100 : ($raw_per_page < 1 ? 1 : $raw_per_page);
		$orderby = sanitize_text_field( $request->get_param( 'orderby' ) ?? 'relevance' );
		$min_length = intval( get_option( 'headless_fuzzy_find_min_query_length', 2 ) );
		if ( strlen( $query ) < $min_length ) {
			return rest_ensure_response( array( 'results' => array(), 'total' => 0, 'total_pages' => 0, 'page' => $page, 'per_page' => $per_page, 'did_you_mean' => array() ) );
		}
		$table_name = get_option( 'headless_fuzzyfind_index_table', '' );
		if ( ! $table_name ) {
			return rest_ensure_response( array( 'results' => array(), 'total' => 0, 'total_pages' => 0, 'page' => $page, 'per_page' => $per_page, 'did_you_mean' => array() ) );
		}
		$boolean_query = $this->build_boolean_query( $query );
		if ( ! $boolean_query ) {
			return rest_ensure_response( array( 'results' => array(), 'total' => 0, 'total_pages' => 0, 'page' => $page, 'per_page' => $per_page, 'did_you_mean' => array() ) );
		}
		$w_title = intval( get_option( 'headless_fuzzy_find_weight_title', 10 ) );
		$w_sku = intval( get_option( 'headless_fuzzy_find_weight_sku', 8 ) );
		$w_content = intval( get_option( 'headless_fuzzy_find_weight_content', 2 ) );
		$posts_table = $wpdb->posts;
		$did_you_mean = array();
		$total = intval( $wpdb->get_var( $wpdb->prepare( 'SELECT COUNT(DISTINCT ff_si.product_id) FROM %i AS ff_si INNER JOIN %i AS p ON ff_si.product_id = p.ID WHERE p.post_status = %s AND MATCH(ff_si.title, ff_si.sku, ff_si.short_desc, ff_si.attributes, ff_si.categories, ff_si.tags, ff_si.variation_skus) AGAINST (%s IN BOOLEAN MODE)', $table_name, $posts_table, 'publish', $boolean_query ) ) ?? '0' );
		if ( $total === 0 ) {
			$corrected = $this->get_corrected_query( $query, $table_name );
			if ( $corrected ) {
				$boolean_query = $this->build_boolean_query( $corrected );
				if ( $boolean_query ) {
					$total = intval( $wpdb->get_var( $wpdb->prepare( 'SELECT COUNT(DISTINCT ff_si.product_id) FROM %i AS ff_si INNER JOIN %i AS p ON ff_si.product_id = p.ID WHERE p.post_status = %s AND MATCH(ff_si.title, ff_si.sku, ff_si.short_desc, ff_si.attributes, ff_si.categories, ff_si.tags, ff_si.variation_skus) AGAINST (%s IN BOOLEAN MODE)', $table_name, $posts_table, 'publish', $boolean_query ) ) ?? '0' );
				}
			}
		}
		$use_like = false;
		if ( $total === 0 && strlen( $query ) < 3 ) {
			$escaped_query = $wpdb->esc_like( $query );
			$like_pattern = '%' . $escaped_query . '%';
			$total = intval( $wpdb->get_var( $wpdb->prepare( 'SELECT COUNT(DISTINCT ff_si.product_id) FROM %i AS ff_si INNER JOIN %i AS p ON ff_si.product_id = p.ID WHERE p.post_status = %s AND (ff_si.title LIKE %s OR ff_si.sku LIKE %s)', $table_name, $posts_table, 'publish', $like_pattern, $like_pattern ) ) ?? '0' );
			$use_like = true;
		}
		$total_pages = $total > 0 ? intval( ceil( $total / $per_page ) ) : 0;
		$offset = ($page - 1) * $per_page;
		if ( $total === 0 ) {
			$threshold = intval( get_option( 'headless_fuzzy_find_did_you_mean_threshold', 3 ) );
			if ( $threshold > 0 ) {
				$did_you_mean = $this->get_did_you_mean_suggestions( $query, $table_name );
			}
			$this->log_search( $query, 0 );
			return rest_ensure_response( array( 'results' => array(), 'total' => 0, 'total_pages' => 0, 'page' => $page, 'per_page' => $per_page, 'did_you_mean' => $did_you_mean ) );
		}
		$rows = null;
		if ( $use_like ) {
			$escaped_query = $wpdb->esc_like( $query );
			$like_pattern = '%' . $escaped_query . '%';
			$rows = $wpdb->get_results( $wpdb->prepare( 'SELECT ff_si.product_id, ff_si.title, ff_si.sku, ff_si.short_desc FROM %i AS ff_si INNER JOIN %i AS p ON ff_si.product_id = p.ID WHERE p.post_status = %s AND (ff_si.title LIKE %s OR ff_si.sku LIKE %s) ORDER BY ff_si.title ASC LIMIT %d OFFSET %d', $table_name, $posts_table, 'publish', $like_pattern, $like_pattern, $per_page, $offset ), 'ARRAY_A' ) ?? array();
		} else {
			if ( $orderby === 'title' ) {
				$rows = $wpdb->get_results( $wpdb->prepare( 'SELECT ff_si.product_id, ff_si.title, ff_si.sku, ff_si.short_desc FROM %i AS ff_si INNER JOIN %i AS p ON ff_si.product_id = p.ID WHERE p.post_status = %s AND MATCH(ff_si.title, ff_si.sku, ff_si.short_desc, ff_si.attributes, ff_si.categories, ff_si.tags, ff_si.variation_skus) AGAINST (%s IN BOOLEAN MODE) ORDER BY ff_si.title ASC LIMIT %d OFFSET %d', $table_name, $posts_table, 'publish', $boolean_query, $per_page, $offset ), 'ARRAY_A' ) ?? array();
			} else {
				$rows = $wpdb->get_results( $wpdb->prepare( 'SELECT ff_si.product_id, ff_si.title, ff_si.sku, ff_si.short_desc, (MATCH(ff_si.title) AGAINST (%s IN BOOLEAN MODE) * %d + MATCH(ff_si.sku) AGAINST (%s IN BOOLEAN MODE) * %d + MATCH(ff_si.title, ff_si.sku, ff_si.short_desc, ff_si.attributes, ff_si.categories, ff_si.tags, ff_si.variation_skus) AGAINST (%s IN BOOLEAN MODE) * %d) AS relevance_score FROM %i AS ff_si INNER JOIN %i AS p ON ff_si.product_id = p.ID WHERE p.post_status = %s AND MATCH(ff_si.title, ff_si.sku, ff_si.short_desc, ff_si.attributes, ff_si.categories, ff_si.tags, ff_si.variation_skus) AGAINST (%s IN BOOLEAN MODE) ORDER BY relevance_score DESC LIMIT %d OFFSET %d', $boolean_query, $w_title, $boolean_query, $w_sku, $boolean_query, $w_content, $table_name, $posts_table, 'publish', $boolean_query, $per_page, $offset ), 'ARRAY_A' ) ?? array();
			}
		}
		$product_ids = array();
		foreach ( $rows as $row ) {
			array_push( $product_ids, intval( $row['product_id'] ) );
		}
		$products = count( $product_ids ) > 0 ? wc_get_products( array( 'include' => $product_ids, 'limit' => count( $product_ids ), 'return' => 'objects' ) ) : array();
		$product_map = array();
		foreach ( $products as $product ) {
			if ( $product ) {
				$product_map[$product->get_id()] = $product;
			}
		}
		$results = array();
		foreach ( $rows as $row ) {
			$product_id = intval( $row['product_id'] );
			$product = $product_map[$product_id] ?? null;
			if ( ! $product ) {
				continue;
			}
			$image_id = $product->get_image_id();
			$image_url = '';
			if ( $image_id ) {
				$image_src = wp_get_attachment_image_src( $image_id, 'thumbnail' );
				if ( ($image_src !== null ? $image_src[0] : null) ) {
					$image_url = $image_src[0];
				}
			}
			$item = array( 'id' => $product_id, 'title' => $row['title'], 'sku' => $row['sku'] ?? '', 'price' => $product->get_price() ?? '', 'price_html' => $product->get_price_html() ?? '', 'permalink' => get_permalink( $product_id ) ?? '', 'image' => $image_url, 'short_description' => $row['short_desc'] ?? '' );
			if ( $row['relevance_score'] ) {
				$item['relevance_score'] = floatval( $row['relevance_score'] );
			}
			array_push( $results, $item );
		}
		$threshold = intval( get_option( 'headless_fuzzy_find_did_you_mean_threshold', 3 ) );
		if ( count( $results ) < $threshold ) {
			$did_you_mean = $this->get_did_you_mean_suggestions( $query, $table_name );
		}
		$this->log_search( $query, $total );
		return rest_ensure_response( array( 'results' => $results, 'total' => $total, 'total_pages' => $total_pages, 'page' => $page, 'per_page' => $per_page, 'did_you_mean' => $did_you_mean ) );
	}

	public function autocomplete( $request ) {
		global $wpdb;
		if ( ! class_exists( 'WooCommerce' ) ) {
			return new WP_Error( 'woocommerce_required', 'WooCommerce is not active.', array( 'status' => 400 ) );
		}
		$autocomplete_enabled = get_option( 'headless_fuzzy_find_autocomplete_enabled', '1' );
		if ( $autocomplete_enabled !== '1' ) {
			return new WP_Error( 'autocomplete_disabled', 'Autocomplete is disabled.', array( 'status' => 403 ) );
		}
		$query = sanitize_text_field( $request->get_param( 'query' ) ?? '' );
		$raw_limit = intval( $request->get_param( 'limit' ) ?? get_option( 'headless_fuzzy_find_autocomplete_limit', 8 ) );
		$limit = $raw_limit > 50 ? 50 : ($raw_limit < 1 ? 1 : $raw_limit);
		$min_length = intval( get_option( 'headless_fuzzy_find_min_query_length', 2 ) );
		if ( strlen( $query ) < $min_length ) {
			return rest_ensure_response( array( 'results' => array(), 'did_you_mean' => array() ) );
		}
		$table_name = get_option( 'headless_fuzzyfind_index_table', '' );
		if ( ! $table_name ) {
			return rest_ensure_response( array( 'results' => array(), 'did_you_mean' => array() ) );
		}
		$results = array();
		$boolean_query = $this->build_boolean_query( $query );
		if ( ! $boolean_query ) {
			return rest_ensure_response( array( 'results' => array(), 'did_you_mean' => array() ) );
		}
		$posts_table_ac = $wpdb->posts;
		$results = $wpdb->get_results( $wpdb->prepare( 'SELECT ff_si.product_id, ff_si.title, ff_si.sku FROM %i AS ff_si INNER JOIN %i AS p ON ff_si.product_id = p.ID WHERE p.post_status = %s AND MATCH(ff_si.title, ff_si.sku, ff_si.short_desc, ff_si.attributes, ff_si.categories, ff_si.tags, ff_si.variation_skus) AGAINST (%s IN BOOLEAN MODE) ORDER BY MATCH(ff_si.title) AGAINST (%s IN BOOLEAN MODE) DESC LIMIT %d', $table_name, $posts_table_ac, 'publish', $boolean_query, $boolean_query, $limit ), 'ARRAY_A' );
		if ( ! $results || count( $results ) === 0 ) {
			$escaped_query = $wpdb->esc_like( $query );
			$like_pattern = '%' . $escaped_query . '%';
			$results = $wpdb->get_results( $wpdb->prepare( 'SELECT ff_si.product_id, ff_si.title, ff_si.sku FROM %i AS ff_si INNER JOIN %i AS p ON ff_si.product_id = p.ID WHERE p.post_status = %s AND (ff_si.title LIKE %s OR ff_si.sku LIKE %s) LIMIT %d', $table_name, $posts_table_ac, 'publish', $like_pattern, $like_pattern, $limit ), 'ARRAY_A' );
		}
		if ( ! $results ) {
			$results = array();
		}
		$product_ids = array();
		foreach ( $results as $row ) {
			array_push( $product_ids, intval( $row['product_id'] ) );
		}
		$products = count( $product_ids ) > 0 ? wc_get_products( array( 'include' => $product_ids, 'limit' => count( $product_ids ), 'return' => 'objects' ) ) : array();
		$product_map = array();
		foreach ( $products as $product ) {
			if ( $product ) {
				$product_map[$product->get_id()] = $product;
			}
		}
		$suggestions = array();
		foreach ( $results as $row ) {
			$product_id = intval( $row['product_id'] );
			$product = $product_map[$product_id] ?? null;
			if ( ! $product ) {
				continue;
			}
			$image_id = $product->get_image_id();
			$image_url = '';
			if ( $image_id ) {
				$image_src = wp_get_attachment_image_src( $image_id, 'thumbnail' );
				if ( ($image_src !== null ? $image_src[0] : null) ) {
					$image_url = $image_src[0];
				}
			}
			array_push( $suggestions, array( 'id' => $product_id, 'title' => $row['title'], 'sku' => $row['sku'] ?? '', 'price' => $product->get_price() ?? '', 'price_html' => $product->get_price_html() ?? '', 'permalink' => get_permalink( $product_id ) ?? '', 'image' => $image_url ) );
		}
		$did_you_mean = array();
		$threshold = intval( get_option( 'headless_fuzzy_find_did_you_mean_threshold', 3 ) );
		if ( count( $suggestions ) < $threshold ) {
			$did_you_mean = $this->get_did_you_mean_suggestions( $query, $table_name );
		}
		return rest_ensure_response( array( 'results' => $suggestions, 'did_you_mean' => $did_you_mean ) );
	}

	public function get_index_status( $request ) {
		global $wpdb;
		$table_name = get_option( 'headless_fuzzyfind_index_table', '' );
		$is_indexing = get_option( 'headless_fuzzyfind_reindex_in_progress', '' );
		$last_indexed = get_option( 'headless_fuzzyfind_last_indexed', '' );
		$total_indexed = 0;
		if ( $table_name ) {
			$count = $wpdb->get_var( $wpdb->prepare( 'SELECT COUNT(*) FROM %i', $table_name ) );
			if ( $count ) {
				$total_indexed = intval( $count );
			}
		}
		$total_products = 0;
		if ( class_exists( 'WooCommerce' ) ) {
			$count = $wpdb->get_var( $wpdb->prepare( 'SELECT COUNT(*) FROM %i WHERE post_type = \'product\' AND post_status = \'publish\'', $wpdb->posts ) );
			$total_products = $count ? intval( $count ) : 0;
		}
		return rest_ensure_response( array( 'total_products' => $total_products, 'total_indexed' => $total_indexed, 'last_indexed' => $last_indexed ? intval( $last_indexed ) : null, 'is_indexing' => $is_indexing === '1' ) );
	}

	public function rebuild_index( $request ) {
		global $wpdb;
		if ( ! class_exists( 'WooCommerce' ) ) {
			return new WP_Error( 'woocommerce_required', 'WooCommerce is not active.', array( 'status' => 400 ) );
		}
		$is_indexing = get_option( 'headless_fuzzyfind_reindex_in_progress', '' );
		if ( $is_indexing === '1' ) {
			$flag_time = intval( get_option( 'headless_fuzzyfind_reindex_started', '0' ) );
			if ( $flag_time > 0 && time() - $flag_time < 600 ) {
				return new WP_Error( 'already_indexing', 'A reindex is already in progress.', array( 'status' => 409 ) );
			}
		}
		update_option( 'headless_fuzzyfind_reindex_in_progress', '1' );
		update_option( 'headless_fuzzyfind_reindex_started', time() );
		$count = $wpdb->get_var( $wpdb->prepare( 'SELECT COUNT(*) FROM %i WHERE post_type = \'product\' AND post_status = \'publish\'', $wpdb->posts ) );
		$total_products = $count ? intval( $count ) : 0;
		if ( $total_products <= 500 ) {
			do_action( 'headless_fuzzyfind_do_reindex' );
			return rest_ensure_response( array( 'message' => 'Reindex completed.', 'total_products' => $total_products ) );
		}
		$scheduled = wp_next_scheduled( 'headless_fuzzyfind_do_reindex' );
		if ( ! $scheduled ) {
			wp_schedule_single_event( time() + 5, 'headless_fuzzyfind_do_reindex' );
		}
		return rest_ensure_response( array( 'message' => 'Reindex scheduled. This may take a few minutes.', 'total_products' => $total_products ) );
	}

	public function delete_index( $request ) {
		global $wpdb;
		$table_name = get_option( 'headless_fuzzyfind_index_table', '' );
		if ( $table_name ) {
			$wpdb->query( $wpdb->prepare( 'TRUNCATE TABLE %i', $table_name ) );
		}
		delete_option( 'headless_fuzzyfind_last_indexed' );
		delete_option( 'headless_fuzzyfind_reindex_in_progress' );
		return rest_ensure_response( array( 'message' => 'Index cleared.' ) );
	}

	public function get_analytics( $request ) {
		global $wpdb;
		$log_table = get_option( 'headless_fuzzyfind_log_table', '' );
		if ( ! $log_table ) {
			return rest_ensure_response( array( 'popular' => array(), 'zero_results' => array() ) );
		}
		$popular = $wpdb->get_results( $wpdb->prepare( 'SELECT query, search_count, result_count, last_searched FROM %i WHERE result_count > 0 ORDER BY search_count DESC LIMIT 20', $log_table ) ) ?? array();
		$zero_results = $wpdb->get_results( $wpdb->prepare( 'SELECT query, search_count, last_searched FROM %i WHERE result_count = 0 ORDER BY search_count DESC LIMIT 20', $log_table ) ) ?? array();
		return rest_ensure_response( array( 'popular' => $popular, 'zero_results' => $zero_results ) );
	}

	public function clear_analytics( $request ) {
		global $wpdb;
		$log_table = get_option( 'headless_fuzzyfind_log_table', '' );
		if ( $log_table ) {
			$wpdb->query( $wpdb->prepare( 'TRUNCATE TABLE %i', $log_table ) );
		}
		return rest_ensure_response( array( 'message' => 'Analytics cleared.' ) );
	}

	public function correct_words( $search_term, $table_name ) {
		global $wpdb;
		$fuzzy_enabled = get_option( 'headless_fuzzy_find_fuzzy_enabled', '1' );
		if ( $fuzzy_enabled !== '1' ) {
			return array( 'corrected' => '', 'hasCorrected' => false );
		}
		$posts_table_cw = $wpdb->posts;
		$titles = $wpdb->get_col( $wpdb->prepare( 'SELECT DISTINCT ff_si.title FROM %i AS ff_si INNER JOIN %i AS p ON ff_si.product_id = p.ID WHERE p.post_status = %s LIMIT 500', $table_name, $posts_table_cw, 'publish' ) ) ?? array();
		$index_words = array();
		foreach ( $titles as $title ) {
			$words = explode( ' ', strtolower( $title ) );
			$index_words = array_merge( $index_words, $words );
		}
		$index_words = array_values( array_unique( $index_words ) );
		$search_words = explode( ' ', strtolower( trim( $search_term ) ) );
		$corrected_words = array();
		$has_corrected = false;
		foreach ( $search_words as $word ) {
			$trimmed = trim( $word );
			if ( strlen( $trimmed ) < 3 ) {
				array_push( $corrected_words, $trimmed );
				continue;
			}
			$best_match = $trimmed;
			$best_distance = 999;
			foreach ( $index_words as $index_word ) {
				if ( strlen( $index_word ) < 2 ) {
					continue;
				}
				$len_diff = strlen( $trimmed ) > strlen( $index_word ) ? strlen( $trimmed ) - strlen( $index_word ) : strlen( $index_word ) - strlen( $trimmed );
				if ( $len_diff > 2 ) {
					continue;
				}
				$distance = levenshtein( $trimmed, $index_word );
				if ( $distance < $best_distance && $distance <= 2 ) {
					$best_distance = $distance;
					$best_match = $index_word;
				}
			}
			if ( $best_match !== $trimmed ) {
				$has_corrected = true;
			}
			array_push( $corrected_words, $best_match );
		}
		return array( 'corrected' => implode( ' ', $corrected_words ), 'hasCorrected' => $has_corrected );
	}

	public function get_did_you_mean_suggestions( $search_term, $table_name ) {
		global $wpdb;
		$result = $this->correct_words( $search_term, $table_name );
		if ( ! $result['hasCorrected'] ) {
			return array();
		}
		$bool_query = $this->build_boolean_query( $result['corrected'] );
		$posts_table_dym = $wpdb->posts;
		$corrected_results = $wpdb->get_col( $wpdb->prepare( 'SELECT DISTINCT ff_si.title FROM %i AS ff_si INNER JOIN %i AS p ON ff_si.product_id = p.ID WHERE p.post_status = %s AND MATCH(ff_si.title, ff_si.sku, ff_si.short_desc, ff_si.attributes, ff_si.categories, ff_si.tags, ff_si.variation_skus) AGAINST (%s IN BOOLEAN MODE) LIMIT 5', $table_name, $posts_table_dym, 'publish', $bool_query ) ) ?? array();
		return $corrected_results;
	}

	public function get_corrected_query( $search_term, $table_name ) {
		$result = $this->correct_words( $search_term, $table_name );
		if ( ! $result['hasCorrected'] ) {
			return '';
		}
		return $result['corrected'];
	}

	public function build_boolean_query( $search_term ) {
		$synonyms_raw = get_option( 'headless_fuzzy_find_synonyms', '' );
		$synonym_groups = $synonyms_raw ? explode( '
', $synonyms_raw ) : array();
		$words = explode( ' ', strtolower( trim( $search_term ) ) );
		$parts = array();
		foreach ( $words as $word ) {
			$trimmed = trim( $word );
			if ( strlen( $trimmed ) === 0 ) {
				continue;
			}
			$synonyms = array();
			foreach ( $synonym_groups as $group ) {
				$terms = explode( ',', $group );
				$found = false;
				foreach ( $terms as $term ) {
					if ( strtolower( trim( $term ) ) === $trimmed ) {
						$found = true;
						break;
					}
				}
				if ( $found ) {
					foreach ( $terms as $term ) {
						$t = strtolower( trim( $term ) );
						if ( $t && $t !== $trimmed ) {
							array_push( $synonyms, $t );
						}
					}
					break;
				}
			}
			$safe_trimmed = trim( strtr( $trimmed, '+-><()~*"@', '          ' ) );
			if ( strlen( $safe_trimmed ) === 0 ) {
				continue;
			}
			if ( count( $synonyms ) > 0 ) {
				$syn_group = $safe_trimmed . '*';
				foreach ( $synonyms as $syn ) {
					$safe_syn = trim( strtr( $syn, '+-><()~*"@', '          ' ) );
					if ( strlen( $safe_syn ) > 0 ) {
						$syn_group = $syn_group . ' ' . $safe_syn . '*';
					}
				}
				array_push( $parts, '+(' . $syn_group . ')' );
			} else {
				array_push( $parts, '+' . $safe_trimmed . '*' );
			}
		}
		return implode( ' ', $parts );
	}

	public function log_search( $search_term, $result_count ) {
		global $wpdb;
		$analytics_enabled = get_option( 'headless_fuzzy_find_analytics_enabled', '1' );
		if ( $analytics_enabled !== '1' ) {
			return;
		}
		$log_table = get_option( 'headless_fuzzyfind_log_table', '' );
		if ( ! $log_table ) {
			return;
		}
		$normalized_query = strtolower( trim( $search_term ) );
		if ( strlen( $normalized_query ) === 0 ) {
			return;
		}
		$wpdb->query( $wpdb->prepare( 'INSERT INTO %i (query, result_count, search_count, last_searched) VALUES (%s, %d, 1, NOW()) ON DUPLICATE KEY UPDATE search_count = search_count + 1, result_count = %d, last_searched = NOW()', $log_table, $normalized_query, $result_count, $result_count ) );
	}

}
