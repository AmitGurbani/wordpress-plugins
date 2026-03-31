<?php

if ( ! defined( 'WPINC' ) ) {
	die;
}

class Headless_Google_Analytics_Public {

	private $plugin_name;
	private $version;

	public function __construct( $plugin_name, $version ) {
		$this->plugin_name = $plugin_name;
		$this->version     = $version;
	}

	public function on_order_status_changed( $order_id, $old_status, $new_status, $order ) {
		$purchase_statuses = array( 'processing', 'on-hold', 'completed' );
		if ( ! in_array( $new_status, $purchase_statuses ) ) {
			return;
		}
		if ( get_option( 'headless_google_analytics_enable_purchase', '1' ) !== '1' ) {
			return;
		}
		if ( ! $order ) {
			return;
		}
		$already_sent = $order->get_meta( '_headless_ga_sent', true );
		if ( $already_sent ) {
			return;
		}
		$client_id = strval( wp_rand( 1000000000, 9999999999 ) ) . '.' . strval( time() );
		$customer_id = $order->get_customer_id();
		$user_id = $customer_id ? strval( $customer_id ) : '';
		$currency = $order->get_currency();
		$total = floatval( $order->get_total() );
		$ga_items = array();
		$items = $order->get_items();
		foreach ( $items as $item ) {
			$product = $item->get_product();
			if ( ! $product ) {
				continue;
			}
			$sku = $product->get_sku();
			$item_id = $sku ? $sku : strval( $product->get_id() );
			array_push( $ga_items, array( 'item_id' => $item_id, 'item_name' => $item->get_name(), 'quantity' => $item->get_quantity(), 'price' => floatval( $product->get_price() ) ) );
		}
		$params = array( 'currency' => $currency, 'value' => $total, 'transaction_id' => strval( $order_id ), 'items' => $ga_items, 'engagement_time_msec' => 1 );
		$result = $this->send_ga4_event( 'purchase', $client_id, $user_id, $params );
		if ( $result['success'] ) {
			$order->update_meta_data( '_headless_ga_sent', '1' );
			$order->save();
		}
	}

	public function filter_default_currency( $default_value ) {
		if ( class_exists( 'WooCommerce' ) ) {
			return get_option( 'woocommerce_currency', 'USD' );
		}
		return $default_value;
	}

	public function send_ga4_event( $event_name, $client_id, $user_id, $params ) {
		$measurement_id = get_option( 'headless_google_analytics_measurement_id', '' );
		$api_secret = get_option( 'headless_google_analytics_api_secret', '' );
		if ( ! $measurement_id || ! $api_secret ) {
			return array( 'success' => false, 'message' => 'Measurement ID or API Secret not configured.' );
		}
		$payload = array( 'client_id' => $client_id, 'events' => array( array( 'name' => $event_name, 'params' => $params ) ) );
		if ( $user_id ) {
			$payload['user_id'] = $user_id;
		}
		$url = 'https://www.google-analytics.com/mp/collect?measurement_id=' . $measurement_id . '&api_secret=' . $api_secret;
		$response = wp_remote_post( $url, array( 'body' => wp_json_encode( $payload ), 'headers' => array( 'Content-Type' => 'application/json' ), 'timeout' => 5 ) );
		if ( is_wp_error( $response ) ) {
			update_option( 'headless_google_analytics_last_error', $response->get_error_message() );
			return array( 'success' => false, 'message' => $response->get_error_message() );
		}
		return array( 'success' => true );
	}

}
