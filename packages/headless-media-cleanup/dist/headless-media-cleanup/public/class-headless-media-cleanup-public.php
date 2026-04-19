<?php

if ( ! defined( 'WPINC' ) ) {
	die;
}

class Headless_Media_Cleanup_Public {

	private $plugin_name;
	private $version;

	public function __construct( $plugin_name, $version ) {
		$this->plugin_name = $plugin_name;
		$this->version     = $version;
	}

	public function on_product_create( $product_id ) {
		if ( ! class_exists( 'WooCommerce' ) ) {
			return;
		}
		$images = $this->get_product_image_ids( $product_id );
		update_post_meta( $product_id, '_hmc_tracked_images', wp_json_encode( $images ) );
	}

	public function on_variation_create( $variation_id ) {
		$featured_id = intval( get_post_meta( $variation_id, '_thumbnail_id', true ) );
		$images = $featured_id > 0 ? array( $featured_id ) : array();
		update_post_meta( $variation_id, '_hmc_tracked_images', wp_json_encode( $images ) );
	}

	public function on_product_update( $product_id ) {
		if ( ! class_exists( 'WooCommerce' ) ) {
			return;
		}
		$this->diff_and_clean_product_images( $product_id );
	}

	public function on_variation_update( $variation_id ) {
		$this->diff_and_clean_product_images( $variation_id );
	}

	public function on_post_meta_updated( $meta_id, $post_id, $meta_key, $meta_value ) {
		if ( $meta_key !== '_thumbnail_id' && $meta_key !== '_product_image_gallery' ) {
			return;
		}
		$post_type = get_post_type( $post_id );
		if ( $post_type !== 'product' && $post_type !== 'product_variation' ) {
			return;
		}
		$this->diff_and_clean_product_images( $post_id );
	}

	public function on_post_meta_delete( $meta_ids, $post_id, $meta_key, $meta_value ) {
		if ( $meta_key !== '_thumbnail_id' && $meta_key !== '_product_image_gallery' ) {
			return;
		}
		$post_type = get_post_type( $post_id );
		if ( $post_type !== 'product' && $post_type !== 'product_variation' ) {
			return;
		}
		$this->diff_and_clean_product_images( $post_id );
	}

	public function on_before_delete_post( $post_id, $post ) {
		$post_type = get_post_type( $post_id );
		if ( $post_type !== 'product' && $post_type !== 'product_variation' ) {
			return;
		}
		$images = $this->get_product_image_ids( $post_id );
		if ( count( $images ) > 0 ) {
			set_transient( 'hmc_deleting_' . strval( $post_id ), wp_json_encode( $images ), 60 );
		}
	}

	public function on_deleted_post( $post_id, $post ) {
		$raw = get_transient( 'hmc_deleting_' . strval( $post_id ) );
		if ( ! $raw ) {
			return;
		}
		delete_transient( 'hmc_deleting_' . strval( $post_id ) );
		$images = json_decode( $raw, true ) ?? array();
		foreach ( $images as $attachment_id ) {
			$this->maybe_delete_attachment( intval( $attachment_id ) );
		}
	}

	public function on_term_meta_added( $meta_id, $object_id, $meta_key, $meta_value ) {
		if ( $meta_key !== 'thumbnail_id' ) {
			return;
		}
		if ( ! $this->is_tracked_taxonomy( $object_id ) ) {
			return;
		}
		$thumbnail_id = intval( strval( $meta_value ) );
		if ( $thumbnail_id > 0 ) {
			update_term_meta( $object_id, '_hmc_tracked_image', strval( $thumbnail_id ) );
		}
	}

	public function on_term_meta_updated( $meta_id, $object_id, $meta_key, $meta_value ) {
		if ( $meta_key !== 'thumbnail_id' ) {
			return;
		}
		if ( ! $this->is_tracked_taxonomy( $object_id ) ) {
			return;
		}
		$previous_id = intval( get_term_meta( $object_id, '_hmc_tracked_image', true ) );
		$current_id = intval( strval( $meta_value ) );
		update_term_meta( $object_id, '_hmc_tracked_image', strval( $current_id ) );
		if ( $previous_id > 0 && $previous_id !== $current_id ) {
			$this->maybe_delete_attachment( $previous_id );
		}
	}

	public function on_term_meta_delete( $meta_ids, $object_id, $meta_key, $meta_value ) {
		if ( $meta_key !== 'thumbnail_id' ) {
			return;
		}
		if ( ! $this->is_tracked_taxonomy( $object_id ) ) {
			return;
		}
		$previous_id = intval( get_term_meta( $object_id, '_hmc_tracked_image', true ) );
		delete_term_meta( $object_id, '_hmc_tracked_image' );
		if ( $previous_id > 0 ) {
			$this->maybe_delete_attachment( $previous_id );
		}
	}

	public function on_pre_delete_term( $term_id, $taxonomy ) {
		$target_taxonomies = apply_filters( 'headless_media_cleanup_taxonomies', array( 'product_cat', 'product_tag', 'product_brand' ) );
		if ( ! in_array( $taxonomy, $target_taxonomies, true ) ) {
			return;
		}
		$thumbnail_id = get_term_meta( $term_id, 'thumbnail_id', true );
		if ( intval( $thumbnail_id ) > 0 ) {
			set_transient( 'hmc_term_deleting_' . strval( $term_id ), $thumbnail_id, 60 );
		}
	}

