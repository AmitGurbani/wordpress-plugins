<?php

if ( ! defined( 'WPINC' ) ) {
	die;
}

class Headless_Media_Cleanup_Rest_Api {

	private $namespace;

	public function __construct( $plugin_slug ) {
		$this->namespace = $plugin_slug . '/v1';
	}

	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/orphans',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'get_orphans' ),
				'permission_callback' => function() {
					return current_user_can( 'manage_options' );
				},
			)
		);
		register_rest_route(
			$this->namespace,
			'/orphans/cleanup',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'cleanup_orphans' ),
				'permission_callback' => function() {
					return current_user_can( 'manage_options' );
				},
			)
		);
	}


	public function get_orphans( $request ) {
		global $wpdb;
		if ( ! class_exists( 'WooCommerce' ) ) {
			return new WP_Error( 'woocommerce_required', 'WooCommerce is not active.', array( 'status' => 503 ) );
		}
		$per_page = min( 100, max( 1, intval( $request->get_param( 'per_page' ) ?? '20' ) ) );
		$page = max( 1, intval( $request->get_param( 'page' ) ?? '1' ) );
		$offset = ($page - 1) * $per_page;
		$sql = $wpdb->prepare( 'SELECT p.ID, p.post_title, p.guid, p.post_parent
       FROM ' . $wpdb->posts . ' p
       WHERE p.post_type = \'attachment\'
         AND p.post_mime_type LIKE %s
         AND p.ID NOT IN (
           SELECT DISTINCT CAST(pm.meta_value AS UNSIGNED)
           FROM ' . $wpdb->postmeta . ' pm
           WHERE pm.meta_key = \'_thumbnail_id\'
             AND pm.meta_value != \'\'
             AND pm.meta_value != \'0\'
         )
         AND NOT EXISTS (
           SELECT 1 FROM ' . $wpdb->postmeta . ' pm2
           WHERE pm2.meta_key = \'_product_image_gallery\'
             AND FIND_IN_SET(p.ID, pm2.meta_value) > 0
         )
         AND p.ID NOT IN (
           SELECT DISTINCT CAST(tm.meta_value AS UNSIGNED)
           FROM ' . $wpdb->termmeta . ' tm
           WHERE tm.meta_key = \'thumbnail_id\'
             AND tm.meta_value != \'\'
             AND tm.meta_value != \'0\'
         )
       ORDER BY p.ID DESC
       LIMIT %d OFFSET %d', 'image/%', $per_page, $offset );
		$rows = $wpdb->get_results( $sql, 'ARRAY_A' );
		$orphans = array();
		foreach ( $rows as $row ) {
			$attachment_id = intval( $row['ID'] );
			$image_url = wp_get_attachment_url( $attachment_id );
			array_push( $orphans, array( 'id' => $attachment_id, 'title' => $row['post_title'], 'url' => $image_url ? $image_url : $row['guid'], 'uploaded_to' => intval( $row['post_parent'] ) ) );
		}
		$count_sql = $wpdb->prepare( 'SELECT COUNT(*)
       FROM ' . $wpdb->posts . ' p
       WHERE p.post_type = \'attachment\'
         AND p.post_mime_type LIKE %s
         AND p.ID NOT IN (
           SELECT DISTINCT CAST(pm.meta_value AS UNSIGNED)
           FROM ' . $wpdb->postmeta . ' pm
           WHERE pm.meta_key = \'_thumbnail_id\'
             AND pm.meta_value != \'\'
             AND pm.meta_value != \'0\'
         )
         AND NOT EXISTS (
           SELECT 1 FROM ' . $wpdb->postmeta . ' pm2
           WHERE pm2.meta_key = \'_product_image_gallery\'
             AND FIND_IN_SET(p.ID, pm2.meta_value) > 0
         )
         AND p.ID NOT IN (
           SELECT DISTINCT CAST(tm.meta_value AS UNSIGNED)
           FROM ' . $wpdb->termmeta . ' tm
           WHERE tm.meta_key = \'thumbnail_id\'
             AND tm.meta_value != \'\'
             AND tm.meta_value != \'0\'
         )', 'image/%' );
		$total = intval( $wpdb->get_var( $count_sql ) );
		$total_pages = ceil( $total / $per_page );
		$response = rest_ensure_response( array( 'orphans' => $orphans, 'total' => $total, 'page' => $page, 'per_page' => $per_page, 'total_pages' => $total_pages ) );
		return $response;
	}

	public function cleanup_orphans( $request ) {
		global $wpdb;
		if ( ! class_exists( 'WooCommerce' ) ) {
			return new WP_Error( 'woocommerce_required', 'WooCommerce is not active.', array( 'status' => 503 ) );
		}
		$enabled = apply_filters( 'headless_media_cleanup_enabled', true );
		if ( ! $enabled ) {
			return rest_ensure_response( array( 'deleted' => 0, 'skipped' => 0, 'errors' => 0 ) );
		}
		$max_items = 500;
		$sql = $wpdb->prepare( 'SELECT p.ID
       FROM ' . $wpdb->posts . ' p
       WHERE p.post_type = \'attachment\'
         AND p.post_mime_type LIKE %s
         AND p.ID NOT IN (
           SELECT DISTINCT CAST(pm.meta_value AS UNSIGNED)
           FROM ' . $wpdb->postmeta . ' pm
           WHERE pm.meta_key = \'_thumbnail_id\'
             AND pm.meta_value != \'\'
             AND pm.meta_value != \'0\'
         )
         AND NOT EXISTS (
           SELECT 1 FROM ' . $wpdb->postmeta . ' pm2
           WHERE pm2.meta_key = \'_product_image_gallery\'
             AND FIND_IN_SET(p.ID, pm2.meta_value) > 0
         )
         AND p.ID NOT IN (
           SELECT DISTINCT CAST(tm.meta_value AS UNSIGNED)
           FROM ' . $wpdb->termmeta . ' tm
           WHERE tm.meta_key = \'thumbnail_id\'
             AND tm.meta_value != \'\'
             AND tm.meta_value != \'0\'
         )
       ORDER BY p.ID DESC
       LIMIT %d', 'image/%', $max_items );
		$rows = $wpdb->get_results( $sql, 'ARRAY_A' );
		$deleted = 0;
		$skipped = 0;
		$errors = 0;
		foreach ( $rows as $row ) {
			$attachment_id = intval( $row['ID'] );
			$post = get_post( $attachment_id, 'ARRAY_A' );
			if ( ! $post ) {
				continue;
			}
			$should_delete = apply_filters( 'headless_media_cleanup_should_delete', true, $attachment_id );
			if ( ! $should_delete ) {
				$skipped = $skipped + 1;
				continue;
			}
			$result = wp_delete_attachment( $attachment_id, true );
			if ( $result ) {
				$deleted = $deleted + 1;
			} else {
				$errors = $errors + 1;
			}
		}
		return rest_ensure_response( array( 'deleted' => $deleted, 'skipped' => $skipped, 'errors' => $errors ) );
	}

}
