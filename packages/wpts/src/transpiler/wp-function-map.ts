/**
 * Mapping of camelCase WordPress API function names to their snake_case PHP equivalents.
 * These functions are recognized in the TypeScript source and transpiled directly.
 */

export const WP_FUNCTION_MAP: Record<string, string> = {
  // Options API
  addOption: 'add_option',
  getOption: 'get_option',
  updateOption: 'update_option',
  deleteOption: 'delete_option',

  // Escaping
  escHtml: 'esc_html',
  escAttr: 'esc_attr',
  escUrl: 'esc_url',
  escUrlRaw: 'esc_url_raw',
  escJs: 'esc_js',
  escTextarea: 'esc_textarea',
  wpKses: 'wp_kses',
  wpKsesPost: 'wp_kses_post',

  // Sanitization
  sanitizeUser: 'sanitize_user',
  sanitizeTextField: 'sanitize_text_field',
  sanitizeTextareaField: 'sanitize_textarea_field',
  sanitizeTitle: 'sanitize_title',
  sanitizeEmail: 'sanitize_email',
  sanitizeFileName: 'sanitize_file_name',
  sanitizeKey: 'sanitize_key',

  // Output
  echo: 'echo',

  // Enqueueing
  wpEnqueueStyle: 'wp_enqueue_style',
  wpEnqueueScript: 'wp_enqueue_script',
  wpRegisterStyle: 'wp_register_style',
  wpRegisterScript: 'wp_register_script',
  wpLocalizeScript: 'wp_localize_script',

  // Plugin utilities
  pluginDirUrl: 'plugin_dir_url',
  pluginDirPath: 'plugin_dir_path',
  pluginBasename: 'plugin_basename',

  // Text domain / i18n
  loadPluginTextdomain: 'load_plugin_textdomain',

  // i18n — Translation
  __: '__',
  _e: '_e',
  _x: '_x',
  _ex: '_ex',
  _n: '_n',
  _nx: '_nx',

  // i18n — Escaped Translation
  escHtml__: 'esc_html__',
  escHtmlE: 'esc_html_e',
  escHtmlX: 'esc_html_x',
  escAttr__: 'esc_attr__',
  escAttrE: 'esc_attr_e',
  escAttrX: 'esc_attr_x',

  // Settings API
  settingsFields: 'settings_fields',
  doSettingsSections: 'do_settings_sections',
  submitButton: 'submit_button',
  registerSetting: 'register_setting',
  addSettingsSection: 'add_settings_section',
  addSettingsField: 'add_settings_field',

  // Admin pages
  addMenuPage: 'add_menu_page',
  addSubmenuPage: 'add_submenu_page',
  addOptionsPage: 'add_options_page',

  // Conditionals
  isSingle: 'is_single',
  isPage: 'is_page',
  isAdmin: 'is_admin',
  isFrontPage: 'is_front_page',
  isHome: 'is_home',
  isArchive: 'is_archive',
  isCategory: 'is_category',
  isTag: 'is_tag',
  isSingular: 'is_singular',
  isSearch: 'is_search',
  getSearchQuery: 'get_search_query',
  getQueriedObjectId: 'get_queried_object_id',

  // User
  currentUserCan: 'current_user_can',
  getCurrentUserId: 'get_current_user_id',
  isUserLoggedIn: 'is_user_logged_in',
  getUserBy: 'get_user_by',
  getUsers: 'get_users',
  usernameExists: 'username_exists',
  wpInsertUser: 'wp_insert_user',
  wpGetCurrentUser: 'wp_get_current_user',
  wpGeneratePassword: 'wp_generate_password',
  wpHashPassword: 'wp_hash_password',
  wpCheckPassword: 'wp_check_password',
  wpSetCurrentUser: 'wp_set_current_user',
  getTheAuthorMeta: 'get_the_author_meta',

  // Nonces
  wpCreateNonce: 'wp_create_nonce',
  wpVerifyNonce: 'wp_verify_nonce',
  wpNonceField: 'wp_nonce_field',
  checkAdminReferer: 'check_admin_referer',

  // Hooks
  addAction: 'add_action',
  addFilter: 'add_filter',
  doAction: 'do_action',
  applyFilters: 'apply_filters',
  removeAction: 'remove_action',
  removeFilter: 'remove_filter',
  addShortcode: 'add_shortcode',

  // Transients
  getTransient: 'get_transient',
  setTransient: 'set_transient',
  deleteTransient: 'delete_transient',

  // Posts
  getPost: 'get_post',
  getPostType: 'get_post_type',
  getPosts: 'get_posts',
  wpGetPostParentId: 'wp_get_post_parent_id',
  getTheId: 'get_the_ID',
  getTheTitle: 'get_the_title',
  getTheContent: 'get_the_content',
  getPermalink: 'get_permalink',

  // Metadata — Post
  getPostMeta: 'get_post_meta',
  addPostMeta: 'add_post_meta',
  updatePostMeta: 'update_post_meta',
  deletePostMeta: 'delete_post_meta',

  // Metadata — User
  getUserMeta: 'get_user_meta',
  addUserMeta: 'add_user_meta',
  updateUserMeta: 'update_user_meta',
  deleteUserMeta: 'delete_user_meta',

  // Metadata — Term
  getTermMeta: 'get_term_meta',
  addTermMeta: 'add_term_meta',
  updateTermMeta: 'update_term_meta',
  deleteTermMeta: 'delete_term_meta',

  // Metadata — Comment
  getCommentMeta: 'get_comment_meta',
  addCommentMeta: 'add_comment_meta',
  updateCommentMeta: 'update_comment_meta',
  deleteCommentMeta: 'delete_comment_meta',

  // Metadata — Generic
  getMetadata: 'get_metadata',
  addMetadata: 'add_metadata',
  updateMetadata: 'update_metadata',
  deleteMetadata: 'delete_metadata',

  // HTTP API — Requests
  wpRemoteGet: 'wp_remote_get',
  wpRemotePost: 'wp_remote_post',
  wpRemoteHead: 'wp_remote_head',
  wpRemoteRequest: 'wp_remote_request',

  // HTTP API — Safe Requests
  wpSafeRemoteGet: 'wp_safe_remote_get',
  wpSafeRemotePost: 'wp_safe_remote_post',
  wpSafeRemoteHead: 'wp_safe_remote_head',
  wpSafeRemoteRequest: 'wp_safe_remote_request',

  // HTTP API — Response
  wpRemoteRetrieveBody: 'wp_remote_retrieve_body',
  wpRemoteRetrieveResponseCode: 'wp_remote_retrieve_response_code',
  wpRemoteRetrieveResponseMessage: 'wp_remote_retrieve_response_message',
  wpRemoteRetrieveHeader: 'wp_remote_retrieve_header',
  wpRemoteRetrieveHeaders: 'wp_remote_retrieve_headers',
  wpRemoteRetrieveCookies: 'wp_remote_retrieve_cookies',

  // HTTP API — Error
  isWpError: 'is_wp_error',

  // URLs
  adminUrl: 'admin_url',
  homeUrl: 'home_url',
  siteUrl: 'site_url',
  contentUrl: 'content_url',

  // WooCommerce — Conditionals
  isWoocommerce: 'is_woocommerce',
  isShop: 'is_shop',
  isProduct: 'is_product',
  isCart: 'is_cart',
  isCheckout: 'is_checkout',
  isAccountPage: 'is_account_page',
  isWcEndpointUrl: 'is_wc_endpoint_url',

  // WooCommerce — Products
  wcGetProduct: 'wc_get_product',
  wcGetProducts: 'wc_get_products',
  wcGetProductIdBySku: 'wc_get_product_id_by_sku',

  // WooCommerce — Orders
  wcGetOrder: 'wc_get_order',
  wcGetOrders: 'wc_get_orders',
  wcCreateOrder: 'wc_create_order',

  // WooCommerce — Formatting & Helpers
  wcPrice: 'wc_price',
  wcClean: 'wc_clean',
  wcGetPageId: 'wc_get_page_id',
  wcGetPagePermalink: 'wc_get_page_permalink',
  wcGetEndpointUrl: 'wc_get_endpoint_url',
  wcGetCheckoutUrl: 'wc_get_checkout_url',
  wcGetCartUrl: 'wc_get_cart_url',

  // WooCommerce — Customer
  wcCustomerBoughtProduct: 'wc_customer_bought_product',
  wcGetCustomerOrderCount: 'wc_get_customer_order_count',

  // WooCommerce — Notices
  wcAddNotice: 'wc_add_notice',
  wcPrintNotices: 'wc_print_notices',
  wcHasNotice: 'wc_has_notice',

  // WooCommerce — Taxonomy/Attributes
  wcGetAttributeTaxonomies: 'wc_get_attribute_taxonomies',
  wcGetProductTerms: 'wc_get_product_terms',

  // WooCommerce — Templates
  wcGetTemplatePart: 'wc_get_template_part',
  wcGetTemplate: 'wc_get_template',

  // Custom Post Types & Taxonomies
  registerPostType: 'register_post_type',
  registerTaxonomy: 'register_taxonomy',
  wpDeletePost: 'wp_delete_post',
  wpCountPosts: 'wp_count_posts',

  // Database
  dbDelta: 'dbDelta',
  requireOnce: 'require_once',

  // Constants (used as identifiers, not function calls)
  ABSPATH: 'ABSPATH',

  // Content
  wpStripAllTags: 'wp_strip_all_tags',

  // Media
  wpGetAttachmentImageSrc: 'wp_get_attachment_image_src',
  wpGetAttachmentUrl: 'wp_get_attachment_url',

  // Cron / Scheduling
  wpScheduleSingleEvent: 'wp_schedule_single_event',
  wpNextScheduled: 'wp_next_scheduled',
  wpUnscheduleEvent: 'wp_unschedule_event',

  // Taxonomy
  getTerms: 'get_terms',
  wpGetObjectTerms: 'wp_get_object_terms',
  getTheTerms: 'get_the_terms',

  // AJAX
  checkAjaxReferer: 'check_ajax_referer',

  // REST API
  restEnsureResponse: 'rest_ensure_response',

  // Utility
  wpRand: 'wp_rand',

  // PHP Built-ins (hashing)
  hash: 'hash',
  uniqid: 'uniqid',

  // PHP Built-ins (formatting)
  numberFormat: 'number_format',

  // PHP Built-ins (for JWT / encoding)
  jsonEncode: 'json_encode',
  jsonDecode: 'json_decode',
  base64Encode: 'base64_encode',
  base64Decode: 'base64_decode',
  hashHmac: 'hash_hmac',
  hashEquals: 'hash_equals',

  // PHP Built-ins (general)
  classExists: 'class_exists',
  functionExists: 'function_exists',
  md5: 'md5',
  intval: 'intval',
  strval: 'strval',
  strtolower: 'strtolower',
  strtr: 'strtr',
  rtrim: 'rtrim',
  time: 'time',
  getallheaders: 'getallheaders',
  header: 'header',
  isArray: 'is_array',
  levenshtein: 'levenshtein',
  arrayUnique: 'array_unique',
  arrayValues: 'array_values',

  // Misc
  wpDie: 'wp_die',
  wpRedirect: 'wp_redirect',
  wpSafeRedirect: 'wp_safe_redirect',
  wpSendJson: 'wp_send_json',
  wpSendJsonSuccess: 'wp_send_json_success',
  wpSendJsonError: 'wp_send_json_error',
  absint: 'absint',
  wpUnslash: 'wp_unslash',
};

