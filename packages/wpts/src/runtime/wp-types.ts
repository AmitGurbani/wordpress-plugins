/**
 * WordPress API ambient type declarations for wpts.
 *
 * These declarations provide autocompletion and type checking when writing
 * plugin source files (.ts). They are NOT executed at runtime — the transpiler
 * maps each camelCase function to its snake_case PHP equivalent.
 *
 * Usage: Automatically available in any project that imports from 'wpts'.
 * The `declare global` block augments the global scope when the module is loaded.
 */

declare global {
  // ---------------------------------------------------------------------------
  // Options API
  // ---------------------------------------------------------------------------
  function addOption(key: string, value: any, deprecated?: string, autoload?: boolean): boolean;
  function getOption(key: string, defaultValue?: any): any;
  function updateOption(key: string, value: any, autoload?: boolean): boolean;
  function deleteOption(key: string): boolean;

  // ---------------------------------------------------------------------------
  // Escaping
  // ---------------------------------------------------------------------------
  function escHtml(text: string): string;
  function escAttr(text: string): string;
  function escUrl(url: string, protocols?: string[]): string;
  function escUrlRaw(url: string, protocols?: string[]): string;
  function escJs(text: string): string;
  function escTextarea(text: string): string;
  function wpKses(
    content: string,
    allowedHtml: Record<string, any>,
    allowedProtocols?: string[],
  ): string;
  function wpKsesPost(content: string): string;

  // ---------------------------------------------------------------------------
  // Sanitization
  // ---------------------------------------------------------------------------
  function sanitizeUser(username: string, strict?: boolean): string;
  function sanitizeTextField(str: string): string;
  function sanitizeTextareaField(str: string): string;
  function sanitizeTitle(title: string, fallbackTitle?: string, context?: string): string;
  function sanitizeEmail(email: string): string;
  function sanitizeFileName(filename: string): string;
  function sanitizeKey(key: string): string;

  // ---------------------------------------------------------------------------
  // Output
  // ---------------------------------------------------------------------------
  function echo(output: string): void;

  // ---------------------------------------------------------------------------
  // Enqueueing
  // ---------------------------------------------------------------------------
  function wpEnqueueStyle(
    handle: string,
    src?: string,
    deps?: string[],
    ver?: string | false,
    media?: string,
  ): void;
  function wpEnqueueScript(
    handle: string,
    src?: string,
    deps?: string[],
    ver?: string | false,
    inFooter?: boolean,
  ): void;
  function wpRegisterStyle(
    handle: string,
    src: string,
    deps?: string[],
    ver?: string | false,
    media?: string,
  ): boolean;
  function wpRegisterScript(
    handle: string,
    src: string,
    deps?: string[],
    ver?: string | false,
    inFooter?: boolean,
  ): boolean;
  function wpLocalizeScript(handle: string, objectName: string, data: Record<string, any>): boolean;

  // ---------------------------------------------------------------------------
  // Plugin Utilities
  // ---------------------------------------------------------------------------
  function pluginDirUrl(file: string): string;
  function pluginDirPath(file: string): string;
  function pluginBasename(file: string): string;

  // ---------------------------------------------------------------------------
  // i18n / Text Domain
  // ---------------------------------------------------------------------------
  function loadPluginTextdomain(
    domain: string,
    deprecated?: boolean,
    pluginRelPath?: string,
  ): boolean;

  // ---------------------------------------------------------------------------
  // i18n — Translation
  // ---------------------------------------------------------------------------
  function __(text: string, domain: string): string;
  function _e(text: string, domain: string): void;
  function _x(text: string, context: string, domain: string): string;
  function _ex(text: string, context: string, domain: string): void;
  function _n(single: string, plural: string, number: number, domain: string): string;
  function _nx(
    single: string,
    plural: string,
    number: number,
    context: string,
    domain: string,
  ): string;

  // ---------------------------------------------------------------------------
  // i18n — Escaped Translation
  // ---------------------------------------------------------------------------
  function escHtml__(text: string, domain: string): string;
  function escHtmlE(text: string, domain: string): void;
  function escHtmlX(text: string, context: string, domain: string): string;
  function escAttr__(text: string, domain: string): string;
  function escAttrE(text: string, domain: string): void;
  function escAttrX(text: string, context: string, domain: string): string;

  // ---------------------------------------------------------------------------
  // Settings API
  // ---------------------------------------------------------------------------
  function settingsFields(optionGroup: string): void;
  function doSettingsSections(page: string): void;
  function submitButton(
    text?: string,
    type?: string,
    name?: string,
    wrap?: boolean,
    otherAttributes?: Record<string, any>,
  ): void;
  function registerSetting(
    optionGroup: string,
    optionName: string,
    args?: Record<string, any>,
  ): void;
  function addSettingsSection(id: string, title: string, callback: () => void, page: string): void;
  function addSettingsField(
    id: string,
    title: string,
    callback: () => void,
    page: string,
    section?: string,
    args?: Record<string, any>,
  ): void;

  // ---------------------------------------------------------------------------
  // Admin Pages
  // ---------------------------------------------------------------------------
  function addMenuPage(
    pageTitle: string,
    menuTitle: string,
    capability: string,
    menuSlug: string,
    callback?: () => void,
    iconUrl?: string,
    position?: number,
  ): string;
  function addSubmenuPage(
    parentSlug: string,
    pageTitle: string,
    menuTitle: string,
    capability: string,
    menuSlug: string,
    callback?: () => void,
    position?: number,
  ): string | false;
  function addOptionsPage(
    pageTitle: string,
    menuTitle: string,
    capability: string,
    menuSlug: string,
    callback?: () => void,
    position?: number,
  ): string;

  // ---------------------------------------------------------------------------
  // Conditionals
  // ---------------------------------------------------------------------------
  function isSingle(post?: number | string | number[]): boolean;
  function isPage(page?: number | string | number[]): boolean;
  function isAdmin(): boolean;
  function isFrontPage(): boolean;
  function isHome(): boolean;
  function isArchive(): boolean;
  function isCategory(category?: number | string | number[]): boolean;
  function isTag(tag?: number | string | number[]): boolean;
  function isSingular(postTypes?: string | string[]): boolean;
  function isSearch(): boolean;
  function getSearchQuery(): string;
  function getQueriedObjectId(): number;

  // ---------------------------------------------------------------------------
  // User
  // ---------------------------------------------------------------------------
  function currentUserCan(capability: string, ...args: any[]): boolean;
  function getCurrentUserId(): number;
  function isUserLoggedIn(): boolean;
  function getUserBy(field: string, value: string | number): any;
  function getUsers(args?: Record<string, any>): any[];
  function usernameExists(username: string): number | false;
  function wpInsertUser(userdata: Record<string, any>): number | any;
  function wpGetCurrentUser(): any;
  function wpGeneratePassword(
    length?: number,
    specialChars?: boolean,
    extraSpecialChars?: boolean,
  ): string;
  function wpHashPassword(password: string): string;
  function wpCheckPassword(password: string, hash: string, userId?: number): boolean;
  function wpSetCurrentUser(id: number, name?: string): any;
  function getTheAuthorMeta(field: string, userId?: number): string;

  // ---------------------------------------------------------------------------
  // Nonces
  // ---------------------------------------------------------------------------
  function wpCreateNonce(action?: string): string;
  function wpVerifyNonce(nonce: string, action?: string): number | false;
  function wpNonceField(action?: string, name?: string, referer?: boolean, echo?: boolean): string;
  function checkAdminReferer(action?: string, queryArg?: string): number | false;

  // ---------------------------------------------------------------------------
  // Hooks
  // ---------------------------------------------------------------------------
  function addAction(
    hookName: string,
    callback: (...args: any[]) => void,
    priority?: number,
    acceptedArgs?: number,
  ): boolean;
  function addFilter(
    hookName: string,
    callback: (...args: any[]) => any,
    priority?: number,
    acceptedArgs?: number,
  ): boolean;
  function doAction(hookName: string, ...args: any[]): void;
  function applyFilters(hookName: string, value: any, ...args: any[]): any;
  function removeAction(
    hookName: string,
    callback: (...args: any[]) => void,
    priority?: number,
  ): boolean;
  function removeFilter(
    hookName: string,
    callback: (...args: any[]) => any,
    priority?: number,
  ): boolean;
  function addShortcode(
    tag: string,
    callback: (atts: Record<string, string>, content?: string) => string,
  ): void;

  // ---------------------------------------------------------------------------
  // Transients
  // ---------------------------------------------------------------------------
  function getTransient(key: string): any;
  function setTransient(key: string, value: any, expiration?: number): boolean;
  function deleteTransient(key: string): boolean;

  // ---------------------------------------------------------------------------
  // Posts
  // ---------------------------------------------------------------------------
  function getPost(postId?: number, output?: string, filter?: string): any;
  function getPostType(postId?: number): string | false;
  function getPosts(args?: Record<string, any>): any[];
  function wpGetPostParentId(postId?: number): number | false;
  function getTheId(): number | false;
  function getTheTitle(postId?: number): string;
  function getTheContent(moreLinkText?: string, stripTeaser?: boolean): string;
  function getPermalink(postId?: number, leavename?: boolean): string | false;
  function wpInsertPost(postarr: Record<string, any>, wpError?: boolean): number | any;
  function wpUpdatePost(postarr: Record<string, any>, wpError?: boolean): number | any;

  // ---------------------------------------------------------------------------
  // Metadata — Post
  // ---------------------------------------------------------------------------
  function getPostMeta(postId: number, key?: string, single?: boolean): any;
  function addPostMeta(
    postId: number,
    metaKey: string,
    metaValue: any,
    unique?: boolean,
  ): number | false;
  function updatePostMeta(
    postId: number,
    metaKey: string,
    metaValue: any,
    prevValue?: any,
  ): number | boolean;
  function deletePostMeta(postId: number, metaKey: string, metaValue?: any): boolean;

  // ---------------------------------------------------------------------------
  // Metadata — User
  // ---------------------------------------------------------------------------
  function getUserMeta(userId: number, key?: string, single?: boolean): any;
  function addUserMeta(
    userId: number,
    metaKey: string,
    metaValue: any,
    unique?: boolean,
  ): number | false;
  function updateUserMeta(
    userId: number,
    metaKey: string,
    metaValue: any,
    prevValue?: any,
  ): number | boolean;
  function deleteUserMeta(userId: number, metaKey: string, metaValue?: any): boolean;

  // ---------------------------------------------------------------------------
  // Metadata — Term
  // ---------------------------------------------------------------------------
  function getTermMeta(termId: number, key?: string, single?: boolean): any;
  function addTermMeta(
    termId: number,
    metaKey: string,
    metaValue: any,
    unique?: boolean,
  ): number | false;
  function updateTermMeta(
    termId: number,
    metaKey: string,
    metaValue: any,
    prevValue?: any,
  ): number | boolean;
  function deleteTermMeta(termId: number, metaKey: string, metaValue?: any): boolean;

  // ---------------------------------------------------------------------------
  // Metadata — Comment
  // ---------------------------------------------------------------------------
  function getCommentMeta(commentId: number, key?: string, single?: boolean): any;
  function addCommentMeta(
    commentId: number,
    metaKey: string,
    metaValue: any,
    unique?: boolean,
  ): number | false;
  function updateCommentMeta(
    commentId: number,
    metaKey: string,
    metaValue: any,
    prevValue?: any,
  ): number | boolean;
  function deleteCommentMeta(commentId: number, metaKey: string, metaValue?: any): boolean;

  // ---------------------------------------------------------------------------
  // Metadata — Generic
  // ---------------------------------------------------------------------------
  function getMetadata(metaType: string, objectId: number, metaKey?: string, single?: boolean): any;
  function addMetadata(
    metaType: string,
    objectId: number,
    metaKey: string,
    metaValue: any,
    unique?: boolean,
  ): number | false;
  function updateMetadata(
    metaType: string,
    objectId: number,
    metaKey: string,
    metaValue: any,
    prevValue?: any,
  ): number | boolean;
  function deleteMetadata(
    metaType: string,
    objectId: number,
    metaKey: string,
    metaValue?: any,
  ): boolean;

  // ---------------------------------------------------------------------------
  // HTTP API — Requests
  // ---------------------------------------------------------------------------
  function wpRemoteGet(url: string, args?: Record<string, any>): any;
  function wpRemotePost(url: string, args?: Record<string, any>): any;
  function wpRemoteHead(url: string, args?: Record<string, any>): any;
  function wpRemoteRequest(url: string, args?: Record<string, any>): any;

  // ---------------------------------------------------------------------------
  // HTTP API — Safe Requests
  // ---------------------------------------------------------------------------
  function wpSafeRemoteGet(url: string, args?: Record<string, any>): any;
  function wpSafeRemotePost(url: string, args?: Record<string, any>): any;
  function wpSafeRemoteHead(url: string, args?: Record<string, any>): any;
  function wpSafeRemoteRequest(url: string, args?: Record<string, any>): any;

  // ---------------------------------------------------------------------------
  // HTTP API — Response
  // ---------------------------------------------------------------------------
  function wpRemoteRetrieveBody(response: any): string;
  function wpRemoteRetrieveResponseCode(response: any): number | string;
  function wpRemoteRetrieveResponseMessage(response: any): string;
  function wpRemoteRetrieveHeader(response: any, header: string): string | string[];
  function wpRemoteRetrieveHeaders(response: any): any;
  function wpRemoteRetrieveCookies(response: any): any[];

  // ---------------------------------------------------------------------------
  // HTTP API — Error
  // ---------------------------------------------------------------------------
  function isWpError(thing: any): boolean;

  // ---------------------------------------------------------------------------
  // URLs
  // ---------------------------------------------------------------------------
  function adminUrl(path?: string, scheme?: string): string;
  function homeUrl(path?: string, scheme?: string): string;
  function siteUrl(path?: string, scheme?: string): string;
  function contentUrl(path?: string): string;
  function wpParseUrl(url: string, component?: number): any;

  // ---------------------------------------------------------------------------
  // WooCommerce — Conditionals
  // ---------------------------------------------------------------------------
  function isWoocommerce(): boolean;
  function isShop(): boolean;
  function isProduct(): boolean;
  function isCart(): boolean;
  function isCheckout(): boolean;
  function isAccountPage(): boolean;
  function isWcEndpointUrl(endpoint?: string): boolean;

  // ---------------------------------------------------------------------------
  // WooCommerce — Products
  // ---------------------------------------------------------------------------
  function wcGetProduct(productId: number | object): any;
  function wcGetProducts(args?: Record<string, any>): any[];
  function wcGetProductIdBySku(sku: string): number;

  // ---------------------------------------------------------------------------
  // WooCommerce — Orders
  // ---------------------------------------------------------------------------
  function wcGetOrder(orderId: number | object): any;
  function wcGetOrders(args?: Record<string, any>): any[];
  function wcCreateOrder(args?: Record<string, any>): any;

  // ---------------------------------------------------------------------------
  // WooCommerce — Formatting & Helpers
  // ---------------------------------------------------------------------------
  function wcPrice(price: number | string, args?: Record<string, any>): string;
  function wcClean(value: string | string[]): string | string[];
  function wcGetPageId(page: string): number;
  function wcGetPagePermalink(page: string): string;
  function wcGetEndpointUrl(endpoint: string, value?: string, permalink?: string): string;
  function wcGetCheckoutUrl(): string;
  function wcGetCartUrl(): string;

  // ---------------------------------------------------------------------------
  // WooCommerce — Customer
  // ---------------------------------------------------------------------------
  function wcCustomerBoughtProduct(
    customerEmail: string,
    userId: number,
    productId: number,
  ): boolean;
  function wcGetCustomerOrderCount(userId: number): number;

  // ---------------------------------------------------------------------------
  // WooCommerce — Notices
  // ---------------------------------------------------------------------------
  function wcAddNotice(message: string, noticeType?: string, data?: Record<string, any>): void;
  function wcPrintNotices(noticeType?: string): void;
  function wcHasNotice(message: string, noticeType?: string): boolean;

  // ---------------------------------------------------------------------------
  // WooCommerce — Taxonomy/Attributes
  // ---------------------------------------------------------------------------
  function wcGetAttributeTaxonomies(): any[];
  function wcGetProductTerms(
    productId: number,
    attribute: string,
    args?: Record<string, any>,
  ): any[];

  // ---------------------------------------------------------------------------
  // WooCommerce — Templates
  // ---------------------------------------------------------------------------
  function wcGetTemplatePart(slug: string, name?: string): void;
  function wcGetTemplate(
    templateName: string,
    args?: Record<string, any>,
    templatePath?: string,
    defaultPath?: string,
  ): void;

  // ---------------------------------------------------------------------------
  // REST API
  // ---------------------------------------------------------------------------
  function restEnsureResponse(response: any): any;

  // ---------------------------------------------------------------------------
  // Utility
  // ---------------------------------------------------------------------------
  function wpRand(min?: number, max?: number): number;

  // ---------------------------------------------------------------------------
  // PHP Built-ins (for JWT / encoding)
  // ---------------------------------------------------------------------------
  function jsonEncode(value: any, options?: number, depth?: number): string;
  function jsonDecode(json: string, assoc?: boolean, depth?: number, options?: number): any;
  function base64Encode(data: string): string;
  function base64Decode(data: string, strict?: boolean): string;
  function hash(algo: string, data: string, rawOutput?: boolean): string;
  function hashHmac(algo: string, data: string, key: string, rawOutput?: boolean): string;
  function hashEquals(knownString: string, userString: string): boolean;
  function uniqid(prefix?: string, moreEntropy?: boolean): string;

  // ---------------------------------------------------------------------------
  // PHP Built-ins (date/time)
  // ---------------------------------------------------------------------------
  function gmdate(format: string, timestamp?: number): string;

  // ---------------------------------------------------------------------------
  // PHP Built-ins (general)
  // ---------------------------------------------------------------------------
  function classExists(className: string): boolean;
  function functionExists(functionName: string): boolean;
  function md5(str: string): string;
  function intval(value: any): number;
  function strval(value: any): string;
  function strtolower(str: string): string;
  function strtr(str: string, from: string, to: string): string;
  function rtrim(str: string, chars?: string): string;
  function time(): number;
  function getallheaders(): Record<string, string>;
  function header(headerStr: string): void;
  function isArray(value: any): boolean;
  function numberFormat(
    number: number,
    decimals?: number,
    decPoint?: string,
    thousandsSep?: string,
  ): string;
  function levenshtein(s1: string, s2: string): number;
  function arrayUnique(arr: any[]): any[];
  function arrayValues(arr: any[]): any[];

  // ---------------------------------------------------------------------------
  // Misc
  // ---------------------------------------------------------------------------
  function wpDie(message?: string, title?: string, args?: Record<string, any>): never;
  function wpRedirect(location: string, status?: number, xRedirectBy?: string): boolean;
  function wpSafeRedirect(location: string, status?: number, xRedirectBy?: string): boolean;
  function wpSendJson(response: any, statusCode?: number): never;
  function wpSendJsonSuccess(data?: any, statusCode?: number): never;
  function wpSendJsonError(data?: any, statusCode?: number): never;
  function absint(value: any): number;
  function wpUnslash(value: string | string[]): string | string[];

  // ---------------------------------------------------------------------------
  // Custom Post Types & Taxonomies
  // ---------------------------------------------------------------------------
  function registerPostType(postType: string, args?: Record<string, any>): any;
  function registerTaxonomy(
    taxonomy: string,
    objectType: string | string[],
    args?: Record<string, any>,
  ): any;
  function wpDeletePost(postId: number, forceDelete?: boolean): any;
  function wpCountPosts(type?: string, perm?: string): Record<string, number>;

  // ---------------------------------------------------------------------------
  // Database
  // ---------------------------------------------------------------------------
  function dbDelta(queries: string | string[], execute?: boolean): any[];
  function requireOnce(file: string): void;

  /** WordPress ABSPATH constant — path to WordPress installation directory. */
  const ABSPATH: string;

  /** WordPress database object ($wpdb). Use wpdb.prepare(), wpdb.query(), wpdb.getResults(), etc. */
  var wpdb: {
    prefix: string;
    posts: string;
    postmeta: string;
    terms: string;
    term_taxonomy: string;
    term_relationships: string;
    prepare(query: string, ...args: any[]): string;
    query(query: string): number | false;
    getResults(query: string, output?: string): any[];
    getRow(query: string, output?: string, y?: number): any;
    getVar(query: string, x?: number, y?: number): string | null;
    getCol(query: string, x?: number): string[];
    insert(table: string, data: Record<string, any>, format?: string[]): number | false;
    update(
      table: string,
      data: Record<string, any>,
      where: Record<string, any>,
      format?: string[],
      whereFormat?: string[],
    ): number | false;
    delete(table: string, where: Record<string, any>, whereFormat?: string[]): number | false;
    replace(table: string, data: Record<string, any>, format?: string[]): number | false;
    escLike(text: string): string;
    getCharsetCollate(): string;
    lastError: string;
    insertId: number;
    numRows: number;
  };

  // ---------------------------------------------------------------------------
  // Content
  // ---------------------------------------------------------------------------
  function wpStripAllTags(str: string, removeBreaks?: boolean): string;

  // ---------------------------------------------------------------------------
  // Media
  // ---------------------------------------------------------------------------
  function wpGetAttachmentImageSrc(
    attachmentId: number,
    size?: string | number[],
    iconForMimeType?: boolean,
  ): any[] | false;
  function wpGetAttachmentUrl(attachmentId: number): string | false;

  // ---------------------------------------------------------------------------
  // Cron / Scheduling
  // ---------------------------------------------------------------------------
  function wpScheduleSingleEvent(timestamp: number, hook: string, args?: any[]): boolean;
  function wpScheduleEvent(timestamp: number, recurrence: string, hook: string, args?: any[]): boolean;
  function wpNextScheduled(hook: string, args?: any[]): number | false;
  function wpUnscheduleEvent(timestamp: number, hook: string, args?: any[]): boolean;
  function wpClearScheduledHook(hook: string, args?: any[]): number | false;

  // ---------------------------------------------------------------------------
  // Taxonomy
  // ---------------------------------------------------------------------------
  function getTerms(args?: Record<string, any>): any[];
  function wpGetObjectTerms(
    objectIds: number | number[],
    taxonomies: string | string[],
    args?: Record<string, any>,
  ): any[];
  function getTheTerms(post: number | any, taxonomy: string): any[] | false;

  // ---------------------------------------------------------------------------
  // AJAX
  // ---------------------------------------------------------------------------
  function checkAjaxReferer(action?: string, queryArg?: string, die?: boolean): number | false;
  var $_POST: Record<string, any>;
  var $_GET: Record<string, any>;
  var $_REQUEST: Record<string, any>;
  var $_SERVER: Record<string, any>;

  // ---------------------------------------------------------------------------
  // WordPress Classes
  // ---------------------------------------------------------------------------
  var WP_Error: any;
}

export type WPGlobals = true;
