<?php

if ( ! defined( 'WPINC' ) ) {
	die;
}

class Headless_Storefront_Activator {

	public static function activate() {
		add_option( 'headless_storefront_config', array( 'colors' => array( 'primary' => '#6366f1', 'secondary' => '#64748b', 'accent' => '#94a3b8' ), 'font_family' => 'Inter', 'tokens' => array( 'section_gap' => '2rem', 'card_padding' => '0.75rem', 'card_radius' => '0.75rem', 'button_radius' => '0.5rem', 'image_radius' => '0.5rem', 'card_shadow' => 'none', 'card_hover_shadow' => '0 4px 12px oklch(0 0 0 / 0.1)', 'hover_duration' => '150ms' ) ) );
		add_option( 'headless_storefront_last_revalidate_at', '' );
	}
}
