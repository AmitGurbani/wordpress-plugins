<?php

if ( ! defined( 'WPINC' ) ) {
	die;
}

class Headless_Umami_Public {

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
		if ( get_option( 'headless_umami_enable_purchase', '1' ) !== '1' ) {
			return;
		}
		if ( ! $order ) {
			return;
		}
		$already_sent = get_post_meta( $order_id, '_headless_umami_sent', true );
		if ( $already_sent ) {
			return;
		}
		$currency = $order->get_currency();
		$total = strval( $order->get_total() );
		$products = array();
		$items = $order->get_items();
		foreach ( $items as $item ) {
			$product = $item->get_product();
			if ( ! $product ) {
				continue;
			}
			$sku = $product->get_sku();
			$product_id = $sku ? $sku : strval( $product->get_id() );
			array_push( $products, array( 'id' => $product_id, 'name' => $item->get_name(), 'quantity' => $item->get_quantity(), 'price' => strval( $product->get_price() ) ) );
		}
		$event_data = array( 'order_id' => strval( $order_id ), 'revenue' => $total, 'currency' => $currency, 'products' => $products );
		$order_url = $order->get_checkout_order_received_url();
		$result = $this->send_umami_event( 'purchase', $order_url, 'Purchase - Order #' . strval( $order_id ), $event_data );
		if ( $result['success'] ) {
			update_post_meta( $order_id, '_headless_umami_sent', '1' );
		}
	}

	public function send_umami_event( $event_name, $url, $title, $event_data ) {
		$umami_url = get_option( 'headless_umami_umami_url', '' );
		$website_id = get_option( 'headless_umami_website_id', '' );
		if ( ! $umami_url || ! $website_id ) {
			return array( 'success' => false, 'message' => 'Umami URL or Website ID not configured.' );
		}
		$site_url_parsed = wp_parse_url( site_url() );
		$hostname = $site_url_parsed['host'] ?? '';
		$inner_payload = array( 'hostname' => $hostname, 'language' => '', 'referrer' => '', 'screen' => '1920x1080', 'title' => $title, 'url' => $url, 'website' => $website_id, 'name' => $event_name );
		if ( $event_data ) {
			$inner_payload['data'] = $event_data;
		}
		$payload = array( 'type' => 'event', 'payload' => $inner_payload );
		$api_url = rtrim( $umami_url, '/' ) . '/api/send';
		$response = wp_safe_remote_post( $api_url, array( 'body' => json_encode( $payload ), 'headers' => array( 'Content-Type' => 'application/json', 'User-Agent' => 'Mozilla/5.0 (compatible; HeadlessUmami/1.0; +wordpress)' ), 'timeout' => 5 ) );
		if ( is_wp_error( $response ) ) {
			update_option( 'headless_umami_last_error', $response->get_error_message() );
			return array( 'success' => false, 'message' => $response->get_error_message() );
		}
		$code = intval( wp_remote_retrieve_response_code( $response ) );
		if ( $code < 200 || $code >= 300 ) {
			$body = wp_remote_retrieve_body( $response );
			update_option( 'headless_umami_last_error', 'HTTP ' . strval( $code ) . ': ' . $body );
			return array( 'success' => false, 'message' => 'Umami returned HTTP ' . strval( $code ) );
		}
		return array( 'success' => true );
	}

}
