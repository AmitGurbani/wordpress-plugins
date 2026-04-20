<?php

if ( ! defined( 'WPINC' ) ) {
	die;
}

class Headless_Pos_Sessions_Rest_Api {

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
			'/sessions',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'create_session' ),
				'permission_callback' => function() {
					return current_user_can( 'edit_shop_orders' );
				},
			)
		);
		register_rest_route(
			$this->namespace,
			'/sessions',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'list_sessions' ),
				'permission_callback' => function() {
					return current_user_can( 'edit_shop_orders' );
				},
			)
		);
		register_rest_route(
			$this->namespace,
			'/sessions/(?P<id>\d+)',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'get_session' ),
				'permission_callback' => function() {
					return current_user_can( 'edit_shop_orders' );
				},
			)
		);
		register_rest_route(
			$this->namespace,
			'/sessions/(?P<id>\d+)',
			array(
				'methods'             => 'PUT',
				'callback'            => array( $this, 'update_session' ),
				'permission_callback' => function() {
					return current_user_can( 'edit_shop_orders' );
				},
			)
		);
		register_rest_route(
			$this->namespace,
			'/sessions/(?P<id>\d+)',
			array(
				'methods'             => 'DELETE',
				'callback'            => array( $this, 'delete_session' ),
				'permission_callback' => function() {
					return current_user_can( 'manage_woocommerce' );
				},
			)
		);
	}

	public function check_permissions() {
		return current_user_can( 'manage_options' );
	}

	public function get_settings( $request ) {
		$settings = array(
			'retention_days' => get_option( 'headless_pos_sessions_retention_days', 90 ),
			'max_open_sessions' => get_option( 'headless_pos_sessions_max_open_sessions', 10 ),
		);

		return rest_ensure_response( $settings );
	}

	public function update_settings( $request ) {
		$params = $request->get_json_params();

		if ( isset( $params['retention_days'] ) ) {
			$value = absint( $params['retention_days'] );
			if ( null === $value ) {
				return new \WP_Error(
					'invalid_retention_days',
					'Invalid value for retention_days.',
					array( 'status' => 400 )
				);
			}
			update_option( 'headless_pos_sessions_retention_days', $value );
		}
		if ( isset( $params['max_open_sessions'] ) ) {
			$value = absint( $params['max_open_sessions'] );
			if ( null === $value ) {
				return new \WP_Error(
					'invalid_max_open_sessions',
					'Invalid value for max_open_sessions.',
					array( 'status' => 400 )
				);
			}
			update_option( 'headless_pos_sessions_max_open_sessions', $value );
		}

		return rest_ensure_response( array( 'success' => true ) );
	}

	public function create_session( $request ) {
		$uuid = sanitize_text_field( $request->get_param( 'session_uuid' ) );
		if ( ! $uuid ) {
			return new WP_Error( 'missing_session_uuid', 'session_uuid is required.', array( 'status' => 400 ) );
		}
		$terminal_id = sanitize_text_field( $request->get_param( 'terminal_id' ) );
		if ( ! $terminal_id ) {
			return new WP_Error( 'missing_terminal_id', 'terminal_id is required.', array( 'status' => 400 ) );
		}
		$opened_at = sanitize_text_field( $request->get_param( 'opened_at' ) );
		if ( ! $opened_at ) {
			return new WP_Error( 'missing_opened_at', 'opened_at is required.', array( 'status' => 400 ) );
		}
		$opening_balance = floatval( $request->get_param( 'opening_balance' ) );
		if ( $opening_balance < 0 ) {
			return new WP_Error( 'invalid_opening_balance', 'opening_balance must be >= 0.', array( 'status' => 400 ) );
		}
		$order_ids_param = $request->get_param( 'order_ids' );
		if ( $order_ids_param && ! is_array( $order_ids_param ) ) {
			return new WP_Error( 'invalid_order_ids', 'order_ids must be an array of integers.', array( 'status' => 400 ) );
		}
		$existing = get_posts( array( 'post_type' => 'hpss_pos_session', 'post_status' => 'publish', 'meta_key' => '_session_uuid', 'meta_value' => $uuid, 'posts_per_page' => 1, 'fields' => 'ids' ) );
		if ( count( $existing ) > 0 ) {
			return new WP_Error( 'duplicate_uuid', 'A session with this session_uuid already exists.', array( 'status' => 409 ) );
		}
		$closed_at = sanitize_text_field( $request->get_param( 'closed_at' ) ?? '' );
		$status = $closed_at ? 'closed' : 'open';
		if ( $status === 'open' ) {
			$max_open = max( 1, intval( get_option( 'headless_pos_sessions_max_open_sessions', 10 ) ) );
			$open_sessions = get_posts( array( 'post_type' => 'hpss_pos_session', 'post_status' => 'publish', 'meta_key' => '_session_status', 'meta_value' => 'open', 'posts_per_page' => -1, 'fields' => 'ids' ) );
			if ( count( $open_sessions ) >= $max_open ) {
				return new WP_Error( 'max_open_exceeded', 'Maximum number of open sessions reached.', array( 'status' => 409 ) );
			}
		}
		$post_id = wp_insert_post( array( 'post_type' => 'hpss_pos_session', 'post_title' => 'POS Session — ' . $opened_at, 'post_status' => 'publish' ) );
		if ( is_wp_error( $post_id ) ) {
			return new WP_Error( 'create_failed', 'Failed to create session.', array( 'status' => 500 ) );
		}
		$id = intval( $post_id );
		update_post_meta( $id, '_session_uuid', $uuid );
		update_post_meta( $id, '_terminal_id', $terminal_id );
		update_post_meta( $id, '_session_status', $status );
		update_post_meta( $id, '_opened_at', $opened_at );
		update_post_meta( $id, '_closed_at', $closed_at );
		update_post_meta( $id, '_opening_balance', strval( $opening_balance ) );
		update_post_meta( $id, '_closing_balance', sanitize_text_field( $request->get_param( 'closing_balance' ) ?? '0' ) );
		update_post_meta( $id, '_expected_balance', sanitize_text_field( $request->get_param( 'expected_balance' ) ?? '0' ) );
		update_post_meta( $id, '_cash_in', sanitize_text_field( $request->get_param( 'cash_in' ) ?? '0' ) );
		update_post_meta( $id, '_cash_out', sanitize_text_field( $request->get_param( 'cash_out' ) ?? '0' ) );
		update_post_meta( $id, '_order_count', strval( intval( $request->get_param( 'order_count' ) ?? '0' ) ) );
		update_post_meta( $id, '_order_ids', $order_ids_param ? wp_json_encode( $order_ids_param ) : '[]' );
		update_post_meta( $id, '_notes', sanitize_textarea_field( $request->get_param( 'notes' ) ?? '' ) );
		$cashier_id = intval( $request->get_param( 'cashier_id' ) ?? '0' );
		update_post_meta( $id, '_cashier_id', strval( $cashier_id > 0 ? $cashier_id : get_current_user_id() ) );
		return $this->format_session( $id );
	}

	public function list_sessions( $request ) {
		$per_page = min( 100, max( 1, intval( $request->get_param( 'per_page' ) ?? '20' ) ) );
		$page = max( 1, intval( $request->get_param( 'page' ) ?? '1' ) );
		$orderby = sanitize_text_field( $request->get_param( 'orderby' ) ?? 'opened_at' );
		$order = sanitize_text_field( $request->get_param( 'order' ) ?? 'desc' );
		$sort_dir = strtoupper( $order ) === 'ASC' ? 'ASC' : 'DESC';
		$query_args = array( 'post_type' => 'hpss_pos_session', 'post_status' => 'publish', 'posts_per_page' => $per_page, 'paged' => $page );
		$meta_query = array();
		$status_filter = sanitize_text_field( $request->get_param( 'status' ) ?? '' );
		if ( $status_filter ) {
			array_push( $meta_query, array( 'key' => '_session_status', 'value' => $status_filter ) );
		}
		$terminal_filter = sanitize_text_field( $request->get_param( 'terminal_id' ) ?? '' );
		if ( $terminal_filter ) {
			array_push( $meta_query, array( 'key' => '_terminal_id', 'value' => $terminal_filter ) );
		}
		$date_from = sanitize_text_field( $request->get_param( 'date_from' ) ?? '' );
		if ( $date_from ) {
			array_push( $meta_query, array( 'key' => '_opened_at', 'value' => $date_from, 'compare' => '>=', 'type' => 'CHAR' ) );
		}
		$date_to = sanitize_text_field( $request->get_param( 'date_to' ) ?? '' );
		if ( $date_to ) {
			array_push( $meta_query, array( 'key' => '_opened_at', 'value' => $date_to, 'compare' => '<=', 'type' => 'CHAR' ) );
		}
		if ( count( $meta_query ) > 0 ) {
			$query_args['meta_query'] = $meta_query;
		}
		if ( $orderby === 'order_count' ) {
			$query_args['meta_key'] = '_order_count';
			$query_args['orderby'] = 'meta_value_num';
		} elseif ( $orderby === 'closed_at' ) {
			$query_args['meta_key'] = '_closed_at';
			$query_args['orderby'] = 'meta_value';
		} else {
			$query_args['meta_key'] = '_opened_at';
			$query_args['orderby'] = 'meta_value';
		}
		$query_args['order'] = $sort_dir;
		$query_args['fields'] = 'ids';
		$post_ids = get_posts( $query_args );
		$sessions = array();
		foreach ( $post_ids as $pid ) {
			$session = $this->format_session( intval( $pid ) );
			if ( $session ) {
				array_push( $sessions, $session );
			}
		}
		$count_args = array( 'post_type' => 'hpss_pos_session', 'post_status' => 'publish', 'posts_per_page' => -1, 'fields' => 'ids' );
		if ( count( $meta_query ) > 0 ) {
			$count_args['meta_query'] = $meta_query;
		}
		$all_ids = get_posts( $count_args );
		$total = count( $all_ids );
		$total_pages = max( 1, ceil( $total / $per_page ) );
		return array( 'data' => $sessions, 'meta' => array( 'total' => $total, 'total_pages' => $total_pages, 'page' => $page, 'per_page' => $per_page ) );
	}

	public function get_session( $request ) {
		$post_id = intval( $request->get_param( 'id' ) );
		$post = get_post( $post_id );
		if ( ! $post || get_post_type( $post_id ) !== 'hpss_pos_session' ) {
			return new WP_Error( 'not_found', 'Session not found.', array( 'status' => 404 ) );
		}
		return $this->format_session( $post_id );
	}

	public function update_session( $request ) {
		$post_id = intval( $request->get_param( 'id' ) );
		$post = get_post( $post_id );
		if ( ! $post || get_post_type( $post_id ) !== 'hpss_pos_session' ) {
			return new WP_Error( 'not_found', 'Session not found.', array( 'status' => 404 ) );
		}
		$params = $request->get_json_params();
		if ( isset( $params['terminal_id'] ) ) {
			update_post_meta( $post_id, '_terminal_id', sanitize_text_field( $params['terminal_id'] ) );
		}
		if ( isset( $params['status'] ) ) {
			$new_status = sanitize_text_field( $params['status'] );
			if ( $new_status === 'open' ) {
				$current_status = get_post_meta( $post_id, '_session_status', true );
				if ( $current_status !== 'open' ) {
					$max_open = max( 1, intval( get_option( 'headless_pos_sessions_max_open_sessions', 10 ) ) );
					$open_sessions = get_posts( array( 'post_type' => 'hpss_pos_session', 'post_status' => 'publish', 'meta_key' => '_session_status', 'meta_value' => 'open', 'posts_per_page' => -1, 'fields' => 'ids' ) );
					if ( count( $open_sessions ) >= $max_open ) {
						return new WP_Error( 'max_open_exceeded', 'Maximum number of open sessions reached.', array( 'status' => 409 ) );
					}
				}
			}
			update_post_meta( $post_id, '_session_status', $new_status );
		}
		if ( isset( $params['opened_at'] ) ) {
			update_post_meta( $post_id, '_opened_at', sanitize_text_field( $params['opened_at'] ) );
		}
		if ( isset( $params['closed_at'] ) ) {
			update_post_meta( $post_id, '_closed_at', sanitize_text_field( $params['closed_at'] ) );
		}
		if ( isset( $params['opening_balance'] ) ) {
			update_post_meta( $post_id, '_opening_balance', strval( floatval( $params['opening_balance'] ) ) );
		}
		if ( isset( $params['closing_balance'] ) ) {
			update_post_meta( $post_id, '_closing_balance', strval( floatval( $params['closing_balance'] ) ) );
		}
		if ( isset( $params['expected_balance'] ) ) {
			update_post_meta( $post_id, '_expected_balance', strval( floatval( $params['expected_balance'] ) ) );
		}
		if ( isset( $params['cash_in'] ) ) {
			update_post_meta( $post_id, '_cash_in', strval( floatval( $params['cash_in'] ) ) );
		}
		if ( isset( $params['cash_out'] ) ) {
			update_post_meta( $post_id, '_cash_out', strval( floatval( $params['cash_out'] ) ) );
		}
		if ( isset( $params['order_ids'] ) ) {
			update_post_meta( $post_id, '_order_ids', wp_json_encode( $params['order_ids'] ) );
		}
		if ( isset( $params['order_count'] ) ) {
			update_post_meta( $post_id, '_order_count', strval( intval( $params['order_count'] ) ) );
		}
		if ( isset( $params['notes'] ) ) {
			update_post_meta( $post_id, '_notes', sanitize_textarea_field( $params['notes'] ) );
		}
		if ( isset( $params['cashier_id'] ) ) {
			update_post_meta( $post_id, '_cashier_id', strval( intval( $params['cashier_id'] ) ) );
		}
		return $this->format_session( $post_id );
	}

	public function delete_session( $request ) {
		$post_id = intval( $request->get_param( 'id' ) );
		$post = get_post( $post_id );
		if ( ! $post || get_post_type( $post_id ) !== 'hpss_pos_session' ) {
			return new WP_Error( 'not_found', 'Session not found.', array( 'status' => 404 ) );
		}
		$result = wp_delete_post( $post_id, true );
		if ( ! $result ) {
			return new WP_Error( 'delete_failed', 'Failed to delete session.', array( 'status' => 500 ) );
		}
		return array( 'deleted' => true, 'id' => $post_id );
	}

	public function format_session( $post_id ) {
		$post = get_post( $post_id, 'ARRAY_A' );
		if ( ! $post ) {
			return null;
		}
		$order_ids_raw = get_post_meta( $post_id, '_order_ids', true );
		return array( 'id' => $post_id, 'session_uuid' => get_post_meta( $post_id, '_session_uuid', true ), 'terminal_id' => get_post_meta( $post_id, '_terminal_id', true ), 'status' => get_post_meta( $post_id, '_session_status', true ), 'opened_at' => get_post_meta( $post_id, '_opened_at', true ), 'closed_at' => get_post_meta( $post_id, '_closed_at', true ), 'opening_balance' => floatval( get_post_meta( $post_id, '_opening_balance', true ) ), 'closing_balance' => floatval( get_post_meta( $post_id, '_closing_balance', true ) ), 'expected_balance' => floatval( get_post_meta( $post_id, '_expected_balance', true ) ), 'cash_in' => floatval( get_post_meta( $post_id, '_cash_in', true ) ), 'cash_out' => floatval( get_post_meta( $post_id, '_cash_out', true ) ), 'order_count' => intval( get_post_meta( $post_id, '_order_count', true ) ), 'order_ids' => $order_ids_raw ? json_decode( $order_ids_raw, true ) : array(), 'notes' => get_post_meta( $post_id, '_notes', true ), 'cashier_id' => intval( get_post_meta( $post_id, '_cashier_id', true ) ), 'created_at' => $post['post_date_gmt'] );
	}

}
