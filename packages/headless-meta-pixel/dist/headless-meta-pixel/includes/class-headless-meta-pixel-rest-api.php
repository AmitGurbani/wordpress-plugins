<?php

if ( ! defined( 'WPINC' ) ) {
	die;
}

class Headless_Meta_Pixel_Rest_Api {

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
			'/diagnostics/test-capi',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'test_capi' ),
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
			'pixel_id' => get_option( 'headless_meta_pixel_pixel_id', '' ),
						'access_token' => get_option( 'headless_meta_pixel_access_token', '' ) ? '********' : '',
			'test_event_code' => get_option( 'headless_meta_pixel_test_event_code', '' ),
						'currency' => get_option( 'headless_meta_pixel_currency', 'USD' ),
						'enable_view_content' => (bool) get_option( 'headless_meta_pixel_enable_view_content', true ),
			'enable_add_to_cart' => (bool) get_option( 'headless_meta_pixel_enable_add_to_cart', true ),
			'enable_initiate_checkout' => (bool) get_option( 'headless_meta_pixel_enable_initiate_checkout', true ),
			'enable_purchase' => (bool) get_option( 'headless_meta_pixel_enable_purchase', true ),
			'enable_search' => (bool) get_option( 'headless_meta_pixel_enable_search', true ),
			'enable_capi' => (bool) get_option( 'headless_meta_pixel_enable_capi', true ),
		);

		return rest_ensure_response( $settings );
	}

	public function update_settings( $request ) {
		$params = $request->get_json_params();

		if ( isset( $params['pixel_id'] ) ) {
			$value = sanitize_text_field( $params['pixel_id'] );
			if ( null === $value ) {
				return new \WP_Error(
					'invalid_pixel_id',
					'Invalid value for pixel_id.',
					array( 'status' => 400 )
				);
			}
			update_option( 'headless_meta_pixel_pixel_id', $value );
		}
		if ( isset( $params['access_token'] ) ) {
			$value = sanitize_text_field( $params['access_token'] );
			if ( null === $value ) {
				return new \WP_Error(
					'invalid_access_token',
					'Invalid value for access_token.',
					array( 'status' => 400 )
				);
			}
			update_option( 'headless_meta_pixel_access_token', $value );
		}
		if ( isset( $params['test_event_code'] ) ) {
			$value = sanitize_text_field( $params['test_event_code'] );
			if ( null === $value ) {
				return new \WP_Error(
					'invalid_test_event_code',
					'Invalid value for test_event_code.',
					array( 'status' => 400 )
				);
			}
			update_option( 'headless_meta_pixel_test_event_code', $value );
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
			update_option( 'headless_meta_pixel_currency', $value );
		}
		if ( isset( $params['enable_view_content'] ) ) {
			$value = rest_sanitize_boolean( $params['enable_view_content'] );
			if ( null === $value ) {
				return new \WP_Error(
					'invalid_enable_view_content',
					'Invalid value for enable_view_content.',
					array( 'status' => 400 )
				);
			}
			update_option( 'headless_meta_pixel_enable_view_content', $value );
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
			update_option( 'headless_meta_pixel_enable_add_to_cart', $value );
		}
		if ( isset( $params['enable_initiate_checkout'] ) ) {
			$value = rest_sanitize_boolean( $params['enable_initiate_checkout'] );
			if ( null === $value ) {
				return new \WP_Error(
					'invalid_enable_initiate_checkout',
					'Invalid value for enable_initiate_checkout.',
					array( 'status' => 400 )
				);
			}
			update_option( 'headless_meta_pixel_enable_initiate_checkout', $value );
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
			update_option( 'headless_meta_pixel_enable_purchase', $value );
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
			update_option( 'headless_meta_pixel_enable_search', $value );
		}
		if ( isset( $params['enable_capi'] ) ) {
			$value = rest_sanitize_boolean( $params['enable_capi'] );
			if ( null === $value ) {
				return new \WP_Error(
					'invalid_enable_capi',
					'Invalid value for enable_capi.',
					array( 'status' => 400 )
				);
			}
			update_option( 'headless_meta_pixel_enable_capi', $value );
		}

		return rest_ensure_response( array( 'success' => true ) );
	}

	public function get_config( $request ) {
		$pixel_id = get_option( 'headless_meta_pixel_pixel_id', '' );
		return array( 'pixel_id' => $pixel_id );
	}

	public function track_event( $request ) {
		$rl_headers = function_exists( 'getallheaders' ) ? getallheaders() : array();
		$rl_ip = '';
		$rl_cf_ip = $rl_headers['CF-Connecting-IP'] ?? '';
		$rl_fwd_for = $rl_headers['X-Forwarded-For'] ?? '';
		$rl_real_ip = $rl_headers['X-Real-IP'] ?? '';
		if ( $rl_cf_ip ) {
			$rl_ip = trim( $rl_cf_ip );
		} elseif ( $rl_fwd_for ) {
			$rl_parts = explode( ',', $rl_fwd_for );
			$rl_ip = trim( $rl_parts[0] );
		} elseif ( $rl_real_ip ) {
			$rl_ip = trim( $rl_real_ip );
		} else {
			$rl_ip = $_SERVER['REMOTE_ADDR'] ?? '';
		}
		$rl_key = 'hmp_rl_' . md5( $rl_ip );
		$rl_count = get_transient( $rl_key );
		if ( $rl_count && intval( $rl_count ) >= 60 ) {
			return new WP_Error( 'rate_limited', 'Too many requests. Please try again later.', array( 'status' => 429 ) );
		}
		set_transient( $rl_key, strval( $rl_count ? intval( $rl_count ) + 1 : 1 ), 60 );
		if ( get_option( 'headless_meta_pixel_enable_capi', '1' ) !== '1' ) {
			return new WP_Error( 'capi_disabled', 'Conversions API is disabled.', array( 'status' => 403 ) );
		}
		$event_name = sanitize_text_field( $request->get_param( 'event_name' ) );
		$event_id = sanitize_text_field( $request->get_param( 'event_id' ) );
		$event_source_url = esc_url_raw( $request->get_param( 'event_source_url' ) );
		$raw_custom_data = $request->get_param( 'custom_data' ) ?? array();
		$custom_data = array();
		$allowed_custom_data_keys = array( 'currency', 'value', 'content_type', 'contents', 'content_ids', 'search_string', 'num_items', 'order_id' );
		foreach ( $allowed_custom_data_keys as $key ) {
			$val = $raw_custom_data[$key] ?? null;
			if ( $val !== null ) {
				$custom_data[$key] = $val;
			}
		}
		if ( $custom_data['contents'] !== null && ! is_array( $custom_data['contents'] ) ) {
			unset( $custom_data['contents'] );
		}
		if ( $custom_data['content_ids'] !== null && ! is_array( $custom_data['content_ids'] ) ) {
			unset( $custom_data['content_ids'] );
		}
		if ( ! $event_name || ! $event_id ) {
			return new WP_Error( 'missing_params', 'event_name and event_id are required.', array( 'status' => 400 ) );
		}
		$allowed_events = array( 'ViewContent' => 'enable_view_content', 'AddToCart' => 'enable_add_to_cart', 'InitiateCheckout' => 'enable_initiate_checkout', 'Purchase' => 'enable_purchase', 'Search' => 'enable_search' );
		$setting_key = $allowed_events[$event_name];
		if ( ! $setting_key ) {
			return new WP_Error( 'invalid_event', 'Event name is not supported.', array( 'status' => 400 ) );
		}
		if ( get_option( 'headless_meta_pixel_' . $setting_key, '1' ) !== '1' ) {
			return new WP_Error( 'event_disabled', 'This event type is disabled.', array( 'status' => 403 ) );
		}
		$user_data = array();
		$fbp = sanitize_text_field( $request->get_param( '_fbp' ) );
		if ( $fbp ) {
			$user_data['fbp'] = $fbp;
		}
		$fbc = sanitize_text_field( $request->get_param( '_fbc' ) );
		if ( $fbc ) {
			$user_data['fbc'] = $fbc;
		}
		$headers = function_exists( 'getallheaders' ) ? getallheaders() : array();
		$user_agent = $headers['User-Agent'] ?? '';
		if ( $user_agent ) {
			$user_data['client_user_agent'] = $user_agent;
		}
		$client_ip = '';
		$cf_ip = $headers['CF-Connecting-IP'] ?? '';
		$forwarded_for = $headers['X-Forwarded-For'] ?? '';
		$real_ip = $headers['X-Real-IP'] ?? '';
		if ( $cf_ip ) {
			$client_ip = trim( $cf_ip );
		} elseif ( $forwarded_for ) {
			$parts = explode( ',', $forwarded_for );
			$client_ip = trim( $parts[0] );
		} elseif ( $real_ip ) {
			$client_ip = trim( $real_ip );
		} else {
			$client_ip = $_SERVER['REMOTE_ADDR'] ?? '';
		}
		if ( $client_ip ) {
			$user_data['client_ip_address'] = $client_ip;
		}
		if ( is_user_logged_in() ) {
			$user_id = get_current_user_id();
			$user_email = get_the_author_meta( 'user_email', $user_id );
			if ( $user_email ) {
				$user_data['em'] = $this->hash_for_capi( $user_email );
			}
			$first_name = get_user_meta( $user_id, 'first_name', true );
			if ( $first_name ) {
				$user_data['fn'] = $this->hash_for_capi( $first_name );
			}
			$last_name = get_user_meta( $user_id, 'last_name', true );
			if ( $last_name ) {
				$user_data['ln'] = $this->hash_for_capi( $last_name );
			}
			$user_data['external_id'] = $this->hash_for_capi( strval( $user_id ) );
		}
		$result = $this->send_capi_event( $event_name, $event_id, $event_source_url, $custom_data, $user_data );
		return array( 'success' => $result['success'], 'event_id' => $event_id );
	}

	public function test_capi( $request ) {
		$pixel_id = get_option( 'headless_meta_pixel_pixel_id', '' );
		$access_token = get_option( 'headless_meta_pixel_access_token', '' );
		if ( ! $pixel_id || ! $access_token ) {
			return array( 'success' => false, 'message' => 'Pixel ID and Access Token are required.' );
		}
		$test_event_code = get_option( 'headless_meta_pixel_test_event_code', '' );
		if ( ! $test_event_code ) {
			return array( 'success' => false, 'message' => 'Set a Test Event Code in settings first.' );
		}
		$url = 'https://graph.facebook.com/v25.0/' . $pixel_id . '/events?access_token=' . $access_token;
		$payload = array( 'data' => array( array( 'event_name' => 'PageView', 'event_time' => time(), 'event_id' => 'test_' . strval( time() ), 'action_source' => 'website', 'event_source_url' => site_url(), 'user_data' => array( 'client_user_agent' => 'headless-meta-pixel-plugin-test' ) ) ), 'test_event_code' => $test_event_code );
		$response = wp_remote_post( $url, array( 'body' => json_encode( $payload ), 'headers' => array( 'Content-Type' => 'application/json' ), 'timeout' => 15 ) );
		if ( is_wp_error( $response ) ) {
			return array( 'success' => false, 'message' => $response->get_error_message() );
		}
		$code = intval( wp_remote_retrieve_response_code( $response ) );
		$body = wp_remote_retrieve_body( $response );
		if ( $code >= 200 && $code < 300 ) {
			return array( 'success' => true, 'message' => 'CAPI connection successful. Check Test Events in Meta Events Manager.', 'test_event_code' => $test_event_code );
		}
		return array( 'success' => false, 'message' => 'CAPI returned error.', 'status' => $code, 'response' => $body );
	}

	public function get_last_error( $request ) {
		return array( 'last_error' => get_option( 'headless_meta_pixel_last_capi_error', '' ) );
	}

	public function hash_for_capi( $value ) {
		if ( ! $value ) {
			return '';
		}
		$normalized = strtolower( trim( $value ) );
		return hash( 'sha256', $normalized );
	}

	public function send_capi_event( $event_name, $event_id, $source_url, $custom_data, $user_data ) {
		$pixel_id = get_option( 'headless_meta_pixel_pixel_id', '' );
		$access_token = get_option( 'headless_meta_pixel_access_token', '' );
		if ( ! $pixel_id || ! $access_token ) {
			return array( 'success' => false, 'message' => 'Pixel ID or Access Token not configured.' );
		}
		$event = array( 'event_name' => $event_name, 'event_time' => time(), 'event_id' => $event_id, 'action_source' => 'website', 'user_data' => $user_data, 'custom_data' => $custom_data );
		if ( $source_url ) {
			$event['event_source_url'] = $source_url;
		}
		$payload = array( 'data' => array( $event ) );
		$test_event_code = get_option( 'headless_meta_pixel_test_event_code', '' );
		if ( $test_event_code ) {
			$payload['test_event_code'] = $test_event_code;
		}
		$url = 'https://graph.facebook.com/v25.0/' . $pixel_id . '/events?access_token=' . $access_token;
		$response = wp_remote_post( $url, array( 'body' => json_encode( $payload ), 'headers' => array( 'Content-Type' => 'application/json' ), 'timeout' => 5 ) );
		if ( is_wp_error( $response ) ) {
			update_option( 'headless_meta_pixel_last_capi_error', $response->get_error_message() );
			return array( 'success' => false, 'message' => $response->get_error_message() );
		}
		return array( 'success' => true );
	}

}
