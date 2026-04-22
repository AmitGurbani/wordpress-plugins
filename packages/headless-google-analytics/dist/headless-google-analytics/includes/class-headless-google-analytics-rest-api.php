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
			'/config',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'get_config' ),
				'permission_callback' => '__return_true',
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
			'api_secret' => get_option( 'headless_google_analytics_api_secret', '' ) ? '********' : '',
			'currency' => get_option( 'headless_google_analytics_currency', 'USD' ),
			'enable_purchase' => (bool) get_option( 'headless_google_analytics_enable_purchase', true ),
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
					__( 'Invalid value for measurement_id.', 'headless-google-analytics' ),
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
					__( 'Invalid value for api_secret.', 'headless-google-analytics' ),
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
					__( 'Invalid value for currency.', 'headless-google-analytics' ),
					array( 'status' => 400 )
				);
			}
			update_option( 'headless_google_analytics_currency', $value );
		}
		if ( isset( $params['enable_purchase'] ) ) {
			$value = rest_sanitize_boolean( $params['enable_purchase'] );
			if ( null === $value ) {
				return new \WP_Error(
					'invalid_enable_purchase',
					__( 'Invalid value for enable_purchase.', 'headless-google-analytics' ),
					array( 'status' => 400 )
				);
			}
			update_option( 'headless_google_analytics_enable_purchase', $value );
		}

		return rest_ensure_response( array( 'success' => true ) );
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
		$response = wp_remote_post( $url, array( 'body' => wp_json_encode( $payload ), 'headers' => array( 'Content-Type' => 'application/json' ), 'timeout' => 15 ) );
		if ( is_wp_error( $response ) ) {
			return array( 'success' => false, 'message' => $response->get_error_message() );
		}
		$code = intval( wp_remote_retrieve_response_code( $response ) );
		$body = wp_remote_retrieve_body( $response );
		$decoded = json_decode( $body, true );
		if ( $decoded && isset( $decoded['validationMessages'] ) ) {
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

	public function get_config( $request ) {
		$config = array();
		$config['measurement_id'] = get_option( 'headless_google_analytics_measurement_id', '' );
		return rest_ensure_response( $config );
	}

	public function get_last_error( $request ) {
		return rest_ensure_response( array(
			'last_error' => get_option( 'headless_google_analytics_last_error', '' ),
		) );
	}

}
