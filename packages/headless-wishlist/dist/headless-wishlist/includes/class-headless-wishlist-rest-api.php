<?php

if ( ! defined( 'WPINC' ) ) {
	die;
}

class Headless_Wishlist_Rest_Api {

	private $namespace;

	public function __construct( $plugin_slug ) {
		$this->namespace = $plugin_slug . '/v1';
	}

	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/items',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'get_items' ),
				'permission_callback' => function() {
					return current_user_can( 'read' );
				},
			)
		);
		register_rest_route(
			$this->namespace,
			'/items',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'add_item' ),
				'permission_callback' => function() {
					return current_user_can( 'read' );
				},
			)
		);
		register_rest_route(
			$this->namespace,
			'/items/(?P<product_id>\d+)',
			array(
				'methods'             => 'DELETE',
				'callback'            => array( $this, 'remove_item' ),
				'permission_callback' => function() {
					return current_user_can( 'read' );
				},
			)
		);
		register_rest_route(
			$this->namespace,
			'/items',
			array(
				'methods'             => 'DELETE',
				'callback'            => array( $this, 'clear_items' ),
				'permission_callback' => function() {
					return current_user_can( 'read' );
				},
			)
		);
		register_rest_route(
			$this->namespace,
			'/analytics/popular',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'get_popular' ),
				'permission_callback' => function() {
					return current_user_can( 'manage_options' );
				},
			)
		);
	}


	public function get_items( $request ) {
		$user_id = get_current_user_id();
		$items = $this->get_wishlist( $user_id );
		$valid_items = array();
		foreach ( $items as $item ) {
			$post = get_post( intval( $item['product_id'] ), 'ARRAY_A' );
			if ( $post && $post['post_type'] === 'product' && $post['post_status'] === 'publish' ) {
				array_push( $valid_items, array( 'product_id' => intval( $item['product_id'] ), 'slug' => $post['post_name'], 'added_at' => $item['added_at'] ) );
			}
		}
		if ( count( $valid_items ) !== count( $items ) ) {
			$cleaned = array();
			foreach ( $valid_items as $v ) {
				array_push( $cleaned, array( 'product_id' => $v['product_id'], 'added_at' => $v['added_at'] ) );
			}
			$this->save_wishlist( $user_id, $cleaned );
		}
		return array( 'items' => array_reverse( $valid_items ) );
	}

	public function add_item( $request ) {
		$product_id = intval( $request->get_param( 'product_id' ) );
		if ( ! $product_id ) {
			return new WP_Error( 'missing_product_id', __( 'product_id is required.', 'headless-wishlist' ), array( 'status' => 400 ) );
		}
		$post = get_post( $product_id, 'ARRAY_A' );
		if ( ! $post || $post['post_type'] !== 'product' || $post['post_status'] !== 'publish' ) {
			return new WP_Error( 'product_not_found', __( 'Product not found', 'headless-wishlist' ), array( 'status' => 404 ) );
		}
		$user_id = get_current_user_id();
		$items = $this->get_wishlist( $user_id );
		foreach ( $items as $item ) {
			if ( intval( $item['product_id'] ) === $product_id ) {
				return new WP_Error( 'already_exists', __( 'Product already in wishlist', 'headless-wishlist' ), array( 'status' => 409 ) );
			}
		}
		$max_items = intval( apply_filters( 'headless_wishlist_max_items', 100 ) );
		if ( count( $items ) >= $max_items ) {
			return new WP_Error( 'wishlist_full', __( 'Wishlist has reached the maximum number of items.', 'headless-wishlist' ), array( 'status' => 400 ) );
		}
		$added_at = gmdate( 'c', time() );
		array_push( $items, array( 'product_id' => $product_id, 'added_at' => $added_at ) );
		$this->save_wishlist( $user_id, $items );
		$response = rest_ensure_response( array( 'success' => true, 'item' => array( 'product_id' => $product_id, 'slug' => $post['post_name'], 'added_at' => $added_at ) ) );
		$response->set_status( 201 );
		return $response;
	}

	public function remove_item( $request ) {
		$product_id = intval( $request->get_param( 'product_id' ) );
		$user_id = get_current_user_id();
		$items = $this->get_wishlist( $user_id );
		$found = false;
		$updated = array();
		foreach ( $items as $item ) {
			if ( intval( $item['product_id'] ) === $product_id ) {
				$found = true;
			} else {
				array_push( $updated, $item );
			}
		}
		if ( ! $found ) {
			return new WP_Error( 'not_found', __( 'Product not in wishlist', 'headless-wishlist' ), array( 'status' => 404 ) );
		}
		$this->save_wishlist( $user_id, $updated );
		return array( 'success' => true );
	}

	public function clear_items( $request ) {
		$user_id = get_current_user_id();
		delete_user_meta( $user_id, '_headless_wishlist' );
		return array( 'success' => true );
	}

	public function get_popular( $request ) {
		global $wpdb;
		$rows = $wpdb->get_results( $wpdb->prepare( 'SELECT meta_value FROM ' . $wpdb->usermeta . ' WHERE meta_key = %s', '_headless_wishlist' ), 'ARRAY_A' );
		$counts = array();
		$total_items = 0;
		foreach ( $rows as $row ) {
			$items = json_decode( $row['meta_value'], true ) ?? array();
			foreach ( $items as $item ) {
				$pid = strval( intval( $item['product_id'] ) );
				if ( ! isset( $counts[$pid] ) ) {
					$counts[$pid] = 0;
				}
				$counts[$pid] = $counts[$pid] + 1;
				$total_items = $total_items + 1;
			}
		}
		arsort( $counts );
		$top_ids = array_slice( array_keys( $counts ), 0, 20 );
		$popular = array();
		foreach ( $top_ids as $pid_str ) {
			$pid = intval( $pid_str );
			$post = get_post( $pid, 'ARRAY_A' );
			if ( $post && $post['post_type'] === 'product' && $post['post_status'] === 'publish' ) {
				array_push( $popular, array( 'product_id' => $pid, 'name' => $post['post_title'], 'slug' => $post['post_name'], 'count' => $counts[$pid_str] ) );
			}
		}
		return array( 'popular' => $popular, 'total_users' => count( $rows ), 'total_items' => $total_items );
	}

	public function get_wishlist( $user_id ) {
		$raw = get_user_meta( $user_id, '_headless_wishlist', true );
		if ( ! $raw ) {
			return array();
		}
		return json_decode( $raw, true ) ?? array();
	}

	public function save_wishlist( $user_id, $items ) {
		update_user_meta( $user_id, '_headless_wishlist', wp_json_encode( $items ) );
	}

}
