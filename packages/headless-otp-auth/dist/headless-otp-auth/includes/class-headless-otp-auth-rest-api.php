<?php

if ( ! defined( 'WPINC' ) ) {
	die;
}

class Headless_Otp_Auth_Rest_Api {

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
			'/otp/send',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'send_otp' ),
				'permission_callback' => '__return_true',
			)
		);
		register_rest_route(
			$this->namespace,
			'/otp/verify',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'verify_otp' ),
				'permission_callback' => '__return_true',
			)
		);
		register_rest_route(
			$this->namespace,
			'/otp/test-otp',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'get_test_otp' ),
				'permission_callback' => function() {
					return current_user_can( 'manage_options' );
				},
			)
		);
		register_rest_route(
			$this->namespace,
			'/auth/register',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'register_user' ),
				'permission_callback' => '__return_true',
			)
		);
		register_rest_route(
			$this->namespace,
			'/auth/refresh',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'refresh_token' ),
				'permission_callback' => '__return_true',
			)
		);
		register_rest_route(
			$this->namespace,
			'/auth/me',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'get_profile' ),
				'permission_callback' => function() {
					return current_user_can( 'read' );
				},
			)
		);
	}

	public function check_permissions() {
		return current_user_can( 'manage_options' );
	}

	public function get_settings( $request ) {
		$settings = array(
			'otp_test_mode' => (bool) get_option( 'headless_otp_auth_otp_test_mode', false ),
			'otp_server_url' => get_option( 'headless_otp_auth_otp_server_url', '' ),
						'otp_server_headers_template' => get_option( 'headless_otp_auth_otp_server_headers_template', '{}' ),
						'otp_server_payload_template' => get_option( 'headless_otp_auth_otp_server_payload_template', '{}' ),
						'otp_length' => get_option( 'headless_otp_auth_otp_length', 6 ),
						'otp_expiry' => get_option( 'headless_otp_auth_otp_expiry', 300 ),
						'max_otp_attempts' => get_option( 'headless_otp_auth_max_otp_attempts', 3 ),
						'jwt_access_expiry' => get_option( 'headless_otp_auth_jwt_access_expiry', 3600 ),
						'jwt_refresh_expiry' => get_option( 'headless_otp_auth_jwt_refresh_expiry', 604800 ),
						'allowed_origins' => get_option( 'headless_otp_auth_allowed_origins', '' ),
						'max_otp_verify_attempts' => get_option( 'headless_otp_auth_max_otp_verify_attempts', 3 ),
						'otp_resend_cooldown' => get_option( 'headless_otp_auth_otp_resend_cooldown', 60 ),
						'rate_limit_window' => get_option( 'headless_otp_auth_rate_limit_window', 900 ),
						'enable_registration' => (bool) get_option( 'headless_otp_auth_enable_registration', true ),
			'default_user_role' => get_option( 'headless_otp_auth_default_user_role', 'subscriber' ),
					);

		return rest_ensure_response( $settings );
	}

	public function update_settings( $request ) {
		$params = $request->get_json_params();

		if ( isset( $params['otp_test_mode'] ) ) {
			$value = rest_sanitize_boolean( $params['otp_test_mode'] );
			if ( null === $value ) {
				return new \WP_Error(
					'invalid_otp_test_mode',
					'Invalid value for otp_test_mode.',
					array( 'status' => 400 )
				);
			}
			update_option( 'headless_otp_auth_otp_test_mode', $value );
		}
		if ( isset( $params['otp_server_url'] ) ) {
			$value = sanitize_text_field( $params['otp_server_url'] );
			if ( null === $value ) {
				return new \WP_Error(
					'invalid_otp_server_url',
					'Invalid value for otp_server_url.',
					array( 'status' => 400 )
				);
			}
			update_option( 'headless_otp_auth_otp_server_url', $value );
		}
		if ( isset( $params['otp_server_headers_template'] ) ) {
			$value = sanitize_text_field( $params['otp_server_headers_template'] );
			if ( null === $value ) {
				return new \WP_Error(
					'invalid_otp_server_headers_template',
					'Invalid value for otp_server_headers_template.',
					array( 'status' => 400 )
				);
			}
			update_option( 'headless_otp_auth_otp_server_headers_template', $value );
		}
		if ( isset( $params['otp_server_payload_template'] ) ) {
			$value = sanitize_text_field( $params['otp_server_payload_template'] );
			if ( null === $value ) {
				return new \WP_Error(
					'invalid_otp_server_payload_template',
					'Invalid value for otp_server_payload_template.',
					array( 'status' => 400 )
				);
			}
			update_option( 'headless_otp_auth_otp_server_payload_template', $value );
		}
		if ( isset( $params['otp_length'] ) ) {
			$value = absint( $params['otp_length'] );
			if ( null === $value ) {
				return new \WP_Error(
					'invalid_otp_length',
					'Invalid value for otp_length.',
					array( 'status' => 400 )
				);
			}
			update_option( 'headless_otp_auth_otp_length', $value );
		}
		if ( isset( $params['otp_expiry'] ) ) {
			$value = absint( $params['otp_expiry'] );
			if ( null === $value ) {
				return new \WP_Error(
					'invalid_otp_expiry',
					'Invalid value for otp_expiry.',
					array( 'status' => 400 )
				);
			}
			update_option( 'headless_otp_auth_otp_expiry', $value );
		}
		if ( isset( $params['max_otp_attempts'] ) ) {
			$value = absint( $params['max_otp_attempts'] );
			if ( null === $value ) {
				return new \WP_Error(
					'invalid_max_otp_attempts',
					'Invalid value for max_otp_attempts.',
					array( 'status' => 400 )
				);
			}
			update_option( 'headless_otp_auth_max_otp_attempts', $value );
		}
		if ( isset( $params['jwt_access_expiry'] ) ) {
			$value = absint( $params['jwt_access_expiry'] );
			if ( null === $value ) {
				return new \WP_Error(
					'invalid_jwt_access_expiry',
					'Invalid value for jwt_access_expiry.',
					array( 'status' => 400 )
				);
			}
			update_option( 'headless_otp_auth_jwt_access_expiry', $value );
		}
		if ( isset( $params['jwt_refresh_expiry'] ) ) {
			$value = absint( $params['jwt_refresh_expiry'] );
			if ( null === $value ) {
				return new \WP_Error(
					'invalid_jwt_refresh_expiry',
					'Invalid value for jwt_refresh_expiry.',
					array( 'status' => 400 )
				);
			}
			update_option( 'headless_otp_auth_jwt_refresh_expiry', $value );
		}
		if ( isset( $params['allowed_origins'] ) ) {
			$value = sanitize_text_field( $params['allowed_origins'] );
			if ( null === $value ) {
				return new \WP_Error(
					'invalid_allowed_origins',
					'Invalid value for allowed_origins.',
					array( 'status' => 400 )
				);
			}
			update_option( 'headless_otp_auth_allowed_origins', $value );
		}
		if ( isset( $params['max_otp_verify_attempts'] ) ) {
			$value = absint( $params['max_otp_verify_attempts'] );
			if ( null === $value ) {
				return new \WP_Error(
					'invalid_max_otp_verify_attempts',
					'Invalid value for max_otp_verify_attempts.',
					array( 'status' => 400 )
				);
			}
			update_option( 'headless_otp_auth_max_otp_verify_attempts', $value );
		}
		if ( isset( $params['otp_resend_cooldown'] ) ) {
			$value = absint( $params['otp_resend_cooldown'] );
			if ( null === $value ) {
				return new \WP_Error(
					'invalid_otp_resend_cooldown',
					'Invalid value for otp_resend_cooldown.',
					array( 'status' => 400 )
				);
			}
			update_option( 'headless_otp_auth_otp_resend_cooldown', $value );
		}
		if ( isset( $params['rate_limit_window'] ) ) {
			$value = absint( $params['rate_limit_window'] );
			if ( null === $value ) {
				return new \WP_Error(
					'invalid_rate_limit_window',
					'Invalid value for rate_limit_window.',
					array( 'status' => 400 )
				);
			}
			update_option( 'headless_otp_auth_rate_limit_window', $value );
		}
		if ( isset( $params['enable_registration'] ) ) {
			$value = rest_sanitize_boolean( $params['enable_registration'] );
			if ( null === $value ) {
				return new \WP_Error(
					'invalid_enable_registration',
					'Invalid value for enable_registration.',
					array( 'status' => 400 )
				);
			}
			update_option( 'headless_otp_auth_enable_registration', $value );
		}
		if ( isset( $params['default_user_role'] ) ) {
			$value = sanitize_text_field( $params['default_user_role'] );
			if ( null === $value ) {
				return new \WP_Error(
					'invalid_default_user_role',
					'Invalid value for default_user_role.',
					array( 'status' => 400 )
				);
			}
			update_option( 'headless_otp_auth_default_user_role', $value );
		}

		return rest_ensure_response( array( 'success' => true ) );
	}

	public function send_otp( $request ) {
		$phone = sanitize_text_field( $request->get_param( 'phone' ) );
		if ( ! $phone ) {
			return new WP_Error( 'missing_phone', 'Phone number is required.', array( 'status' => 400 ) );
		}
		$phone_hash = md5( $phone );
		$attempts_key = 'hoa_attempts_' . $phone_hash;
		$current_attempts = get_transient( $attempts_key );
		$max_attempts = max( 1, intval( get_option( 'headless_otp_auth_max_otp_attempts', 3 ) ) );
		if ( $current_attempts && intval( $current_attempts ) >= $max_attempts ) {
			return new WP_Error( 'too_many_attempts', 'Too many OTP requests. Please try again later.', array( 'status' => 429 ) );
		}
		$cooldown_key = 'hoa_cooldown_' . $phone_hash;
		$cooldown_expiry = get_transient( $cooldown_key );
		if ( $cooldown_expiry ) {
			$retry_after = max( 0, intval( $cooldown_expiry ) - time() );
			return new WP_Error( 'cooldown_active', 'Please wait before requesting another OTP.', array( 'status' => 429, 'retry_after' => $retry_after ) );
		}
		$otp_len = max( 4, intval( get_option( 'headless_otp_auth_otp_length', 6 ) ) );
		$otp = '';
		for ( $i = 0; $i < $otp_len; $i++ ) {
			$otp = $otp . strval( wp_rand( 0, 9 ) );
		}
		$otp_expiry = max( 60, intval( get_option( 'headless_otp_auth_otp_expiry', 300 ) ) );
		$otp_hash = wp_hash_password( $otp );
		set_transient( 'hoa_otp_' . $phone_hash, $otp_hash, $otp_expiry );
		$rate_limit_window = max( 60, intval( get_option( 'headless_otp_auth_rate_limit_window', 900 ) ) );
		$new_attempts = $current_attempts ? intval( $current_attempts ) + 1 : 1;
		set_transient( $attempts_key, strval( $new_attempts ), $rate_limit_window );
		$cooldown = max( 10, intval( get_option( 'headless_otp_auth_otp_resend_cooldown', 60 ) ) );
		set_transient( $cooldown_key, strval( time() + $cooldown ), $cooldown );
		$test_mode = get_option( 'headless_otp_auth_otp_test_mode', '' );
		if ( $test_mode === '1' ) {
			set_transient( 'hoa_test_otp_latest', json_encode( array( 'otp' => $otp, 'phone' => $phone, 'created_at' => time() ) ), $otp_expiry );
			return array( 'success' => true, 'message' => 'OTP generated in test mode.' );
		}
		$server_url = get_option( 'headless_otp_auth_otp_server_url', '' );
		if ( ! $server_url ) {
			return new WP_Error( 'otp_not_configured', 'OTP delivery is not configured.', array( 'status' => 500 ) );
		}
		$site_name = get_option( 'blogname', '' );
		$site_url_val = site_url();
		$safe_phone = $this->escape_for_json( $phone );
		$safe_otp = $this->escape_for_json( $otp );
		$safe_site_name = $this->escape_for_json( $site_name );
		$safe_site_url = $this->escape_for_json( $site_url_val );
		$payload_template = get_option( 'headless_otp_auth_otp_server_payload_template', '{}' );
		$payload = $payload_template;
		$payload = str_replace( '{{phone}}', $safe_phone, $payload );
		$payload = str_replace( '{{otp}}', $safe_otp, $payload );
		$payload = str_replace( '{{siteName}}', $safe_site_name, $payload );
		$payload = str_replace( '{{siteUrl}}', $safe_site_url, $payload );
		$headers_template = get_option( 'headless_otp_auth_otp_server_headers_template', '{}' );
		$headers_json = $headers_template;
		$headers_json = str_replace( '{{phone}}', $safe_phone, $headers_json );
		$headers_json = str_replace( '{{otp}}', $safe_otp, $headers_json );
		$headers_json = str_replace( '{{siteName}}', $safe_site_name, $headers_json );
		$headers_json = str_replace( '{{siteUrl}}', $safe_site_url, $headers_json );
		$custom_headers = json_decode( $headers_json, true );
		$headers = array_merge( array( 'Content-Type' => 'application/json' ), $custom_headers );
		$response = wp_remote_post( $server_url, array( 'body' => $payload, 'headers' => $headers, 'timeout' => 15 ) );
		if ( is_wp_error( $response ) ) {
			return new WP_Error( 'otp_send_failed', 'Failed to send OTP.', array( 'status' => 500 ) );
		}
		$response_code = intval( wp_remote_retrieve_response_code( $response ) );
		if ( $response_code < 200 || $response_code >= 300 ) {
			return new WP_Error( 'otp_send_failed', 'OTP delivery server returned an error.', array( 'status' => 502 ) );
		}
		return array( 'success' => true, 'message' => 'OTP sent successfully.' );
	}

	public function verify_otp( $request ) {
		$phone = sanitize_text_field( $request->get_param( 'phone' ) );
		$otp = sanitize_text_field( $request->get_param( 'otp' ) );
		if ( ! $phone || ! $otp ) {
			return new WP_Error( 'missing_params', 'Phone number and OTP are required.', array( 'status' => 400 ) );
		}
		$phone_hash = md5( $phone );
		$stored_otp_hash = get_transient( 'hoa_otp_' . $phone_hash );
		if ( ! $stored_otp_hash ) {
			return new WP_Error( 'otp_expired', 'OTP has expired or was not requested.', array( 'status' => 400 ) );
		}
		$verify_key = 'hoa_verify_' . $phone_hash;
		$verify_attempts = get_transient( $verify_key );
		$max_verify = max( 1, intval( get_option( 'headless_otp_auth_max_otp_verify_attempts', 3 ) ) );
		if ( $verify_attempts && intval( $verify_attempts ) >= $max_verify ) {
			delete_transient( 'hoa_otp_' . $phone_hash );
			return new WP_Error( 'too_many_verify_attempts', 'Too many failed attempts. Please request a new OTP.', array( 'status' => 429 ) );
		}
		if ( ! wp_check_password( $otp, $stored_otp_hash ) ) {
			$new_verify = $verify_attempts ? intval( $verify_attempts ) + 1 : 1;
			$verify_expiry = max( 60, intval( get_option( 'headless_otp_auth_rate_limit_window', 900 ) ) );
			set_transient( $verify_key, strval( $new_verify ), $verify_expiry );
			return new WP_Error( 'invalid_otp', 'Invalid OTP.', array( 'status' => 400 ) );
		}
		delete_transient( 'hoa_otp_' . $phone_hash );
		delete_transient( 'hoa_attempts_' . $phone_hash );
		delete_transient( 'hoa_verify_' . $phone_hash );
		$user_ids = get_users( array( 'meta_key' => 'phone_number', 'meta_value' => $phone, 'number' => 1, 'fields' => 'ids' ) );
		if ( count( $user_ids ) === 0 && class_exists( 'WooCommerce' ) ) {
			$wc_ids = get_users( array( 'meta_key' => 'billing_phone', 'meta_value' => $phone, 'number' => 1, 'fields' => 'ids' ) );
			if ( count( $wc_ids ) > 0 ) {
				update_user_meta( intval( $wc_ids[0] ), 'phone_number', $phone );
				$user_ids = $wc_ids;
			}
		}
		if ( count( $user_ids ) > 0 ) {
			$existing_user_id = intval( $user_ids[0] );
			$secret = get_option( 'headless_otp_auth_jwt_secret_key', '' );
			if ( ! $secret ) {
				return new WP_Error( 'config_error', 'JWT is not configured.', array( 'status' => 403 ) );
			}
			$access_expiry = intval( get_option( 'headless_otp_auth_jwt_access_expiry', 3600 ) );
			$refresh_expiry = intval( get_option( 'headless_otp_auth_jwt_refresh_expiry', 604800 ) );
			$access_token = apply_filters( 'hoa_generate_jwt', '', $existing_user_id, 'access', $access_expiry, $secret );
			$refresh_token = apply_filters( 'hoa_generate_jwt', '', $existing_user_id, 'refresh', $refresh_expiry, $secret );
			update_user_meta( $existing_user_id, 'hoa_refresh_token_hash', wp_hash_password( $refresh_token ) );
			update_user_meta( $existing_user_id, 'hoa_refresh_token_expiry', strval( time() + $refresh_expiry ) );
			if ( class_exists( 'WooCommerce' ) ) {
				update_user_meta( $existing_user_id, 'billing_phone', $phone );
			}
			$display_name = get_the_author_meta( 'display_name', $existing_user_id );
			return array( 'is_new_user' => false, 'access_token' => $access_token, 'refresh_token' => $refresh_token, 'user' => array( 'id' => $existing_user_id, 'name' => $display_name, 'phone' => $phone ) );
		}
		$reg_enabled = get_option( 'headless_otp_auth_enable_registration', '1' );
		if ( $reg_enabled !== '1' ) {
			return array( 'is_new_user' => true, 'registration_disabled' => true, 'message' => 'New user registration is currently disabled.' );
		}
		$reg_token = wp_generate_password( 32, false, false );
		$reg_token_hash = md5( $reg_token );
		set_transient( 'hoa_reg_' . $reg_token_hash, $phone, 600 );
		return array( 'is_new_user' => true, 'registration_token' => $reg_token );
	}

	public function get_test_otp( $request ) {
		$test_mode = get_option( 'headless_otp_auth_otp_test_mode', '' );
		if ( $test_mode !== '1' ) {
			return array( 'test_mode' => false );
		}
		$data = get_transient( 'hoa_test_otp_latest' );
		if ( ! $data ) {
			return array( 'test_mode' => true, 'otp' => null );
		}
		$parsed = json_decode( $data, true );
		return array( 'test_mode' => true, 'otp' => $parsed['otp'], 'phone' => $parsed['phone'], 'created_at' => $parsed['created_at'] );
	}

	public function register_user( $request ) {
		$reg_token = sanitize_text_field( $request->get_param( 'registration_token' ) );
		$name = sanitize_text_field( $request->get_param( 'name' ) );
		if ( ! $reg_token || ! $name ) {
			return new WP_Error( 'missing_params', 'Registration token and name are required.', array( 'status' => 400 ) );
		}
		$reg_enabled = get_option( 'headless_otp_auth_enable_registration', '1' );
		if ( $reg_enabled !== '1' ) {
			return new WP_Error( 'registration_disabled', 'New user registration is disabled.', array( 'status' => 403 ) );
		}
		$reg_token_hash = md5( $reg_token );
		$phone = get_transient( 'hoa_reg_' . $reg_token_hash );
		if ( ! $phone ) {
			return new WP_Error( 'invalid_token', 'Registration token is invalid or expired.', array( 'status' => 400 ) );
		}
		$existing_ids = get_users( array( 'meta_key' => 'phone_number', 'meta_value' => $phone, 'number' => 1, 'fields' => 'ids' ) );
		if ( count( $existing_ids ) === 0 && class_exists( 'WooCommerce' ) ) {
			$wc_ids = get_users( array( 'meta_key' => 'billing_phone', 'meta_value' => $phone, 'number' => 1, 'fields' => 'ids' ) );
			if ( count( $wc_ids ) > 0 ) {
				update_user_meta( intval( $wc_ids[0] ), 'phone_number', $phone );
				$existing_ids = $wc_ids;
			}
		}
		if ( count( $existing_ids ) > 0 ) {
			delete_transient( 'hoa_reg_' . $reg_token_hash );
			return new WP_Error( 'user_exists', 'An account with this phone number already exists.', array( 'status' => 409 ) );
		}
		$base_username = sanitize_user( str_replace( ' ', '', strtolower( $name ) ), true );
		if ( ! $base_username ) {
			$base_username = 'user';
		}
		$username = $base_username;
		if ( username_exists( $username ) ) {
			$phone_suffix = strlen( $phone ) >= 4 ? substr( $phone, strlen( $phone ) - 4 ) : $phone;
			$username = $base_username . $phone_suffix;
			$counter = 2;
			while ( username_exists( $username ) ) {
				$username = $base_username . $phone_suffix . strval( $counter );
				$counter = $counter + 1;
			}
		}
		$password = wp_generate_password( 24, true, true );
		$name_parts = explode( ' ', $name );
		$first_name = $name_parts[0];
		$last_name = count( $name_parts ) > 1 ? implode( ' ', array_slice( $name_parts, 1 ) ) : '';
		$user_role = get_option( 'headless_otp_auth_default_user_role', 'subscriber' );
		$new_user_id = wp_insert_user( array( 'user_login' => $username, 'user_pass' => $password, 'display_name' => $name, 'nickname' => $first_name, 'first_name' => $first_name, 'last_name' => $last_name, 'role' => $user_role ) );
		if ( is_wp_error( $new_user_id ) ) {
			return new WP_Error( 'registration_failed', 'Failed to create user account.', array( 'status' => 500 ) );
		}
		$user_id = intval( $new_user_id );
		update_user_meta( $user_id, 'phone_number', $phone );
		if ( class_exists( 'WooCommerce' ) ) {
			update_user_meta( $user_id, 'billing_phone', $phone );
			update_user_meta( $user_id, 'billing_first_name', $first_name );
			update_user_meta( $user_id, 'billing_last_name', $last_name );
		}
		delete_transient( 'hoa_reg_' . $reg_token_hash );
		$secret = get_option( 'headless_otp_auth_jwt_secret_key', '' );
		if ( ! $secret ) {
			return new WP_Error( 'config_error', 'JWT is not configured.', array( 'status' => 403 ) );
		}
		$access_expiry = intval( get_option( 'headless_otp_auth_jwt_access_expiry', 3600 ) );
		$refresh_expiry = intval( get_option( 'headless_otp_auth_jwt_refresh_expiry', 604800 ) );
		$access_token = apply_filters( 'hoa_generate_jwt', '', $user_id, 'access', $access_expiry, $secret );
		$refresh_token = apply_filters( 'hoa_generate_jwt', '', $user_id, 'refresh', $refresh_expiry, $secret );
		update_user_meta( $user_id, 'hoa_refresh_token_hash', wp_hash_password( $refresh_token ) );
		update_user_meta( $user_id, 'hoa_refresh_token_expiry', strval( time() + $refresh_expiry ) );
		return array( 'access_token' => $access_token, 'refresh_token' => $refresh_token, 'user' => array( 'id' => $user_id, 'name' => $name, 'phone' => $phone ) );
	}

	public function refresh_token( $request ) {
		$refresh_token_str = $request->get_param( 'refresh_token' );
		if ( ! $refresh_token_str ) {
			return new WP_Error( 'missing_token', 'Refresh token is required.', array( 'status' => 400 ) );
		}
		$secret = get_option( 'headless_otp_auth_jwt_secret_key', '' );
		if ( ! $secret ) {
			return new WP_Error( 'config_error', 'JWT is not configured.', array( 'status' => 403 ) );
		}
		$token_parts = explode( '.', $refresh_token_str );
		if ( count( $token_parts ) !== 3 ) {
			return new WP_Error( 'invalid_token', 'Invalid refresh token format.', array( 'status' => 400 ) );
		}
		$header_payload = $token_parts[0] . '.' . $token_parts[1];
		$expected_sig = strtr( rtrim( base64_encode( hash_hmac( 'sha256', $header_payload, $secret, true ) ), '=' ), '+/', '-_' );
		if ( ! hash_equals( $expected_sig, $token_parts[2] ) ) {
			return new WP_Error( 'invalid_token', 'Invalid refresh token.', array( 'status' => 401 ) );
		}
		$payload_json = base64_decode( strtr( $token_parts[1], '-_', '+/' ) );
		$payload = json_decode( $payload_json, true );
		if ( ! $payload || $payload['type'] !== 'refresh' ) {
			return new WP_Error( 'invalid_token', 'Token is not a refresh token.', array( 'status' => 400 ) );
		}
		if ( $payload['exp'] < time() ) {
			return new WP_Error( 'token_expired', 'Refresh token has expired.', array( 'status' => 401 ) );
		}
		if ( $payload['iss'] !== site_url() ) {
			return new WP_Error( 'invalid_token', 'Token issuer mismatch.', array( 'status' => 401 ) );
		}
		$user_id = intval( $payload['sub'] );
		if ( ! $user_id ) {
			return new WP_Error( 'invalid_token', 'Invalid user in token.', array( 'status' => 400 ) );
		}
		$stored_hash = get_user_meta( $user_id, 'hoa_refresh_token_hash', true );
		if ( ! $stored_hash || ! wp_check_password( $refresh_token_str, $stored_hash ) ) {
			return new WP_Error( 'invalid_token', 'Refresh token has been revoked.', array( 'status' => 401 ) );
		}
		$stored_expiry = intval( get_user_meta( $user_id, 'hoa_refresh_token_expiry', true ) );
		if ( $stored_expiry < time() ) {
			delete_user_meta( $user_id, 'hoa_refresh_token_hash' );
			delete_user_meta( $user_id, 'hoa_refresh_token_expiry' );
			return new WP_Error( 'token_expired', 'Refresh token has expired.', array( 'status' => 401 ) );
		}
		$access_expiry = intval( get_option( 'headless_otp_auth_jwt_access_expiry', 3600 ) );
		$refresh_expiry = intval( get_option( 'headless_otp_auth_jwt_refresh_expiry', 604800 ) );
		$new_access_token = apply_filters( 'hoa_generate_jwt', '', $user_id, 'access', $access_expiry, $secret );
		$new_refresh_token = apply_filters( 'hoa_generate_jwt', '', $user_id, 'refresh', $refresh_expiry, $secret );
		update_user_meta( $user_id, 'hoa_refresh_token_hash', wp_hash_password( $new_refresh_token ) );
		update_user_meta( $user_id, 'hoa_refresh_token_expiry', strval( time() + $refresh_expiry ) );
		return array( 'access_token' => $new_access_token, 'refresh_token' => $new_refresh_token );
	}

	public function get_profile( $request ) {
		$user_id = get_current_user_id();
		if ( ! $user_id ) {
			return new WP_Error( 'not_authenticated', 'You must be logged in.', array( 'status' => 401 ) );
		}
		$display_name = get_the_author_meta( 'display_name', $user_id );
		$phone = get_user_meta( $user_id, 'phone_number', true );
		return array( 'id' => $user_id, 'name' => $display_name, 'phone' => $phone );
	}

	public function escape_for_json( $value ) {
		$encoded = json_encode( $value );
		if ( ! $encoded ) {
			return '';
		}
		$len = strlen( $encoded );
		return substr( $encoded, 1, $len - 2 );
	}

}
