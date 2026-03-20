<?php

if ( ! defined( 'WPINC' ) ) {
	die;
}

class Headless_Fuzzyfind_Public {

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
		$this->index_product( $product_id );
	}

	public function on_product_update( $product_id ) {
		if ( ! class_exists( 'WooCommerce' ) ) {
			return;
		}
		$this->index_product( $product_id );
	}

	public function on_variation_create( $variation_id ) {
		$parent_id = wp_get_post_parent_id( $variation_id );
		if ( $parent_id ) {
			$this->index_product( $parent_id );
		}
	}

	public function on_variation_update( $variation_id ) {
		$parent_id = wp_get_post_parent_id( $variation_id );
		if ( $parent_id ) {
			$this->index_product( $parent_id );
		}
	}

	public function on_product_delete( $post_id ) {
		global $wpdb;
		if ( get_post_type( $post_id ) !== 'product' ) {
			return;
		}
		$table_name = get_option( 'headless_fuzzyfind_index_table', '' );
		if ( ! $table_name ) {
			return;
		}
		$wpdb->delete( $table_name, array( 'product_id' => $post_id ) );
	}

	public function on_product_trash( $post_id ) {
		global $wpdb;
		if ( get_post_type( $post_id ) !== 'product' ) {
			return;
		}
		$table_name = get_option( 'headless_fuzzyfind_index_table', '' );
		if ( ! $table_name ) {
			return;
		}
		$wpdb->delete( $table_name, array( 'product_id' => $post_id ) );
	}

	public function on_product_untrash( $post_id ) {
		if ( get_post_type( $post_id ) !== 'product' ) {
			return;
		}
		$this->index_product( $post_id );
	}

	public function do_reindex() {
		global $wpdb;
		if ( ! class_exists( 'WooCommerce' ) ) {
			return;
		}
		$table_name = get_option( 'headless_fuzzyfind_index_table', '' );
		if ( ! $table_name ) {
			return;
		}
		$page = 1;
		$batch_size = 50;
		$has_more = true;
		while ( $has_more ) {
			$products = wc_get_products( array( 'status' => 'publish', 'limit' => $batch_size, 'page' => $page, 'return' => 'ids' ) );
			if ( count( $products ) === 0 ) {
				$has_more = false;
			} else {
				foreach ( $products as $product_id ) {
					$this->index_product( $product_id );
				}
				$page = $page + 1;
				if ( count( $products ) < $batch_size ) {
					$has_more = false;
				}
			}
		}
		$wpdb->query( $wpdb->prepare( 'DELETE FROM %i WHERE product_id NOT IN (SELECT ID FROM %i WHERE post_type = \'product\' AND post_status = \'publish\')', $table_name, $wpdb->posts ) );
		update_option( 'headless_fuzzyfind_last_indexed', time() );
		delete_option( 'headless_fuzzyfind_reindex_in_progress' );
	}

	public function index_product( $product_id ) {
		global $wpdb;
		$table_name = get_option( 'headless_fuzzyfind_index_table', '' );
		if ( ! $table_name ) {
			return;
		}
		$product = wc_get_product( $product_id );
		if ( ! $product ) {
			return;
		}
		$status = $product->get_status();
		if ( $status !== 'publish' ) {
			$wpdb->delete( $table_name, array( 'product_id' => $product_id ) );
			return;
		}
		$visibility = $product->get_catalog_visibility();
		if ( $visibility === 'hidden' || $visibility === 'catalog' ) {
			$wpdb->delete( $table_name, array( 'product_id' => $product_id ) );
			return;
		}
		$title = $product->get_name() ?? '';
		$sku = $product->get_sku() ?? '';
		$content = wp_strip_all_tags( $product->get_description() ?? '' );
		$short_desc = wp_strip_all_tags( $product->get_short_description() ?? '' );
		$attributes = $product->get_attributes();
		$attr_values = array();
		if ( $attributes ) {
			foreach ( $attributes as $key => $value ) {
				$attr = $attributes[$key];
				if ( ! $attr ) {
					continue;
				}
				if ( $attr->is_taxonomy() ) {
					$terms = wc_get_product_terms( $product_id, $attr->get_name(), array( 'fields' => 'names' ) );
					if ( $terms && count( $terms ) > 0 ) {
						$attr_values = array_merge( $attr_values, $terms );
					}
				} else {
					$opts = $attr->get_options();
					if ( $opts && count( $opts ) > 0 ) {
						$attr_values = array_merge( $attr_values, $opts );
					}
				}
			}
		}
		$attribute_str = implode( ' ', $attr_values );
		$category_names = wc_get_product_terms( $product_id, 'product_cat', array( 'fields' => 'names' ) ) ?? array();
		$categories_str = implode( ' ', $category_names );
		$tag_names = wc_get_product_terms( $product_id, 'product_tag', array( 'fields' => 'names' ) ) ?? array();
		$tags_str = implode( ' ', $tag_names );
		$variation_skus = array();
		$product_type = $product->get_type();
		if ( $product_type === 'variable' ) {
			$child_ids = $product->get_children();
			if ( $child_ids && count( $child_ids ) > 0 ) {
				foreach ( $child_ids as $child_id ) {
					$variation = wc_get_product( $child_id );
					if ( $variation ) {
						$var_sku = $variation->get_sku() ?? '';
						if ( $var_sku ) {
							array_push( $variation_skus, $var_sku );
						}
					}
				}
			}
		}
		$variation_skus_str = implode( ' ', $variation_skus );
		$sql = $wpdb->prepare( 'INSERT INTO %i (product_id, title, sku, short_desc, content, attributes, categories, tags, variation_skus, indexed_at) VALUES (%d, %s, %s, %s, %s, %s, %s, %s, %s, NOW()) ON DUPLICATE KEY UPDATE title = VALUES(title), sku = VALUES(sku), short_desc = VALUES(short_desc), content = VALUES(content), attributes = VALUES(attributes), categories = VALUES(categories), tags = VALUES(tags), variation_skus = VALUES(variation_skus), indexed_at = NOW()', $table_name, $product_id, $title, $sku, $short_desc, $content, $attribute_str, $categories_str, $tags_str, $variation_skus_str );
		$wpdb->query( $sql );
	}

}