/**
 * Mapping of JavaScript built-in method calls to PHP function calls.
 * Key format: "type.method" -> { phpFunc, argTransform }
 */
export interface MethodMapping {
  phpFunc: string;
  /** 'swap' means the object becomes the last argument, 'prepend' means it becomes the first */
  objectPosition: 'first' | 'last' | 'swap';
}

export const JS_METHOD_MAP: Record<string, MethodMapping> = {
  // Array methods
  'push': { phpFunc: 'array_push', objectPosition: 'first' },
  'pop': { phpFunc: 'array_pop', objectPosition: 'first' },
  'shift': { phpFunc: 'array_shift', objectPosition: 'first' },
  'unshift': { phpFunc: 'array_unshift', objectPosition: 'first' },
  'indexOf': { phpFunc: 'array_search', objectPosition: 'last' },
  'includes': { phpFunc: 'in_array', objectPosition: 'last' },
  'join': { phpFunc: 'implode', objectPosition: 'last' },
  'reverse': { phpFunc: 'array_reverse', objectPosition: 'first' },
  'slice': { phpFunc: 'array_slice', objectPosition: 'first' },
  'splice': { phpFunc: 'array_splice', objectPosition: 'first' },
  'map': { phpFunc: 'array_map', objectPosition: 'last' },
  'filter': { phpFunc: 'array_filter', objectPosition: 'first' },
  'keys': { phpFunc: 'array_keys', objectPosition: 'first' },
  'values': { phpFunc: 'array_values', objectPosition: 'first' },
  'concat': { phpFunc: 'array_merge', objectPosition: 'first' },
  'sort': { phpFunc: 'sort', objectPosition: 'first' },
  'forEach': { phpFunc: 'array_walk', objectPosition: 'first' },
  'findIndex': { phpFunc: 'array_search', objectPosition: 'last' },
  'fill': { phpFunc: 'array_fill', objectPosition: 'first' },

  // String methods
  'trim': { phpFunc: 'trim', objectPosition: 'first' },
  'trimStart': { phpFunc: 'ltrim', objectPosition: 'first' },
  'trimEnd': { phpFunc: 'rtrim', objectPosition: 'first' },
  'toLowerCase': { phpFunc: 'strtolower', objectPosition: 'first' },
  'toUpperCase': { phpFunc: 'strtoupper', objectPosition: 'first' },
  'split': { phpFunc: 'explode', objectPosition: 'last' },
  'replace': { phpFunc: 'str_replace', objectPosition: 'last' },
  'substring': { phpFunc: 'substr', objectPosition: 'first' },
  'substr': { phpFunc: 'substr', objectPosition: 'first' },
  'startsWith': { phpFunc: 'str_starts_with', objectPosition: 'first' },
  'endsWith': { phpFunc: 'str_ends_with', objectPosition: 'first' },
  'repeat': { phpFunc: 'str_repeat', objectPosition: 'first' },
  'padStart': { phpFunc: 'str_pad', objectPosition: 'first' },
  'charAt': { phpFunc: 'substr', objectPosition: 'first' },
  'replaceAll': { phpFunc: 'str_replace', objectPosition: 'last' },
};

/**
 * Properties that map to PHP function calls.
 */
export const PROPERTY_MAP: Record<string, { phpFunc: string }> = {
  'length': { phpFunc: 'count' },  // Works for both arrays and strings (strlen for strings)
};
