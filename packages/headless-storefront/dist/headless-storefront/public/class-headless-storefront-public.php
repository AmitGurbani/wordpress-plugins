<?php

if ( ! defined( 'WPINC' ) ) {
	die;
}

class Headless_Storefront_Public {

	private $plugin_name;
	private $version;

	public function __construct( $plugin_name, $version ) {
		$this->plugin_name = $plugin_name;
		$this->version     = $version;
	}

	public function on_config_update( $old_value ) {
		$this->dispatch_revalidate();
	}

	public function on_blog_name_update( $old_value ) {
		$this->dispatch_revalidate();
	}

	public function on_blog_description_update( $old_value ) {
		$this->dispatch_revalidate();
	}

	public function on_woo_email_update( $old_value ) {
		$this->dispatch_revalidate();
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

}
