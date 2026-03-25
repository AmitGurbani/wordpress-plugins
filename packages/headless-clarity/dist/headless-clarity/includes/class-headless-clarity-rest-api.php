<?php

if ( ! defined( 'WPINC' ) ) {
	die;
}

class Headless_Clarity_Rest_Api {

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
			'project_id' => get_option( 'headless_clarity_project_id', '' ),
						'enable_identify' => (bool) get_option( 'headless_clarity_enable_identify', true ),
		);

		return rest_ensure_response( $settings );
	}

	public function update_settings( $request ) {
		$params = $request->get_json_params();

		if ( isset( $params['project_id'] ) ) {
			$value = sanitize_text_field( $params['project_id'] );
			if ( null === $value ) {
				return new \WP_Error(
					'invalid_project_id',
					'Invalid value for project_id.',
					array( 'status' => 400 )
				);
			}
			update_option( 'headless_clarity_project_id', $value );
		}
		if ( isset( $params['enable_identify'] ) ) {
			$value = rest_sanitize_boolean( $params['enable_identify'] );
			if ( null === $value ) {
				return new \WP_Error(
					'invalid_enable_identify',
					'Invalid value for enable_identify.',
					array( 'status' => 400 )
				);
			}
			update_option( 'headless_clarity_enable_identify', $value );
		}

		return rest_ensure_response( array( 'success' => true ) );
	}

	public function get_config( $request ) {
		$project_id = get_option( 'headless_clarity_project_id', '' );
		$response = array( 'project_id' => $project_id );
		$enable_identify = get_option( 'headless_clarity_enable_identify', '1' );
		if ( $enable_identify === '1' ) {
			$user_id = get_current_user_id();
			if ( $user_id > 0 ) {
				$response['user'] = array( 'id' => strval( $user_id ), 'display_name' => get_the_author_meta( 'display_name', $user_id ) );
			}
		}
		return $response;
	}

	public function get_last_error( $request ) {
		return array( 'last_error' => get_option( 'headless_clarity_last_error', '' ) );
	}

}
