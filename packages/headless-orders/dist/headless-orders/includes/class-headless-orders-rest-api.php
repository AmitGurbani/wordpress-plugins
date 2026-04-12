<?php

if ( ! defined( 'WPINC' ) ) {
	die;
}

class Headless_Orders_Rest_Api {

	private $namespace;

	public function __construct( $plugin_slug ) {
		$this->namespace = $plugin_slug . '/v1';
	}

	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/orders',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'list_orders' ),
				'permission_callback' => function() {
					return current_user_can( 'read' );
				},
			)
		);
		register_rest_route(
			$this->namespace,
			'/orders/(?P<id>\d+)',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'get_order' ),
				'permission_callback' => function() {
					return current_user_can( 'read' );
				},
			)
		);
	}


	public function list_orders( $request ) {
		if ( ! class_exists( 'WooCommerce' ) ) {
			return new WP_Error( 'woocommerce_required', 'WooCommerce is not active.', array( 'status' => 503 ) );
		}
		$user_id = get_current_user_id();
		$per_page = min( 100, max( 1, intval( $request->get_param( 'per_page' ) ?? '20' ) ) );
		$page = max( 1, intval( $request->get_param( 'page' ) ?? '1' ) );
		$status_param = sanitize_text_field( $request->get_param( 'status' ) ?? '' );
		$valid_statuses = array( 'pending', 'processing', 'completed', 'cancelled', 'refunded', 'failed', 'on-hold' );
		if ( $status_param && ! in_array( $status_param, $valid_statuses ) ) {
			return new WP_Error( 'invalid_status', 'Invalid order status.', array( 'status' => 400 ) );
		}
		$query_args = array( 'customer' => $user_id, 'limit' => $per_page, 'page' => $page, 'orderby' => 'date', 'order' => 'DESC' );
		if ( $status_param ) {
			$query_args['status'] = $status_param;
		}
		$orders = wc_get_orders( $query_args );
		$formatted_orders = array();
		foreach ( $orders as $order ) {
			array_push( $formatted_orders, $this->format_order( $order ) );
		}
		$count_args = array( 'customer' => $user_id, 'limit' => -1, 'return' => 'ids' );
		if ( $status_param ) {
			$count_args['status'] = $status_param;
		}
		$all_ids = wc_get_orders( $count_args );
		$total = count( $all_ids );
		$total_pages = max( 1, ceil( $total / $per_page ) );
		$response = rest_ensure_response( $formatted_orders );
		$response->header( 'X-WP-Total', $total );
		$response->header( 'X-WP-TotalPages', $total_pages );
		return $response;
	}

	public function get_order( $request ) {
		if ( ! class_exists( 'WooCommerce' ) ) {
			return new WP_Error( 'woocommerce_required', 'WooCommerce is not active.', array( 'status' => 503 ) );
		}
		$user_id = get_current_user_id();
		$order_id = intval( $request->get_param( 'id' ) );
		$order = wc_get_order( $order_id );
		if ( ! $order ) {
			return new WP_Error( 'order_not_found', 'Order not found.', array( 'status' => 404 ) );
		}
		if ( $order->get_customer_id() !== $user_id ) {
			return new WP_Error( 'order_not_found', 'Order not found.', array( 'status' => 404 ) );
		}
		return $this->format_order( $order );
	}

	public function format_order( $order ) {
		$date_created = $order->get_date_created();
		$date_modified = $order->get_date_modified();
		$raw_items = $order->get_items();
		$items = array();
		foreach ( $raw_items as $item ) {
			array_push( $items, array( 'product_id' => $item->get_product_id(), 'variation_id' => $item->get_variation_id(), 'name' => $item->get_name(), 'quantity' => $item->get_quantity(), 'subtotal' => $item->get_subtotal(), 'total' => $item->get_total() ) );
		}
		return array( 'id' => $order->get_id(), 'order_number' => $order->get_order_number(), 'status' => $order->get_status(), 'created_at' => $date_created ? $date_created->date( 'c' ) : '', 'updated_at' => $date_modified ? $date_modified->date( 'c' ) : '', 'total' => $order->get_total(), 'shipping_total' => $order->get_shipping_total(), 'currency' => $order->get_currency(), 'payment_method' => $order->get_payment_method(), 'customer_note' => $order->get_customer_note(), 'billing' => array( 'first_name' => $order->get_billing_first_name(), 'last_name' => $order->get_billing_last_name(), 'address_1' => $order->get_billing_address_1(), 'address_2' => $order->get_billing_address_2(), 'city' => $order->get_billing_city(), 'state' => $order->get_billing_state(), 'postcode' => $order->get_billing_postcode(), 'country' => $order->get_billing_country(), 'email' => $order->get_billing_email(), 'phone' => $order->get_billing_phone() ), 'shipping' => array( 'first_name' => $order->get_shipping_first_name(), 'last_name' => $order->get_shipping_last_name(), 'address_1' => $order->get_shipping_address_1(), 'address_2' => $order->get_shipping_address_2(), 'city' => $order->get_shipping_city(), 'state' => $order->get_shipping_state(), 'postcode' => $order->get_shipping_postcode(), 'country' => $order->get_shipping_country(), 'phone' => $order->get_shipping_phone() ), 'items' => $items );
	}

}
