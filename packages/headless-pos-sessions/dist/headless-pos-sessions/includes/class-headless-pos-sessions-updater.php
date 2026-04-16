<?php

if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Auto-updater for Headless POS Sessions.
 *
 * Queries GitHub Releases for tags prefixed "headless-pos-sessions@" and surfaces
 * newer versions through WordPress's native update UI via the WP 5.8+
 * Update URI mechanism.
 */
class Headless_Pos_Sessions_Updater {

	const GITHUB_REPO = 'AmitGurbani/wordpress-plugins';
	const TAG_PREFIX  = 'headless-pos-sessions@';
	const UPDATE_URI  = 'https://github.com/AmitGurbani/wordpress-plugins/releases?plugin=headless-pos-sessions';
	const PLUGIN_SLUG = 'headless-pos-sessions';
	const ZIP_NAME    = 'headless-pos-sessions.zip';
	const CACHE_KEY   = 'headless_pos_sessions_gh_release_cache';
	const API_URL     = 'https://api.github.com/repos/AmitGurbani/wordpress-plugins/releases?per_page=100';
	const CACHE_TTL_SUCCESS = 12 * HOUR_IN_SECONDS;
	const CACHE_TTL_FAILURE = 15 * MINUTE_IN_SECONDS;

	private $plugin_file;
	private $current_version;

	public function __construct( $plugin_file, $current_version ) {
		$this->plugin_file     = $plugin_file;
		$this->current_version = $current_version;
	}

	public function register() {
		add_filter( 'update_plugins_github.com', array( $this, 'check_for_update' ), 10, 4 );
		add_filter( 'plugins_api', array( $this, 'plugin_details' ), 10, 3 );
	}

	/**
	 * Filter callback for update_plugins_{hostname}.
	 *
	 * WP dispatches by Update URI hostname, so the same filter fires for every
	 * plugin on this site that uses the same hostname. The UpdateURI string
	 * match below is the mandatory per-plugin gate — without it, handlers
	 * would clobber each other's updates.
	 */
	public function check_for_update( $update, $plugin_data, $plugin_file, $locales ) {
		if ( empty( $plugin_data['UpdateURI'] ) || $plugin_data['UpdateURI'] !== self::UPDATE_URI ) {
			return $update;
		}

		$release = $this->get_latest_release();
		if ( ! is_array( $release ) || empty( $release['tag_name'] ) ) {
			return $update;
		}

		$remote_version = $this->version_from_tag( $release['tag_name'] );
		if ( ! $remote_version || version_compare( $remote_version, $this->current_version, '<=' ) ) {
			return $update;
		}

		$zip_url = $this->zip_url_from_release( $release );
		if ( ! $zip_url ) {
			return $update;
		}

		return array(
			'slug'         => self::PLUGIN_SLUG,
			'version'      => $remote_version,
			'url'          => isset( $release['html_url'] ) ? $release['html_url'] : '',
			'package'      => $zip_url,
			'tested'       => isset( $plugin_data['RequiresWP'] ) ? $plugin_data['RequiresWP'] : '',
			'requires'     => isset( $plugin_data['RequiresWP'] ) ? $plugin_data['RequiresWP'] : '',
			'requires_php' => isset( $plugin_data['RequiresPHP'] ) ? $plugin_data['RequiresPHP'] : '',
		);
	}

