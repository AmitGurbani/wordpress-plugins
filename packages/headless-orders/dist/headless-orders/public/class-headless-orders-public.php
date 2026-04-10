<?php

if ( ! defined( 'WPINC' ) ) {
	die;
}

class Headless_Orders_Public {

	private $plugin_name;
	private $version;

	public function __construct( $plugin_name, $version ) {
		$this->plugin_name = $plugin_name;
		$this->version     = $version;
	}

}
