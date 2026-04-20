<?php

if ( ! defined( 'WPINC' ) ) {
	die;
}

class Headless_Auth_Public {

	private $plugin_name;
	private $version;

	public function __construct( $plugin_name, $version ) {
		$this->plugin_name = $plugin_name;
		$this->version     = $version;
	}

	public function register_jwt_helper() {
		add_filter( 'headless_auth_generate_jwt', function( $value, $user_id, $token_type, $expiry, $secret ) {
		if ( ! $secret ) {
			return '';
		}
		$header_data = wp_json_encode( array( 'alg' => 'HS256', 'typ' => 'JWT' ) );
		$payload_data = wp_json_encode( array( 'iss' => site_url(), 'sub' => $user_id, 'iat' => time(), 'exp' => time() + $expiry, 'type' => $token_type ) );
		$b64_header = strtr( rtrim( base64_encode( $header_data ), '=' ), '+/', '-_' );
		$b64_payload = strtr( rtrim( base64_encode( $payload_data ), '=' ), '+/', '-_' );
		$header_payload = $b64_header . '.' . $b64_payload;
		$signature = strtr( rtrim( base64_encode( hash_hmac( 'sha256', $header_payload, $secret, true ) ), '=' ), '+/', '-_' );
		return $header_payload . '.' . $signature;
	}, 10, 5 );
	}

	public function handle_cors( $served ) {
		$origins_str = get_option( 'headless_auth_allowed_origins', '' );
		if ( ! $origins_str ) {
			return $served;
		}
		$headers = function_exists( 'getallheaders' ) ? getallheaders() : array();
		$origin = $headers['Origin'] ?? '';
		if ( ! $origin ) {
			return $served;
		}
		$allowed_list = explode( ',', $origins_str );
		$allowed = false;
		foreach ( $allowed_list as $allowed_origin ) {
			if ( trim( $allowed_origin ) === $origin ) {
				$allowed = true;
			}
		}
		if ( $allowed ) {
			header( 'Access-Control-Allow-Origin: ' . $origin );
			header( 'Access-Control-Allow-Headers: Authorization, Content-Type' );
			header( 'Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS' );
			header( 'Access-Control-Allow-Credentials: true' );
		}
		return $served;
	}

	public function authenticate_with_jwt( $user_id ) {
		$headers = function_exists( 'getallheaders' ) ? getallheaders() : array();
		$auth_header = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? $headers['Authorization'] ?? $headers['authorization'] ?? '';
		if ( ! $auth_header ) {
			return $user_id;
		}
		$parts = explode( ' ', $auth_header );
		if ( count( $parts ) !== 2 ) {
			return $user_id;
		}
		if ( $parts[0] !== 'Bearer' ) {
			return $user_id;
		}
		$token = $parts[1];
		$secret = get_option( 'headless_auth_jwt_secret_key', '' );
		if ( ! $secret ) {
			return $user_id;
		}
		$token_parts = explode( '.', $token );
		if ( count( $token_parts ) !== 3 ) {
			return $user_id;
		}
		$header_payload = $token_parts[0] . '.' . $token_parts[1];
		$expected_sig = strtr( rtrim( base64_encode( hash_hmac( 'sha256', $header_payload, $secret, true ) ), '=' ), '+/', '-_' );
		if ( ! hash_equals( $expected_sig, $token_parts[2] ) ) {
			return $user_id;
		}
		$payload_json = base64_decode( strtr( $token_parts[1], '-_', '+/' ) );
		$payload = json_decode( $payload_json, true );
		if ( ! $payload ) {
			return $user_id;
		}
		if ( $payload['exp'] < time() ) {
			$_SERVER['HEADLESS_AUTH_JWT_EXPIRED'] = '1';
			return $user_id;
		}
		if ( $payload['iss'] !== site_url() ) {
			return $user_id;
		}
		if ( $payload['type'] !== 'access' ) {
			return $user_id;
		}
		$token_user_id = intval( $payload['sub'] );
		if ( ! $token_user_id || ! get_user_by( 'id', $token_user_id ) ) {
			return $user_id;
		}
		wp_set_current_user( $token_user_id );
		$_SERVER['HEADLESS_AUTH_JWT_AUTHENTICATED'] = '1';
		return $token_user_id;
	}

	public function allow_jwt_auth( $result ) {
		if ( $result ) {
			return $result;
		}
		if ( ($_SERVER['HEADLESS_AUTH_JWT_AUTHENTICATED'] ?? '') === '1' ) {
			return true;
		}
		if ( ! get_current_user_id() && ($_SERVER['HEADLESS_AUTH_JWT_EXPIRED'] ?? '') === '1' ) {
			return new WP_Error( 'token_expired', 'Access token has expired.', array( 'status' => 401 ) );
		}
		return $result;
	}

	public function filter_default_user_role( $default_value ) {
		if ( class_exists( 'WooCommerce' ) ) {
			return 'customer';
		}
		return $default_value;
	}

}
