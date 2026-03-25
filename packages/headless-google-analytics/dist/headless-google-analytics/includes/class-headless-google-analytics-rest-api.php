<?php

if ( ! defined( 'WPINC' ) ) {
	die;
}

class Headless_Google_Analytics_Rest_Api {

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
			'/config',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'get_config' ),
				'permission_callback' => '__return_true',
			)
		);
		register_rest_route(
			$this->namespace,
			'/track',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'track_event' ),
				'permission_callback' => '__return_true',
			)
		);
		register_rest_route(
			$this->namespace,
			'/diagnostics/test-event',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'test_event' ),
				'permission_callback' => function() {
					return current_user_can( 'manage_options' );
				},
			)
		);
		register_rest_route(
			$this->namespace,
			'/diagnostics/last-error',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'get_last_error' ),
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
			'measurement_id' => get_option( 'headless_google_analytics_measurement_id', '' ),
			'api_secret' => get_option( 'headless_google_analytics_api_secret', '' ),
			'currency' => get_option( 'headless_google_analytics_currency', 'USD' ),
			'enable_view_item' => (bool) get_option( 'headless_google_analytics_enable_view_item', true ),
			'enable_add_to_cart' => (bool) get_option( 'headless_google_analytics_enable_add_to_cart', true ),
			'enable_begin_checkout' => (bool) get_option( 'headless_google_analytics_enable_begin_checkout', true ),
			'enable_purchase' => (bool) get_option( 'headless_google_analytics_enable_purchase', true ),
			'enable_search' => (bool) get_option( 'headless_google_analytics_enable_search', true ),
		);

		return rest_ensure_response( $settings );
	}

	public function update_settings( $request ) {
		$params = $request->get_json_params();

		if ( isset( $params['measurement_id'] ) ) {
			$value = sanitize_text_field( $params['measurement_id'] );
			if ( null === $value ) {
				return new \WP_Error(
					'invalid_measurement_id',
					'Invalid value for measurement_id.',
					array( 'status' => 400 )
				);
			}
			update_option( 'headless_google_analytics_measurement_id', $value );
		}
		if ( isset( $params['api_secret'] ) ) {
			$value = sanitize_text_field( $params['api_secret'] );
			if ( null === $value ) {
				return new \WP_Error(
					'invalid_api_secret',
					'Invalid value for api_secret.',
					array( 'status' => 400 )
				);
			}
			update_option( 'headless_google_analytics_api_secret', $value );
		}
		if ( isset( $params['currency'] ) ) {
			$value = sanitize_text_field( $params['currency'] );
			if ( null === $value ) {
				return new \WP_Error(
					'invalid_currency',
					'Invalid value for currency.',
					array( 'status' => 400 )
				);
			}
			update_option( 'headless_google_analytics_currency', $value );
		}
		if ( isset( $params['enable_view_item'] ) ) {
			$value = rest_sanitize_boolean( $params['enable_view_item'] );
			if ( null === $value ) {
				return new \WP_Error(
					'invalid_enable_view_item',
					'Invalid value for enable_view_item.',
					array( 'status' => 400 )
				);
			}
			update_option( 'headless_google_analytics_enable_view_item', $value );
		}
		if ( isset( $params['enable_add_to_cart'] ) ) {
			$value = rest_sanitize_boolean( $params['enable_add_to_cart'] );
			if ( null === $value ) {
				return new \WP_Error(
					'invalid_enable_add_to_cart',
					'Invalid value for enable_add_to_cart.',
					array( 'status' => 400 )
				);
			}
			update_option( 'headless_google_analytics_enable_add_to_cart', $value );
		}
		if ( isset( $params['enable_begin_checkout'] ) ) {
			$value = rest_sanitize_boolean( $params['enable_begin_checkout'] );
			if ( null === $value ) {
				return new \WP_Error(
					'invalid_enable_begin_checkout',
					'Invalid value for enable_begin_checkout.',
					array( 'status' => 400 )
				);
			}
			update_option( 'headless_google_analytics_enable_begin_checkout', $value );
		}
		if ( isset( $params['enable_purchase'] ) ) {
			$value = rest_sanitize_boolean( $params['enable_purchase'] );
			if ( null === $value ) {
				return new \WP_Error(
					'invalid_enable_purchase',
					'Invalid value for enable_purchase.',
					array( 'status' => 400 )
				);
			}
			update_option( 'headless_google_analytics_enable_purchase', $value );
		}
		if ( isset( $params['enable_search'] ) ) {
			$value = rest_sanitize_boolean( $params['enable_search'] );
			if ( null === $value ) {
				return new \WP_Error(
					'invalid_enable_search',
					'Invalid value for enable_search.',
					array( 'status' => 400 )
				);
			}
			update_option( 'headless_google_analytics_enable_search', $value );
		}

		return rest_ensure_response( array( 'success' => true ) );
	}

	public function get_config( $request ) {
		$measurement_id = get_option( 'headless_google_analytics_measurement_id', '' );
		return array( 'measurement_id' => $measurement_id );
	}

	public function track_event( $request ) {
		$event_name = sanitize_text_field( $request->get_param( 'event_name' ) );
		$client_id = sanitize_text_field( $request->get_param( 'client_id' ) );
		if ( ! $client_id ) {
			$client_id = strval( wp_rand( 1000000000, 9999999999 ) ) . '.' . strval( time() );
		}
		if ( ! $event_name ) {
			return new WP_Error( 'missing_params', 'event_name is required.', array( 'status' => 400 ) );
		}
		$allowed_events = array( 'view_item' => 'enable_view_item', 'add_to_cart' => 'enable_add_to_cart', 'begin_checkout' => 'enable_begin_checkout', 'search' => 'enable_search' );
		$setting_key = $allowed_events[$event_name];
		if ( ! $setting_key ) {
			return new WP_Error( 'invalid_event', 'Event name is not supported.', array( 'status' => 400 ) );
		}
		if ( get_option( 'headless_google_analytics_' . $setting_key, '1' ) !== '1' ) {
			return new WP_Error( 'event_disabled', 'This event type is disabled.', array( 'status' => 403 ) );
		}
		$raw_params = $request->get_param( 'params' ) ?? array();
		$params = array();
		$allowed_param_keys = array( 'currency', 'value', 'transaction_id', 'items', 'search_term', 'item_list_id', 'item_list_name', 'session_id', 'engagement_time_msec' );
		foreach ( $allowed_param_keys as $key ) {
			$val = $raw_params[$key] ?? null;
			if ( $val !== null ) {
				$params[$key] = $val;
			}
		}
		$user_id = '';
		if ( is_user_logged_in() ) {
			$user_id = strval( get_current_user_id() );
		}
		$result = $this->send_ga4_event( $event_name, $client_id, $user_id, $params );
		return array( 'success' => $result['success'], 'event_name' => $event_name, 'client_id' => $client_id );
	}

	public function test_event( $request ) {
		$measurement_id = get_option( 'headless_google_analytics_measurement_id', '' );
		$api_secret = get_option( 'headless_google_analytics_api_secret', '' );
		if ( ! $measurement_id || ! $api_secret ) {
			return array( 'success' => false, 'message' => 'Measurement ID and API Secret are required.' );
		}
		$url = 'https://www.google-analytics.com/debug/mp/collect?measurement_id=' . $measurement_id . '&api_secret=' . $api_secret;
		$client_id = strval( wp_rand( 1000000000, 9999999999 ) ) . '.' . strval( time() );
		$payload = array( 'client_id' => $client_id, 'events' => array( array( 'name' => 'page_view', 'params' => array( 'engagement_time_msec' => 1 ) ) ) );
		$response = wp_remote_post( $url, array( 'body' => json_encode( $payload ), 'headers' => array( 'Content-Type' => 'application/json' ), 'timeout' => 15 ) );
		if ( is_wp_error( $response ) ) {
			return array( 'success' => false, 'message' => $response->get_error_message() );
		}
		$code = intval( wp_remote_retrieve_response_code( $response ) );
		$body = wp_remote_retrieve_body( $response );
		$decoded = json_decode( $body, true );
		if ( $decoded && $decoded['validationMessages'] !== null ) {
			$messages = $decoded['validationMessages'];
			if ( count( $messages ) === 0 ) {
				return array( 'success' => true, 'message' => 'Measurement Protocol validation passed. Note: the debug endpoint does not validate your Measurement ID or API Secret — verify events appear in GA4 Realtime.' );
			}
			$error_details = '';
			foreach ( $messages as $msg ) {
				$error_details = $error_details . $msg['description'] . ' (' . $msg['fieldPath'] . ')
';
			}
			return array( 'success' => false, 'message' => 'Validation errors found.', 'validation_errors' => $error_details );
		}
		if ( $code >= 200 && $code < 300 ) {
			return array( 'success' => true, 'message' => 'Request sent successfully (HTTP ' . strval( $code ) . ').' );
		}
		return array( 'success' => false, 'message' => 'Unexpected response.', 'status' => $code, 'response' => $body );
	}

	public function get_last_error( $request ) {
		return array( 'last_error' => get_option( 'headless_google_analytics_last_error', '' ) );
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
		$response = wp_remote_post( $url, array( 'body' => json_encode( $payload ), 'headers' => array( 'Content-Type' => 'application/json' ), 'timeout' => 5 ) );
		if ( is_wp_error( $response ) ) {
			update_option( 'headless_google_analytics_last_error', $response->get_error_message() );
			return array( 'success' => false, 'message' => $response->get_error_message() );
		}
		return array( 'success' => true );
	}

}
