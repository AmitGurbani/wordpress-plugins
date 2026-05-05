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
		$raw_mov = $config['mov'] ?? null;
		$mov = $raw_mov === null || $raw_mov === '' ? null : absint( $raw_mov );
		$raw_delivery_fee = $config['delivery_fee'] ?? null;
		$delivery_fee = $raw_delivery_fee === null || $raw_delivery_fee === '' ? null : absint( $raw_delivery_fee );
		$raw_delivery_areas = $config['delivery_areas'] ?? array();
		$delivery_areas = is_array( $raw_delivery_areas ) ? array_map( 'sanitize_text_field', $raw_delivery_areas ) : array();
		$raw_owner_name = sanitize_text_field( $config['owner_name'] ?? '' );
		$raw_fssai_license = sanitize_text_field( $config['fssai_license'] ?? '' );
		$raw_estd_line = sanitize_text_field( $config['estd_line'] ?? '' );
		$valid_templates = array( 'kirana', 'megamart', 'bakery', 'quickcommerce', 'ecommerce', 'fooddelivery' );
		$raw_template = sanitize_text_field( $config['template'] ?? '' );
		$template = in_array( $raw_template, $valid_templates, true ) ? $raw_template : null;
		$template_config = $this->public_template_config( $config['template_config'] ?? array() );
		$response = array( 'app_name' => $app_name, 'short_name' => $short_name, 'tagline' => $tagline, 'title_tagline' => sanitize_text_field( $config['title_tagline'] ?? '' ), 'description' => sanitize_textarea_field( $config['description'] ?? '' ), 'contact' => array( 'phone' => $contact_phone, 'phone_href' => $contact_phone_href, 'email' => $contact_email, 'whatsapp' => $whatsapp ), 'social' => $social, 'cities' => $cities, 'trust_signals' => $trust_signals, 'delivery_message' => sanitize_text_field( $config['delivery_message'] ?? 'Delivery in 1–2 business days' ), 'return_policy' => sanitize_textarea_field( $config['return_policy'] ?? 'Easy returns within 7 days of delivery. Items must be unused and in original packaging.' ), 'delivery_badge' => sanitize_text_field( $config['delivery_badge'] ?? '' ), 'hours_text' => sanitize_textarea_field( $config['hours_text'] ?? '' ), 'delivery_area_text' => sanitize_textarea_field( $config['delivery_area_text'] ?? '' ), 'colors' => array( 'primary' => $primary_color, 'secondary' => $secondary_raw ? $secondary_raw : null, 'accent' => $accent_raw ? $accent_raw : null ), 'tokens' => array( 'section_gap' => sanitize_text_field( $tokens['section_gap'] ?? '2rem' ), 'card_padding' => sanitize_text_field( $tokens['card_padding'] ?? '0.75rem' ), 'card_radius' => sanitize_text_field( $tokens['card_radius'] ?? '0.75rem' ), 'button_radius' => sanitize_text_field( $tokens['button_radius'] ?? '0.5rem' ), 'image_radius' => sanitize_text_field( $tokens['image_radius'] ?? '0.5rem' ), 'card_shadow' => sanitize_text_field( $tokens['card_shadow'] ?? 'none' ), 'card_hover_shadow' => sanitize_text_field( $tokens['card_hover_shadow'] ?? '0 4px 12px oklch(0 0 0 / 0.1)' ), 'hover_duration' => sanitize_text_field( $tokens['hover_duration'] ?? '150ms' ) ), 'logo_url' => $raw_logo_url ? $raw_logo_url : null, 'font_family' => sanitize_text_field( $config['font_family'] ?? 'Inter' ), 'fssai_license' => $raw_fssai_license ? $raw_fssai_license : null, 'estd_line' => $raw_estd_line ? $raw_estd_line : null, 'owner_name' => $raw_owner_name ? $raw_owner_name : null, 'mov' => $mov, 'delivery_fee' => $delivery_fee, 'delivery_areas' => $delivery_areas, 'template' => $template, 'template_config' => $template_config );
		$filtered = apply_filters( 'headless_storefront_config_response', $response );
		return rest_ensure_response( $filtered );
	}

	public function get_settings( $request ) {
		$config = get_option( 'headless_storefront_config', array() );
		$last_at = get_option( 'headless_storefront_last_revalidate_at', '' );
		$contact = $config['contact'] ?? array();
		$colors = $config['colors'] ?? array();
		$tokens = $config['tokens'] ?? array();
		return rest_ensure_response( array( 'app_name' => $config['app_name'] ?? '', 'short_name' => $config['short_name'] ?? '', 'tagline' => $config['tagline'] ?? '', 'title_tagline' => $config['title_tagline'] ?? '', 'description' => $config['description'] ?? '', 'logo_url' => $config['logo_url'] ?? '', 'font_family' => $config['font_family'] ?? 'Inter', 'contact' => array( 'phone' => $contact['phone'] ?? '', 'phone_href' => $contact['phone_href'] ?? '', 'email' => $contact['email'] ?? '', 'whatsapp_number' => $contact['whatsapp_number'] ?? '', 'whatsapp_label' => $contact['whatsapp_label'] ?? '' ), 'social' => is_array( $config['social'] ?? array() ) ? $config['social'] : array(), 'cities' => is_array( $config['cities'] ?? array() ) ? $config['cities'] : array(), 'trust_signals' => is_array( $config['trust_signals'] ?? array() ) ? $config['trust_signals'] : array( 'Genuine Products', 'Easy Returns', 'Secure Payment', 'Fast Delivery' ), 'delivery_message' => $config['delivery_message'] ?? 'Delivery in 1–2 business days', 'return_policy' => $config['return_policy'] ?? 'Easy returns within 7 days of delivery. Items must be unused and in original packaging.', 'delivery_badge' => $config['delivery_badge'] ?? '', 'hours_text' => $config['hours_text'] ?? '', 'delivery_area_text' => $config['delivery_area_text'] ?? '', 'colors' => array( 'primary' => $colors['primary'] ?? '#6366f1', 'secondary' => $colors['secondary'] ?? '', 'accent' => $colors['accent'] ?? '' ), 'tokens' => array( 'section_gap' => $tokens['section_gap'] ?? '2rem', 'card_padding' => $tokens['card_padding'] ?? '0.75rem', 'card_radius' => $tokens['card_radius'] ?? '0.75rem', 'button_radius' => $tokens['button_radius'] ?? '0.5rem', 'image_radius' => $tokens['image_radius'] ?? '0.5rem', 'card_shadow' => $tokens['card_shadow'] ?? 'none', 'card_hover_shadow' => $tokens['card_hover_shadow'] ?? '0 4px 12px oklch(0 0 0 / 0.1)', 'hover_duration' => $tokens['hover_duration'] ?? '150ms' ), 'frontend_url' => $config['frontend_url'] ?? '', 'revalidate_secret' => $config['revalidate_secret'] ? '********' : '', 'fssai_license' => $config['fssai_license'] ?? '', 'estd_line' => $config['estd_line'] ?? '', 'owner_name' => $config['owner_name'] ?? '', 'mov' => $config['mov'] ?? '', 'delivery_fee' => $config['delivery_fee'] ?? '', 'delivery_areas' => is_array( $config['delivery_areas'] ?? array() ) ? $config['delivery_areas'] : array(), 'template' => $config['template'] ?? '', 'template_config' => $this->admin_template_config( $config['template_config'] ?? array() ), '_fallbacks' => array( 'app_name' => get_option( 'blogname', '' ), 'tagline' => get_option( 'blogdescription', '' ), 'contact_email' => get_option( 'woocommerce_email_from_address', '' ) ), '_last_revalidate_at' => $last_at ? $last_at : null ) );
	}

	public function save_settings( $request ) {
		$data = $this->preserve_secret_on_mask( $request->get_json_params() );
		$sanitized = $this->sanitize_payload( $data );
		update_option( 'headless_storefront_config', $sanitized );
		return rest_ensure_response( $this->mask_response( $sanitized ) );
	}

	public function patch_settings( $request ) {
		$patch = $this->preserve_secret_on_mask( $request->get_json_params() );
		$existing = get_option( 'headless_storefront_config', array() );
		$merged = $this->merge_patch( $existing, $patch );
		$sanitized = $this->sanitize_payload( $merged );
		update_option( 'headless_storefront_config', $sanitized );
		return rest_ensure_response( $this->mask_response( $sanitized ) );
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
				if ( in_array( $platform, $valid_platforms, true ) ) {
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
		$raw_delivery_areas = $data['delivery_areas'] ?? array();
		$delivery_areas = is_array( $raw_delivery_areas ) ? array_map( 'sanitize_text_field', $raw_delivery_areas ) : array();
		$raw_mov = $data['mov'] ?? '';
		$mov = $raw_mov === '' || $raw_mov === null ? '' : absint( $raw_mov );
		$raw_delivery_fee = $data['delivery_fee'] ?? '';
		$delivery_fee = $raw_delivery_fee === '' || $raw_delivery_fee === null ? '' : absint( $raw_delivery_fee );
		$valid_templates = array( 'kirana', 'megamart', 'bakery', 'quickcommerce', 'ecommerce', 'fooddelivery' );
		$raw_template = sanitize_text_field( $data['template'] ?? '' );
		$template = in_array( $raw_template, $valid_templates, true ) ? $raw_template : '';
		return array( 'app_name' => sanitize_text_field( $data['app_name'] ?? '' ), 'short_name' => sanitize_text_field( $data['short_name'] ?? '' ), 'tagline' => sanitize_text_field( $data['tagline'] ?? '' ), 'title_tagline' => sanitize_text_field( $data['title_tagline'] ?? '' ), 'description' => sanitize_textarea_field( $data['description'] ?? '' ), 'logo_url' => esc_url_raw( $data['logo_url'] ?? '' ), 'font_family' => sanitize_text_field( $data['font_family'] ?? 'Inter' ), 'contact' => $contact, 'social' => $social, 'cities' => $cities, 'trust_signals' => $trust_signals, 'delivery_message' => sanitize_text_field( $data['delivery_message'] ?? '' ), 'return_policy' => sanitize_textarea_field( $data['return_policy'] ?? '' ), 'delivery_badge' => sanitize_text_field( $data['delivery_badge'] ?? '' ), 'hours_text' => sanitize_textarea_field( $data['hours_text'] ?? '' ), 'delivery_area_text' => sanitize_textarea_field( $data['delivery_area_text'] ?? '' ), 'colors' => $colors, 'tokens' => $tokens, 'frontend_url' => esc_url_raw( $data['frontend_url'] ?? '' ), 'revalidate_secret' => sanitize_text_field( $data['revalidate_secret'] ?? '' ), 'fssai_license' => sanitize_text_field( $data['fssai_license'] ?? '' ), 'estd_line' => sanitize_text_field( $data['estd_line'] ?? '' ), 'owner_name' => sanitize_text_field( $data['owner_name'] ?? '' ), 'mov' => $mov, 'delivery_fee' => $delivery_fee, 'delivery_areas' => $delivery_areas, 'template' => $template, 'template_config' => $this->sanitize_template_config( $data['template_config'] ?? array() ) );
	}

	public function sanitize_template_config( $input ) {
		$tc = $input ?? array();
		$bakery_in = $tc['bakery'] ?? array();
		$occasions_in = $bakery_in['occasions'] ?? array();
		$occasions = array();
		if ( is_array( $occasions_in ) ) {
			foreach ( $occasions_in as $o ) {
				$id = sanitize_text_field( $o['id'] ?? '' );
				$label = sanitize_text_field( $o['label'] ?? '' );
				if ( $id && $label ) {
					array_push( $occasions, array( 'id' => $id, 'label' => $label ) );
				}
			}
		}
		$bakery = array( 'occasions' => $occasions, 'eggless_default' => rest_sanitize_boolean( $bakery_in['eggless_default'] ?? false ) );
		$qc_in = $tc['quickcommerce'] ?? array();
		$eta_in = $qc_in['eta_band_minutes'] ?? array();
		$quickcommerce = array( 'eta_band_minutes' => array( 'min' => absint( $eta_in['min'] ?? 0 ), 'max' => absint( $eta_in['max'] ?? 0 ) ), 'cod_enabled' => rest_sanitize_boolean( $qc_in['cod_enabled'] ?? false ) );
		$fd_in = $tc['fooddelivery'] ?? array();
		$fooddelivery = array( 'veg_only' => rest_sanitize_boolean( $fd_in['veg_only'] ?? false ), 'jain_filter_enabled' => rest_sanitize_boolean( $fd_in['jain_filter_enabled'] ?? false ) );
		$ec_in = $tc['ecommerce'] ?? array();
		$ecommerce = array( 'returns_window_days' => absint( $ec_in['returns_window_days'] ?? 0 ), 'exchange_enabled' => rest_sanitize_boolean( $ec_in['exchange_enabled'] ?? false ) );
		return array( 'bakery' => $bakery, 'quickcommerce' => $quickcommerce, 'fooddelivery' => $fooddelivery, 'ecommerce' => $ecommerce );
	}

	public function public_template_config( $input ) {
		$tc = $input ?? array();
		$out = array();
		$bakery_in = $tc['bakery'] ?? array();
		$occasions_in = $bakery_in['occasions'] ?? array();
		$occasions = array();
		if ( is_array( $occasions_in ) ) {
			foreach ( $occasions_in as $o ) {
				$id = sanitize_text_field( $o['id'] ?? '' );
				$label = sanitize_text_field( $o['label'] ?? '' );
				if ( $id && $label ) {
					array_push( $occasions, array( 'id' => $id, 'label' => $label ) );
				}
			}
		}
		$eggless_default = rest_sanitize_boolean( $bakery_in['eggless_default'] ?? false );
		if ( ! empty( $occasions ) || $eggless_default ) {
			$out['bakery'] = array( 'occasions' => $occasions, 'eggless_default' => $eggless_default );
		}
		$qc_in = $tc['quickcommerce'] ?? array();
		$eta_in = $qc_in['eta_band_minutes'] ?? array();
		$eta_min = absint( $eta_in['min'] ?? 0 );
		$eta_max = absint( $eta_in['max'] ?? 0 );
		$cod_enabled = rest_sanitize_boolean( $qc_in['cod_enabled'] ?? false );
		if ( $eta_min || $eta_max || $cod_enabled ) {
			$out['quickcommerce'] = array( 'eta_band_minutes' => array( 'min' => $eta_min, 'max' => $eta_max ), 'cod_enabled' => $cod_enabled );
		}
		$fd_in = $tc['fooddelivery'] ?? array();
		$veg_only = rest_sanitize_boolean( $fd_in['veg_only'] ?? false );
		$jain_enabled = rest_sanitize_boolean( $fd_in['jain_filter_enabled'] ?? false );
		if ( $veg_only || $jain_enabled ) {
			$out['fooddelivery'] = array( 'veg_only' => $veg_only, 'jain_filter_enabled' => $jain_enabled );
		}
		$ec_in = $tc['ecommerce'] ?? array();
		$returns_window = absint( $ec_in['returns_window_days'] ?? 0 );
		$exchange_enabled = rest_sanitize_boolean( $ec_in['exchange_enabled'] ?? false );
		if ( $returns_window || $exchange_enabled ) {
			$out['ecommerce'] = array( 'returns_window_days' => $returns_window, 'exchange_enabled' => $exchange_enabled );
		}
		return $out;
	}

	public function admin_template_config( $input ) {
		$tc = $input ?? array();
		$bakery_in = $tc['bakery'] ?? array();
		$occasions_in = $bakery_in['occasions'] ?? array();
		$occasions = is_array( $occasions_in ) ? $occasions_in : array();
		$qc_in = $tc['quickcommerce'] ?? array();
		$eta_in = $qc_in['eta_band_minutes'] ?? array();
		$fd_in = $tc['fooddelivery'] ?? array();
		$ec_in = $tc['ecommerce'] ?? array();
		return array( 'bakery' => array( 'occasions' => $occasions, 'eggless_default' => ! ! ($bakery_in['eggless_default'] ?? false) ), 'quickcommerce' => array( 'eta_band_minutes' => array( 'min' => $eta_in['min'] ?? 0, 'max' => $eta_in['max'] ?? 0 ), 'cod_enabled' => ! ! ($qc_in['cod_enabled'] ?? false) ), 'fooddelivery' => array( 'veg_only' => ! ! ($fd_in['veg_only'] ?? false), 'jain_filter_enabled' => ! ! ($fd_in['jain_filter_enabled'] ?? false) ), 'ecommerce' => array( 'returns_window_days' => $ec_in['returns_window_days'] ?? 0, 'exchange_enabled' => ! ! ($ec_in['exchange_enabled'] ?? false) ) );
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
		$result['fssai_license'] = isset( $patch['fssai_license'] ) ? $patch['fssai_license'] : ($base['fssai_license'] ?? '');
		$result['estd_line'] = isset( $patch['estd_line'] ) ? $patch['estd_line'] : ($base['estd_line'] ?? '');
		$result['owner_name'] = isset( $patch['owner_name'] ) ? $patch['owner_name'] : ($base['owner_name'] ?? '');
		$result['mov'] = isset( $patch['mov'] ) ? $patch['mov'] : ($base['mov'] ?? '');
		$result['delivery_fee'] = isset( $patch['delivery_fee'] ) ? $patch['delivery_fee'] : ($base['delivery_fee'] ?? '');
		$result['template'] = isset( $patch['template'] ) ? $patch['template'] : ($base['template'] ?? '');
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
		$result['delivery_areas'] = isset( $patch['delivery_areas'] ) ? $patch['delivery_areas'] : ($base['delivery_areas'] ?? array());
		if ( isset( $patch['template_config'] ) ) {
			$result['template_config'] = $this->merge_template_config( $base['template_config'] ?? array(), $patch['template_config'] );
		} else {
			$result['template_config'] = $base['template_config'] ?? array();
		}
		return $result;
	}

	public function merge_template_config( $base_tc, $patch_tc ) {
		if ( $patch_tc === null ) {
			return $base_tc;
		}
		$result = array( 'bakery' => $base_tc['bakery'] ?? array(), 'quickcommerce' => $base_tc['quickcommerce'] ?? array(), 'fooddelivery' => $base_tc['fooddelivery'] ?? array(), 'ecommerce' => $base_tc['ecommerce'] ?? array() );
		if ( isset( $patch_tc['bakery'] ) ) {
			$pb = $patch_tc['bakery'];
			$bb = $result['bakery'];
			$result['bakery'] = array( 'occasions' => isset( $pb['occasions'] ) ? $pb['occasions'] : ($bb['occasions'] ?? array()), 'eggless_default' => isset( $pb['eggless_default'] ) ? $pb['eggless_default'] : ($bb['eggless_default'] ?? false) );
		}
		if ( isset( $patch_tc['quickcommerce'] ) ) {
			$pq = $patch_tc['quickcommerce'];
			$bq = $result['quickcommerce'];
			$base_eta = $bq['eta_band_minutes'] ?? array();
			$merged_eta = $base_eta;
			if ( isset( $pq['eta_band_minutes'] ) ) {
				$pe = $pq['eta_band_minutes'];
				$merged_eta = array( 'min' => isset( $pe['min'] ) ? $pe['min'] : ($base_eta['min'] ?? 0), 'max' => isset( $pe['max'] ) ? $pe['max'] : ($base_eta['max'] ?? 0) );
			}
			$result['quickcommerce'] = array( 'eta_band_minutes' => $merged_eta, 'cod_enabled' => isset( $pq['cod_enabled'] ) ? $pq['cod_enabled'] : ($bq['cod_enabled'] ?? false) );
		}
		if ( isset( $patch_tc['fooddelivery'] ) ) {
			$pf = $patch_tc['fooddelivery'];
			$bf = $result['fooddelivery'];
			$result['fooddelivery'] = array( 'veg_only' => isset( $pf['veg_only'] ) ? $pf['veg_only'] : ($bf['veg_only'] ?? false), 'jain_filter_enabled' => isset( $pf['jain_filter_enabled'] ) ? $pf['jain_filter_enabled'] : ($bf['jain_filter_enabled'] ?? false) );
		}
		if ( isset( $patch_tc['ecommerce'] ) ) {
			$pe = $patch_tc['ecommerce'];
			$be = $result['ecommerce'];
			$result['ecommerce'] = array( 'returns_window_days' => isset( $pe['returns_window_days'] ) ? $pe['returns_window_days'] : ($be['returns_window_days'] ?? 0), 'exchange_enabled' => isset( $pe['exchange_enabled'] ) ? $pe['exchange_enabled'] : ($be['exchange_enabled'] ?? false) );
		}
		return $result;
	}

	public function preserve_secret_on_mask( $data ) {
		if ( $data['revalidate_secret'] === '********' ) {
			$existing = get_option( 'headless_storefront_config', array() );
			$data['revalidate_secret'] = $existing['revalidate_secret'] ?? '';
		}
		return $data;
	}

	public function mask_response( $config ) {
		return array_merge( $config, array( 'revalidate_secret' => $config['revalidate_secret'] ? '********' : '' ) );
	}

}
