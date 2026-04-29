<?php

if ( ! defined( 'WPINC' ) ) {
	die;
}

class Headless_Storefront_Rest_Api {

	private $namespace;

	public function __construct( $plugin_slug ) {
		$this->namespace = $plugin_slug . '/v1';
	}

	public function register_routes() {
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
			'/settings',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'get_settings' ),
				'permission_callback' => function() {
					return current_user_can( 'manage_options' );
				},
			)
		);
		register_rest_route(
			$this->namespace,
			'/settings',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'save_settings' ),
				'permission_callback' => function() {
					return current_user_can( 'manage_options' );
				},
			)
		);
		register_rest_route(
			$this->namespace,
			'/settings',
			array(
				'methods'             => 'PATCH',
				'callback'            => array( $this, 'patch_settings' ),
				'permission_callback' => function() {
					return current_user_can( 'manage_options' );
				},
			)
		);
		register_rest_route(
			$this->namespace,
			'/admin/revalidate',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'manual_revalidate' ),
				'permission_callback' => function() {
					return current_user_can( 'manage_options' );
				},
			)
		);
		register_rest_route(
			$this->namespace,
			'/diagnostics/test-revalidate',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'test_revalidate' ),
				'permission_callback' => function() {
					return current_user_can( 'manage_options' );
				},
			)
		);
	}


	public function get_config( $request ) {
		$config = get_option( 'headless_storefront_config', array() );
		$contact = $config['contact'] ?? array();
		$contact_phone = sanitize_text_field( $contact['phone'] ?? '' );
		$contact_phone_href = sanitize_text_field( $contact['phone_href'] ?? '' );
		$raw_email = sanitize_text_field( $contact['email'] ?? '' );
		$contact_email = $raw_email ? $raw_email : sanitize_text_field( get_option( 'woocommerce_email_from_address', '' ) );
		$whatsapp_number = sanitize_text_field( $contact['whatsapp_number'] ?? '' );
		$whatsapp_label = sanitize_text_field( $contact['whatsapp_label'] ?? '' );
		$whatsapp = $whatsapp_number || $whatsapp_label ? array( 'number' => $whatsapp_number, 'label' => $whatsapp_label ) : null;
		$raw_social = $config['social'] ?? array();
		$social = array();
		if ( is_array( $raw_social ) ) {
			foreach ( $raw_social as $item ) {
				if ( $item['platform'] && $item['href'] && $item['label'] ) {
					array_push( $social, array( 'platform' => sanitize_text_field( $item['platform'] ), 'href' => esc_url( $item['href'] ), 'label' => sanitize_text_field( $item['label'] ) ) );
				}
			}
		}
		$colors = $config['colors'] ?? array();
		$primary_color = sanitize_text_field( $colors['primary'] ?? '#6366f1' );
		$secondary_raw = sanitize_text_field( $colors['secondary'] ?? '' );
		$accent_raw = sanitize_text_field( $colors['accent'] ?? '' );
		$tokens = $config['tokens'] ?? array();
		$raw_app_name = sanitize_text_field( $config['app_name'] ?? '' );
		$app_name = $raw_app_name ? $raw_app_name : sanitize_text_field( get_option( 'blogname', '' ) );
		$raw_short_name = sanitize_text_field( $config['short_name'] ?? '' );
		$short_name = $raw_short_name ? $raw_short_name : $app_name;
		$raw_tagline = sanitize_text_field( $config['tagline'] ?? '' );
		$tagline = $raw_tagline ? $raw_tagline : sanitize_text_field( get_option( 'blogdescription', '' ) );
		$raw_trust_signals = $config['trust_signals'] ?? array();
		$default_trust_signals = array( 'Genuine Products', 'Easy Returns', 'Secure Payment', 'Fast Delivery' );
		$trust_signals = is_array( $raw_trust_signals ) && ! empty( $raw_trust_signals ) ? array_map( 'sanitize_text_field', $raw_trust_signals ) : $default_trust_signals;
		$raw_cities = $config['cities'] ?? array();
		$cities = is_array( $raw_cities ) ? array_map( 'sanitize_text_field', $raw_cities ) : array();
		$raw_logo_url = esc_url( $config['logo_url'] ?? '' );
		return rest_ensure_response( array( 'app_name' => $app_name, 'short_name' => $short_name, 'tagline' => $tagline, 'title_tagline' => sanitize_text_field( $config['title_tagline'] ?? '' ), 'description' => sanitize_textarea_field( $config['description'] ?? '' ), 'contact' => array( 'phone' => $contact_phone, 'phone_href' => $contact_phone_href, 'email' => $contact_email, 'whatsapp' => $whatsapp ), 'social' => $social, 'cities' => $cities, 'trust_signals' => $trust_signals, 'delivery_message' => sanitize_text_field( $config['delivery_message'] ?? 'Delivery in 1–2 business days' ), 'return_policy' => sanitize_textarea_field( $config['return_policy'] ?? 'Easy returns within 7 days of delivery. Items must be unused and in original packaging.' ), 'delivery_badge' => sanitize_text_field( $config['delivery_badge'] ?? '' ), 'hours_text' => sanitize_textarea_field( $config['hours_text'] ?? '' ), 'delivery_area_text' => sanitize_textarea_field( $config['delivery_area_text'] ?? '' ), 'colors' => array( 'primary' => $primary_color, 'secondary' => $secondary_raw ? $secondary_raw : null, 'accent' => $accent_raw ? $accent_raw : null ), 'tokens' => array( 'section_gap' => sanitize_text_field( $tokens['section_gap'] ?? '2rem' ), 'card_padding' => sanitize_text_field( $tokens['card_padding'] ?? '0.75rem' ), 'card_radius' => sanitize_text_field( $tokens['card_radius'] ?? '0.75rem' ), 'button_radius' => sanitize_text_field( $tokens['button_radius'] ?? '0.5rem' ), 'image_radius' => sanitize_text_field( $tokens['image_radius'] ?? '0.5rem' ), 'card_shadow' => sanitize_text_field( $tokens['card_shadow'] ?? 'none' ), 'card_hover_shadow' => sanitize_text_field( $tokens['card_hover_shadow'] ?? '0 4px 12px oklch(0 0 0 / 0.1)' ), 'hover_duration' => sanitize_text_field( $tokens['hover_duration'] ?? '150ms' ) ), 'logo_url' => $raw_logo_url ? $raw_logo_url : null, 'font_family' => sanitize_text_field( $config['font_family'] ?? 'Inter' ) ) );
	}

	public function get_settings( $request ) {
		$config = get_option( 'headless_storefront_config', array() );
		$contact = $config['contact'] ?? array();
		$colors = $config['colors'] ?? array();
		$tokens = $config['tokens'] ?? array();
		return rest_ensure_response( array( 'app_name' => $config['app_name'] ?? '', 'short_name' => $config['short_name'] ?? '', 'tagline' => $config['tagline'] ?? '', 'title_tagline' => $config['title_tagline'] ?? '', 'description' => $config['description'] ?? '', 'logo_url' => $config['logo_url'] ?? '', 'font_family' => $config['font_family'] ?? 'Inter', 'contact' => array( 'phone' => $contact['phone'] ?? '', 'phone_href' => $contact['phone_href'] ?? '', 'email' => $contact['email'] ?? '', 'whatsapp_number' => $contact['whatsapp_number'] ?? '', 'whatsapp_label' => $contact['whatsapp_label'] ?? '' ), 'social' => is_array( $config['social'] ?? array() ) ? $config['social'] : array(), 'cities' => is_array( $config['cities'] ?? array() ) ? $config['cities'] : array(), 'trust_signals' => is_array( $config['trust_signals'] ?? array() ) ? $config['trust_signals'] : array( 'Genuine Products', 'Easy Returns', 'Secure Payment', 'Fast Delivery' ), 'delivery_message' => $config['delivery_message'] ?? 'Delivery in 1–2 business days', 'return_policy' => $config['return_policy'] ?? 'Easy returns within 7 days of delivery. Items must be unused and in original packaging.', 'delivery_badge' => $config['delivery_badge'] ?? '', 'hours_text' => $config['hours_text'] ?? '', 'delivery_area_text' => $config['delivery_area_text'] ?? '', 'colors' => array( 'primary' => $colors['primary'] ?? '#6366f1', 'secondary' => $colors['secondary'] ?? '', 'accent' => $colors['accent'] ?? '' ), 'tokens' => array( 'section_gap' => $tokens['section_gap'] ?? '2rem', 'card_padding' => $tokens['card_padding'] ?? '0.75rem', 'card_radius' => $tokens['card_radius'] ?? '0.75rem', 'button_radius' => $tokens['button_radius'] ?? '0.5rem', 'image_radius' => $tokens['image_radius'] ?? '0.5rem', 'card_shadow' => $tokens['card_shadow'] ?? 'none', 'card_hover_shadow' => $tokens['card_hover_shadow'] ?? '0 4px 12px oklch(0 0 0 / 0.1)', 'hover_duration' => $tokens['hover_duration'] ?? '150ms' ), 'frontend_url' => $config['frontend_url'] ?? '', 'revalidate_secret' => $config['revalidate_secret'] ?? '', '_fallbacks' => array( 'app_name' => get_option( 'blogname', '' ), 'tagline' => get_option( 'blogdescription', '' ), 'contact_email' => get_option( 'woocommerce_email_from_address', '' ) ), '_last_revalidate_at' => get_option( 'headless_storefront_last_revalidate_at', '' ) ? get_option( 'headless_storefront_last_revalidate_at', '' ) : null ) );
	}

	public function save_settings( $request ) {
		$sanitized = $this->sanitize_payload( $request->get_json_params() );
		update_option( 'headless_storefront_config', $sanitized );
		return rest_ensure_response( $sanitized );
	}

	public function patch_settings( $request ) {
		$patch = $request->get_json_params();
		$existing = get_option( 'headless_storefront_config', array() );
		$merged = $this->merge_patch( $existing, $patch );
		$sanitized = $this->sanitize_payload( $merged );
		update_option( 'headless_storefront_config', $sanitized );
		return rest_ensure_response( $sanitized );
	}

	public function manual_revalidate( $request ) {
		$dispatched = $this->dispatch_revalidate();
		return rest_ensure_response( array( 'dispatched' => $dispatched ) );
	}

	public function test_revalidate( $request ) {
		$config = get_option( 'headless_storefront_config', array() );
		$frontend_url = $config['frontend_url'] ?? '';
		$secret = $config['revalidate_secret'] ?? '';
		if ( ! $frontend_url || ! $secret ) {
			return rest_ensure_response( array( 'success' => false, 'code' => 'not_configured', 'message' => 'Frontend URL or Revalidate Secret is empty.', 'http_code' => null ) );
		}
		$response = wp_safe_remote_post( $frontend_url . '/api/revalidate', array( 'body' => wp_json_encode( array( 'type' => 'storefront' ) ), 'headers' => array( 'Content-Type' => 'application/json', 'x-revalidate-secret' => $secret ), 'timeout' => 10 ) );
		if ( is_wp_error( $response ) ) {
			return rest_ensure_response( array( 'success' => false, 'code' => 'connection_failed', 'message' => $response->get_error_message(), 'http_code' => null ) );
		}
		$http_code = intval( wp_remote_retrieve_response_code( $response ) );
		if ( $http_code >= 200 && $http_code < 300 ) {
			return rest_ensure_response( array( 'success' => true, 'code' => 'ok', 'message' => 'Webhook configured correctly.', 'http_code' => $http_code ) );
		}
		$hint = 'Unexpected response from frontend.';
		if ( $http_code === 401 || $http_code === 403 ) {
			$hint = 'Secret doesn\'t match.';
		} elseif ( $http_code === 404 ) {
			$hint = 'Check Frontend URL path — /api/revalidate not found.';
		} elseif ( $http_code >= 500 ) {
			$hint = 'Frontend returned an error.';
		}
		return rest_ensure_response( array( 'success' => false, 'code' => 'http_error', 'message' => $hint, 'http_code' => $http_code ) );
	}

	public function dispatch_revalidate(  ) {
		if ( defined( 'WP_CLI' ) && WP_CLI ) {
			return false;
		}
		$config = get_option( 'headless_storefront_config', array() );
		$frontend_url = $config['frontend_url'] ?? '';
		$secret = $config['revalidate_secret'] ?? '';
		if ( ! $frontend_url || ! $secret ) {
			return false;
		}
		update_option( 'headless_storefront_last_revalidate_at', gmdate( 'c', time() ) );
		wp_safe_remote_post( $frontend_url . '/api/revalidate', array( 'body' => wp_json_encode( array( 'type' => 'storefront' ) ), 'headers' => array( 'Content-Type' => 'application/json', 'x-revalidate-secret' => $secret ), 'blocking' => false, 'timeout' => 5 ) );
		if ( defined( 'WP_DEBUG_LOG' ) && WP_DEBUG_LOG ) {
			error_log( '[headless-storefront] revalidate dispatched to ' . $frontend_url . '/api/revalidate' );
		}
		return true;
	}

	public function sanitize_payload( $data ) {
		$raw_contact = $data['contact'] ?? array();
		$contact = array( 'phone' => sanitize_text_field( $raw_contact['phone'] ?? '' ), 'phone_href' => sanitize_text_field( $raw_contact['phone_href'] ?? '' ), 'email' => sanitize_email( $raw_contact['email'] ?? '' ), 'whatsapp_number' => sanitize_text_field( $raw_contact['whatsapp_number'] ?? '' ), 'whatsapp_label' => sanitize_text_field( $raw_contact['whatsapp_label'] ?? '' ) );
		$raw_social = $data['social'] ?? array();
		$valid_platforms = array( 'instagram', 'facebook', 'twitter', 'youtube', 'linkedin' );
		$social = array();
		if ( is_array( $raw_social ) ) {
			foreach ( $raw_social as $item ) {
				$platform = sanitize_text_field( $item['platform'] ?? '' );
				if ( in_array( $platform, $valid_platforms ) ) {
					array_push( $social, array( 'platform' => $platform, 'href' => esc_url_raw( $item['href'] ?? '' ), 'label' => sanitize_text_field( $item['label'] ?? '' ) ) );
				}
			}
		}
		$raw_colors = $data['colors'] ?? array();
		$colors = array( 'primary' => sanitize_hex_color( $raw_colors['primary'] ?? '#6366f1' ) ?? '#6366f1', 'secondary' => sanitize_hex_color( $raw_colors['secondary'] ?? '' ) ?? '', 'accent' => sanitize_hex_color( $raw_colors['accent'] ?? '' ) ?? '' );
		$raw_tokens = $data['tokens'] ?? array();
		$tokens = array( 'section_gap' => sanitize_text_field( $raw_tokens['section_gap'] ?? '2rem' ), 'card_padding' => sanitize_text_field( $raw_tokens['card_padding'] ?? '0.75rem' ), 'card_radius' => sanitize_text_field( $raw_tokens['card_radius'] ?? '0.75rem' ), 'button_radius' => sanitize_text_field( $raw_tokens['button_radius'] ?? '0.5rem' ), 'image_radius' => sanitize_text_field( $raw_tokens['image_radius'] ?? '0.5rem' ), 'card_shadow' => sanitize_text_field( $raw_tokens['card_shadow'] ?? 'none' ), 'card_hover_shadow' => sanitize_text_field( $raw_tokens['card_hover_shadow'] ?? '0 4px 12px oklch(0 0 0 / 0.1)' ), 'hover_duration' => sanitize_text_field( $raw_tokens['hover_duration'] ?? '150ms' ) );
		$raw_cities = $data['cities'] ?? array();
		$cities = is_array( $raw_cities ) ? array_map( 'sanitize_text_field', $raw_cities ) : array();
		$raw_trust_signals = $data['trust_signals'] ?? array();
		$trust_signals = is_array( $raw_trust_signals ) ? array_map( 'sanitize_text_field', $raw_trust_signals ) : array();
		return array( 'app_name' => sanitize_text_field( $data['app_name'] ?? '' ), 'short_name' => sanitize_text_field( $data['short_name'] ?? '' ), 'tagline' => sanitize_text_field( $data['tagline'] ?? '' ), 'title_tagline' => sanitize_text_field( $data['title_tagline'] ?? '' ), 'description' => sanitize_textarea_field( $data['description'] ?? '' ), 'logo_url' => esc_url_raw( $data['logo_url'] ?? '' ), 'font_family' => sanitize_text_field( $data['font_family'] ?? 'Inter' ), 'contact' => $contact, 'social' => $social, 'cities' => $cities, 'trust_signals' => $trust_signals, 'delivery_message' => sanitize_text_field( $data['delivery_message'] ?? '' ), 'return_policy' => sanitize_textarea_field( $data['return_policy'] ?? '' ), 'delivery_badge' => sanitize_text_field( $data['delivery_badge'] ?? '' ), 'hours_text' => sanitize_textarea_field( $data['hours_text'] ?? '' ), 'delivery_area_text' => sanitize_textarea_field( $data['delivery_area_text'] ?? '' ), 'colors' => $colors, 'tokens' => $tokens, 'frontend_url' => esc_url_raw( $data['frontend_url'] ?? '' ), 'revalidate_secret' => sanitize_text_field( $data['revalidate_secret'] ?? '' ) );
	}

	public function merge_patch( $existing, $patch ) {
		$base = $existing ? $existing : array();
		$result = array();
		$result['app_name'] = isset( $patch['app_name'] ) ? $patch['app_name'] : ($base['app_name'] ?? '');
		$result['short_name'] = isset( $patch['short_name'] ) ? $patch['short_name'] : ($base['short_name'] ?? '');
		$result['tagline'] = isset( $patch['tagline'] ) ? $patch['tagline'] : ($base['tagline'] ?? '');
		$result['title_tagline'] = isset( $patch['title_tagline'] ) ? $patch['title_tagline'] : ($base['title_tagline'] ?? '');
		$result['description'] = isset( $patch['description'] ) ? $patch['description'] : ($base['description'] ?? '');
		$result['logo_url'] = isset( $patch['logo_url'] ) ? $patch['logo_url'] : ($base['logo_url'] ?? '');
		$result['font_family'] = isset( $patch['font_family'] ) ? $patch['font_family'] : ($base['font_family'] ?? 'Inter');
		$result['delivery_message'] = isset( $patch['delivery_message'] ) ? $patch['delivery_message'] : ($base['delivery_message'] ?? '');
		$result['return_policy'] = isset( $patch['return_policy'] ) ? $patch['return_policy'] : ($base['return_policy'] ?? '');
		$result['delivery_badge'] = isset( $patch['delivery_badge'] ) ? $patch['delivery_badge'] : ($base['delivery_badge'] ?? '');
		$result['hours_text'] = isset( $patch['hours_text'] ) ? $patch['hours_text'] : ($base['hours_text'] ?? '');
		$result['delivery_area_text'] = isset( $patch['delivery_area_text'] ) ? $patch['delivery_area_text'] : ($base['delivery_area_text'] ?? '');
		$result['frontend_url'] = isset( $patch['frontend_url'] ) ? $patch['frontend_url'] : ($base['frontend_url'] ?? '');
		$result['revalidate_secret'] = isset( $patch['revalidate_secret'] ) ? $patch['revalidate_secret'] : ($base['revalidate_secret'] ?? '');
		$base_contact = $base['contact'] ?? array();
		if ( isset( $patch['contact'] ) ) {
			$pc = $patch['contact'];
			$result['contact'] = array( 'phone' => isset( $pc['phone'] ) ? $pc['phone'] : ($base_contact['phone'] ?? ''), 'phone_href' => isset( $pc['phone_href'] ) ? $pc['phone_href'] : ($base_contact['phone_href'] ?? ''), 'email' => isset( $pc['email'] ) ? $pc['email'] : ($base_contact['email'] ?? ''), 'whatsapp_number' => isset( $pc['whatsapp_number'] ) ? $pc['whatsapp_number'] : ($base_contact['whatsapp_number'] ?? ''), 'whatsapp_label' => isset( $pc['whatsapp_label'] ) ? $pc['whatsapp_label'] : ($base_contact['whatsapp_label'] ?? '') );
		} else {
			$result['contact'] = $base_contact;
		}
		$base_colors = $base['colors'] ?? array();
		if ( isset( $patch['colors'] ) ) {
			$pc = $patch['colors'];
			$result['colors'] = array( 'primary' => isset( $pc['primary'] ) ? $pc['primary'] : ($base_colors['primary'] ?? '#6366f1'), 'secondary' => isset( $pc['secondary'] ) ? $pc['secondary'] : ($base_colors['secondary'] ?? ''), 'accent' => isset( $pc['accent'] ) ? $pc['accent'] : ($base_colors['accent'] ?? '') );
		} else {
			$result['colors'] = $base_colors;
		}
		$base_tokens = $base['tokens'] ?? array();
		if ( isset( $patch['tokens'] ) ) {
			$pt = $patch['tokens'];
			$result['tokens'] = array( 'section_gap' => isset( $pt['section_gap'] ) ? $pt['section_gap'] : ($base_tokens['section_gap'] ?? '2rem'), 'card_padding' => isset( $pt['card_padding'] ) ? $pt['card_padding'] : ($base_tokens['card_padding'] ?? '0.75rem'), 'card_radius' => isset( $pt['card_radius'] ) ? $pt['card_radius'] : ($base_tokens['card_radius'] ?? '0.75rem'), 'button_radius' => isset( $pt['button_radius'] ) ? $pt['button_radius'] : ($base_tokens['button_radius'] ?? '0.5rem'), 'image_radius' => isset( $pt['image_radius'] ) ? $pt['image_radius'] : ($base_tokens['image_radius'] ?? '0.5rem'), 'card_shadow' => isset( $pt['card_shadow'] ) ? $pt['card_shadow'] : ($base_tokens['card_shadow'] ?? 'none'), 'card_hover_shadow' => isset( $pt['card_hover_shadow'] ) ? $pt['card_hover_shadow'] : ($base_tokens['card_hover_shadow'] ?? '0 4px 12px oklch(0 0 0 / 0.1)'), 'hover_duration' => isset( $pt['hover_duration'] ) ? $pt['hover_duration'] : ($base_tokens['hover_duration'] ?? '150ms') );
		} else {
			$result['tokens'] = $base_tokens;
		}
		$result['social'] = isset( $patch['social'] ) ? $patch['social'] : ($base['social'] ?? array());
		$result['cities'] = isset( $patch['cities'] ) ? $patch['cities'] : ($base['cities'] ?? array());
		$result['trust_signals'] = isset( $patch['trust_signals'] ) ? $patch['trust_signals'] : ($base['trust_signals'] ?? array());
		return $result;
	}

}
