<?php

if ( ! defined( 'WPINC' ) ) {
	die;
}

class Meta_Pixel_Public {

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
		if ( get_option( 'meta_pixel_enable_capi', '1' ) !== '1' ) {
			return;
		}
		if ( get_option( 'meta_pixel_enable_purchase', '1' ) !== '1' ) {
			return;
		}
		if ( ! $order ) {
			return;
		}
		$already_sent = get_post_meta( $order_id, '_meta_pixel_capi_sent', true );
		if ( $already_sent ) {
			return;
		}
		$event_id = 'order_' . strval( $order_id );
		$currency = $order->get_currency();
		$total = strval( $order->get_total() );
		$contents = array();
		$content_ids = array();
		$items = $order->get_items();
		foreach ( $items as $item ) {
			$product = $item->get_product();
			if ( ! $product ) {
				continue;
			}
			$sku = $product->get_sku();
			$content_id = $sku ? $sku : strval( $product->get_id() );
			array_push( $content_ids, $content_id );
			array_push( $contents, array( 'id' => $content_id, 'quantity' => $item->get_quantity(), 'item_price' => strval( $product->get_price() ) ) );
		}
		$custom_data = array( 'currency' => $currency, 'value' => $total, 'content_type' => 'product', 'contents' => $contents, 'content_ids' => $content_ids );
		$source_url = $order->get_checkout_order_received_url();
		$user_data = $this->build_user_data_from_order( $order );
		$this->send_capi_event( 'Purchase', $event_id, $source_url, $custom_data, $user_data );
		update_post_meta( $order_id, '_meta_pixel_capi_sent', '1' );
	}

	public function filter_default_currency( $default_value ) {
		if ( class_exists( 'WooCommerce' ) ) {
			return get_option( 'woocommerce_currency', 'USD' );
		}
		return $default_value;
	}

	public function hash_for_capi( $value ) {
		if ( ! $value ) {
			return '';
		}
		$normalized = strtolower( trim( $value ) );
		return hash( 'sha256', $normalized );
	}

	public function build_user_data_from_order( $order ) {
		$user_data = array();
		$email = $order->get_billing_email();
		if ( $email ) {
			$user_data['em'] = $this->hash_for_capi( $email );
		}
		$phone = $order->get_billing_phone();
		if ( $phone ) {
			$user_data['ph'] = $this->hash_for_capi( $phone );
		}
		$first_name = $order->get_billing_first_name();
		if ( $first_name ) {
			$user_data['fn'] = $this->hash_for_capi( $first_name );
		}
		$last_name = $order->get_billing_last_name();
		if ( $last_name ) {
			$user_data['ln'] = $this->hash_for_capi( $last_name );
		}
		$city = $order->get_billing_city();
		if ( $city ) {
			$user_data['ct'] = $this->hash_for_capi( $city );
		}
		$state = $order->get_billing_state();
		if ( $state ) {
			$user_data['st'] = $this->hash_for_capi( $state );
		}
		$postcode = $order->get_billing_postcode();
		if ( $postcode ) {
			$user_data['zp'] = $this->hash_for_capi( $postcode );
		}
		$country = $order->get_billing_country();
		if ( $country ) {
			$user_data['country'] = $this->hash_for_capi( $country );
		}
		$user_id = $order->get_customer_id();
		if ( $user_id ) {
			$user_data['external_id'] = $this->hash_for_capi( strval( $user_id ) );
		}
		return $user_data;
	}

	public function send_capi_event( $event_name, $event_id, $source_url, $custom_data, $user_data ) {
		$pixel_id = get_option( 'meta_pixel_pixel_id', '' );
		$access_token = get_option( 'meta_pixel_access_token', '' );
		if ( ! $pixel_id || ! $access_token ) {
			return array( 'success' => false, 'message' => 'Pixel ID or Access Token not configured.' );
		}
		$event = array( 'event_name' => $event_name, 'event_time' => time(), 'event_id' => $event_id, 'action_source' => 'website', 'user_data' => $user_data, 'custom_data' => $custom_data );
		if ( $source_url ) {
			$event['event_source_url'] = $source_url;
		}
		$payload = array( 'data' => array( $event ) );
		$test_event_code = get_option( 'meta_pixel_test_event_code', '' );
		if ( $test_event_code ) {
			$payload['test_event_code'] = $test_event_code;
		}
		$url = 'https://graph.facebook.com/v25.0/' . $pixel_id . '/events?access_token=' . $access_token;
		$response = wp_remote_post( $url, array( 'body' => json_encode( $payload ), 'headers' => array( 'Content-Type' => 'application/json' ), 'timeout' => 5 ) );
		if ( is_wp_error( $response ) ) {
			update_option( 'meta_pixel_last_capi_error', $response->get_error_message() );
			return array( 'success' => false, 'message' => $response->get_error_message() );
		}
		return array( 'success' => true );
	}

}