	/**
	 * Populate the "View details" modal on the Plugins screen.
	 */
	public function plugin_details( $result, $action, $args ) {
		if ( 'plugin_information' !== $action ) {
			return $result;
		}
		if ( empty( $args->slug ) || $args->slug !== self::PLUGIN_SLUG ) {
			return $result;
		}

		$release = $this->get_latest_release();
		if ( ! is_array( $release ) ) {
			return $result;
		}

		$remote_version = $this->version_from_tag( $release['tag_name'] );
		if ( ! $remote_version ) {
			return $result;
		}

		if ( ! function_exists( 'get_plugin_data' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}
		$plugin_data = get_plugin_data( $this->plugin_file, false, false );

		$info                = new stdClass();
		$info->name          = $plugin_data['Name'];
		$info->slug          = self::PLUGIN_SLUG;
		$info->version       = $remote_version;
		$info->author        = $plugin_data['Author'];
		$info->homepage      = $plugin_data['PluginURI'];
		$info->requires      = $plugin_data['RequiresWP'];
		$info->requires_php  = $plugin_data['RequiresPHP'];
		$info->download_link = $this->zip_url_from_release( $release );
		$info->sections      = array(
			'description' => wpautop( esc_html( $plugin_data['Description'] ) ),
			'changelog'   => $this->render_changelog( $release ),
		);

		return $info;
	}

	/**
	 * Fetch the most recent non-draft, non-prerelease release matching TAG_PREFIX.
	 * Caches on success (12h) and failure (15m) to respect GitHub's 60/hr limit.
	 */
	private function get_latest_release() {
		$cached = get_transient( self::CACHE_KEY );
		if ( is_array( $cached ) ) {
			if ( ! empty( $cached['tag_name'] ) ) {
				return $cached;
			}
			// Cached failure marker — respect TTL, skip re-fetch.
			return null;
		}

		$response = wp_remote_get(
			self::API_URL,
			array(
				'timeout' => 10,
				'headers' => array(
					'Accept'     => 'application/vnd.github+json',
					'User-Agent' => 'wpts-updater/' . self::PLUGIN_SLUG,
				),
			)
		);

		if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) {
			set_transient( self::CACHE_KEY, array( 'failed' => true ), self::CACHE_TTL_FAILURE );
			return null;
		}

		$body = json_decode( wp_remote_retrieve_body( $response ), true );
		if ( ! is_array( $body ) ) {
			set_transient( self::CACHE_KEY, array( 'failed' => true ), self::CACHE_TTL_FAILURE );
			return null;
		}

		$latest   = null;
		$best_ver = '0.0.0';
		foreach ( $body as $rel ) {
			if ( ! is_array( $rel ) || empty( $rel['tag_name'] ) ) {
				continue;
			}
			if ( ! empty( $rel['draft'] ) || ! empty( $rel['prerelease'] ) ) {
				continue;
			}
			if ( 0 !== strpos( $rel['tag_name'], self::TAG_PREFIX ) ) {
				continue;
			}
			$ver = $this->version_from_tag( $rel['tag_name'] );
			if ( $ver && version_compare( $ver, $best_ver, '>' ) ) {
				$best_ver = $ver;
				$latest   = $rel;
			}
		}

		if ( $latest ) {
			set_transient( self::CACHE_KEY, $latest, self::CACHE_TTL_SUCCESS );
			return $latest;
		}

		set_transient( self::CACHE_KEY, array( 'failed' => true ), self::CACHE_TTL_FAILURE );
		return null;
	}

	private function version_from_tag( $tag ) {
		if ( ! is_string( $tag ) || 0 !== strpos( $tag, self::TAG_PREFIX ) ) {
			return null;
		}
		$version = substr( $tag, strlen( self::TAG_PREFIX ) );
		return $version !== '' ? $version : null;
	}

	private function zip_url_from_release( $release ) {
		if ( empty( $release['assets'] ) || ! is_array( $release['assets'] ) ) {
			return null;
		}
		foreach ( $release['assets'] as $asset ) {
			if ( is_array( $asset )
				&& isset( $asset['name'], $asset['browser_download_url'] )
				&& $asset['name'] === self::ZIP_NAME
			) {
				return $asset['browser_download_url'];
			}
		}
		return null;
	}

	private function render_changelog( $release ) {
		$body = isset( $release['body'] ) ? (string) $release['body'] : '';
		return '<pre style="white-space:pre-wrap">' . esc_html( $body ) . '</pre>';
	}
}
