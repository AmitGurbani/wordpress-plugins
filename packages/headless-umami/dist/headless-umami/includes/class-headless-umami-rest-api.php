<?php

if ( ! defined( 'WPINC' ) ) {
	die;
}

class Headless_Umami_Rest_Api {

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
			'/diagnostics/test-connection',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'test_connection' ),
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
			'umami_url' => get_option( 'headless_umami_umami_url', '' ),
			'website_id' => get_option( 'headless_umami_website_id', '' ),
			'enable_purchase' => (bool) get_option( 'headless_umami_enable_purchase', true ),
		);

		return rest_ensure_response( $settings );
	}

	public function update_settings( $request ) {
		$params = $request->get_json_params();

		if ( isset( $params['umami_url'] ) ) {
			$value = esc_url_raw( $params['umami_url'] );
			if ( null === $value ) {
				return new \WP_Error(
					'invalid_umami_url',
					__( 'Invalid value for umami_url.', 'headless-umami' ),
					array( 'status' => 400 )
				);
			}
			update_option( 'headless_umami_umami_url', $value );
		}
		if ( isset( $params['website_id'] ) ) {
			$value = sanitize_text_field( $params['website_id'] );
			if ( null === $value ) {
				return new \WP_Error(
					'invalid_website_id',
					__( 'Invalid value for website_id.', 'headless-umami' ),
					array( 'status' => 400 )
				);
			}
			update_option( 'headless_umami_website_id', $value );
		}
		if ( isset( $params['enable_purchase'] ) ) {
			$value = rest_sanitize_boolean( $params['enable_purchase'] );
			if ( null === $value ) {
				return new \WP_Error(
					'invalid_enable_purchase',
					__( 'Invalid value for enable_purchase.', 'headless-umami' ),
					array( 'status' => 400 )
				);
			}
			update_option( 'headless_umami_enable_purchase', $value );
		}

		return rest_ensure_response( array( 'success' => true ) );
	}

	public function get_config( $request ) {
		$umami_url = esc_url_raw( get_option( 'headless_umami_umami_url', '' ) );
		$website_id = get_option( 'headless_umami_website_id', '' );
		return array( 'umami_url' => $umami_url, 'website_id' => $website_id );
	}

	public function test_connection( $request ) {
		$result = $this->send_umami_event( 'plugin_test', '/', 'Plugin Connection Test', array( 'source' => 'headless-umami-diagnostics' ) );
		if ( $result['success'] ) {
			return array( 'success' => true, 'message' => 'Connection to Umami successful. A test event was sent.' );
		}
		return $result;
	}

	public function get_last_error( $request ) {
		return rest_ensure_response( array(
			'last_error' => get_option( 'headless_umami_last_error', '' ),
		) );
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
		$response = wp_safe_remote_post( $api_url, array( 'body' => wp_json_encode( $payload ), 'headers' => array( 'Content-Type' => 'application/json', 'User-Agent' => 'Mozilla/5.0 (compatible; HeadlessUmami/1.0; +wordpress)' ), 'timeout' => 5 ) );
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
