<?php

if ( ! defined( 'WPINC' ) ) {
	die;
}

class Headless_Pos_Sessions_Deactivator {

	public static function deactivate() {
		wp_clear_scheduled_hook( 'headless_pos_sessions_daily_cleanup' );
		wp_clear_scheduled_hook( 'headless_pos_sessions_daily_auto_close' );
	}
}