	public function on_delete_term( $term_id, $tt_id, $taxonomy, $deleted_term, $object_ids ) {
		$raw = get_transient( 'hmc_term_deleting_' . strval( $term_id ) );
		if ( ! $raw ) {
			return;
		}
		delete_transient( 'hmc_term_deleting_' . strval( $term_id ) );
		$thumbnail_id = intval( strval( $raw ) );
		if ( $thumbnail_id > 0 ) {
			$this->maybe_delete_attachment( $thumbnail_id );
		}
	}

	public function get_product_image_ids( $post_id ) {
		$images = array();
		$featured_id = intval( get_post_meta( $post_id, '_thumbnail_id', true ) );
		if ( $featured_id > 0 ) {
			array_push( $images, $featured_id );
		}
		$gallery_str = get_post_meta( $post_id, '_product_image_gallery', true );
		if ( $gallery_str ) {
			$parts = explode( ',', $gallery_str );
			foreach ( $parts as $part ) {
				$id = intval( trim( $part ) );
				if ( $id > 0 && ! in_array( $id, $images, true ) ) {
					array_push( $images, $id );
				}
			}
		}
		return $images;
	}

	public function diff_and_clean_product_images( $post_id ) {
		$current_images = $this->get_product_image_ids( $post_id );
		$previous_raw = get_post_meta( $post_id, '_hmc_tracked_images', true );
		$previous_images = $previous_raw ? (json_decode( $previous_raw, true ) ?? array()) : array();
		update_post_meta( $post_id, '_hmc_tracked_images', wp_json_encode( $current_images ) );
		foreach ( $previous_images as $old_id ) {
			$attachment_id = intval( $old_id );
			if ( $attachment_id > 0 && ! in_array( $attachment_id, $current_images, true ) ) {
				$this->maybe_delete_attachment( $attachment_id );
			}
		}
	}

	public function is_tracked_taxonomy( $term_id ) {
		global $wpdb;
		$taxonomy = $wpdb->get_var( $wpdb->prepare( 'SELECT taxonomy FROM ' . $wpdb->term_taxonomy . ' WHERE term_id = %d', $term_id ) );
		if ( ! $taxonomy ) {
			return false;
		}
		$target_taxonomies = apply_filters( 'headless_media_cleanup_taxonomies', array( 'product_cat', 'product_tag', 'product_brand' ) );
		return in_array( $taxonomy, $target_taxonomies, true );
	}

	public function is_attachment_referenced( $attachment_id ) {
		global $wpdb;
		$id_str = strval( $attachment_id );
		$featured_count = $wpdb->get_var( $wpdb->prepare( 'SELECT COUNT(*) FROM ' . $wpdb->postmeta . ' WHERE meta_key = \'_thumbnail_id\' AND meta_value = %s', $id_str ) );
		if ( intval( $featured_count ) > 0 ) {
			return true;
		}
		$gallery_count = $wpdb->get_var( $wpdb->prepare( 'SELECT COUNT(*) FROM ' . $wpdb->postmeta . ' WHERE meta_key = \'_product_image_gallery\' AND FIND_IN_SET(%s, meta_value) > 0', $id_str ) );
		if ( intval( $gallery_count ) > 0 ) {
			return true;
		}
		$term_count = $wpdb->get_var( $wpdb->prepare( 'SELECT COUNT(*) FROM ' . $wpdb->termmeta . ' WHERE meta_key = \'thumbnail_id\' AND meta_value = %s', $id_str ) );
		if ( intval( $term_count ) > 0 ) {
			return true;
		}
		return false;
	}

	public function maybe_delete_attachment( $attachment_id ) {
		$enabled = apply_filters( 'headless_media_cleanup_enabled', true );
		if ( ! $enabled ) {
			return;
		}
		$post = get_post( $attachment_id, 'ARRAY_A' );
		if ( ! $post ) {
			return;
		}
		if ( $post['post_type'] !== 'attachment' ) {
			return;
		}
		$mime_type = strval( $post['post_mime_type'] );
		if ( ! str_starts_with( $mime_type, 'image/' ) ) {
			$this->log( 'HMC: skipped #' . strval( $attachment_id ) . ' — not an image (' . $mime_type . ')' );
			return;
		}
		$should_delete = apply_filters( 'headless_media_cleanup_should_delete', true, $attachment_id );
		if ( ! $should_delete ) {
			$this->log( 'HMC: skipped #' . strval( $attachment_id ) . ' — blocked by should_delete filter' );
			return;
		}
		if ( $this->is_attachment_referenced( $attachment_id ) ) {
			$this->log( 'HMC: skipped #' . strval( $attachment_id ) . ' — still referenced' );
			return;
		}
		$result = wp_delete_attachment( $attachment_id, true );
		if ( $result ) {
			$this->log( 'HMC: deleted attachment #' . strval( $attachment_id ) );
		} else {
			$this->log( 'HMC: failed to delete attachment #' . strval( $attachment_id ) );
		}
	}

	public function log( $message ) {
		if ( defined( 'WP_DEBUG_LOG' ) && WP_DEBUG_LOG ) {
			error_log( $message );
		}
	}

}
