/**
 * WordPress API ambient type declarations for wpts.
 *
 * These declarations provide autocompletion and type checking when writing
 * plugin source files (.ts). They are NOT executed at runtime — the transpiler
 * maps each camelCase function to its snake_case PHP equivalent.
 *
 * Usage: These are automatically available in wpts projects. No import needed.
 */

// ---------------------------------------------------------------------------
// Options API
// ---------------------------------------------------------------------------
declare function addOption(key: string, value: any, deprecated?: string, autoload?: boolean): boolean;
declare function getOption(key: string, defaultValue?: any): any;
declare function updateOption(key: string, value: any, autoload?: boolean): boolean;
declare function deleteOption(key: string): boolean;

// ---------------------------------------------------------------------------
// Escaping
// ---------------------------------------------------------------------------
declare function escHtml(text: string): string;
declare function escAttr(text: string): string;
declare function escUrl(url: string, protocols?: string[]): string;
declare function escJs(text: string): string;
declare function escTextarea(text: string): string;
declare function wpKses(content: string, allowedHtml: Record<string, any>, allowedProtocols?: string[]): string;
declare function wpKsesPost(content: string): string;

// ---------------------------------------------------------------------------
// Sanitization
// ---------------------------------------------------------------------------
declare function sanitizeTextField(str: string): string;
declare function sanitizeTextareaField(str: string): string;
declare function sanitizeTitle(title: string, fallbackTitle?: string, context?: string): string;
declare function sanitizeEmail(email: string): string;
declare function sanitizeFileName(filename: string): string;
declare function sanitizeKey(key: string): string;

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------
declare function echo(output: string): void;

// ---------------------------------------------------------------------------
// Enqueueing
// ---------------------------------------------------------------------------
declare function wpEnqueueStyle(handle: string, src?: string, deps?: string[], ver?: string | false, media?: string): void;
declare function wpEnqueueScript(handle: string, src?: string, deps?: string[], ver?: string | false, inFooter?: boolean): void;
declare function wpRegisterStyle(handle: string, src: string, deps?: string[], ver?: string | false, media?: string): boolean;
declare function wpRegisterScript(handle: string, src: string, deps?: string[], ver?: string | false, inFooter?: boolean): boolean;
declare function wpLocalizeScript(handle: string, objectName: string, data: Record<string, any>): boolean;

// ---------------------------------------------------------------------------
// Plugin Utilities
// ---------------------------------------------------------------------------
declare function pluginDirUrl(file: string): string;
declare function pluginDirPath(file: string): string;
declare function pluginBasename(file: string): string;

// ---------------------------------------------------------------------------
// i18n / Text Domain
// ---------------------------------------------------------------------------
declare function loadPluginTextdomain(domain: string, deprecated?: boolean, pluginRelPath?: string): boolean;

// ---------------------------------------------------------------------------
// i18n — Translation
// ---------------------------------------------------------------------------
declare function __(text: string, domain: string): string;
declare function _e(text: string, domain: string): void;
declare function _x(text: string, context: string, domain: string): string;
declare function _ex(text: string, context: string, domain: string): void;
declare function _n(single: string, plural: string, number: number, domain: string): string;
declare function _nx(single: string, plural: string, number: number, context: string, domain: string): string;

// ---------------------------------------------------------------------------
// i18n — Escaped Translation
// ---------------------------------------------------------------------------
declare function escHtml__(text: string, domain: string): string;
declare function escHtmlE(text: string, domain: string): void;
declare function escHtmlX(text: string, context: string, domain: string): string;
declare function escAttr__(text: string, domain: string): string;
declare function escAttrE(text: string, domain: string): void;
declare function escAttrX(text: string, context: string, domain: string): string;

// ---------------------------------------------------------------------------
// Settings API
// ---------------------------------------------------------------------------
declare function settingsFields(optionGroup: string): void;
declare function doSettingsSections(page: string): void;
declare function submitButton(text?: string, type?: string, name?: string, wrap?: boolean, otherAttributes?: Record<string, any>): void;
declare function registerSetting(optionGroup: string, optionName: string, args?: Record<string, any>): void;
declare function addSettingsSection(id: string, title: string, callback: () => void, page: string): void;
declare function addSettingsField(id: string, title: string, callback: () => void, page: string, section?: string, args?: Record<string, any>): void;

// ---------------------------------------------------------------------------
// Admin Pages
// ---------------------------------------------------------------------------
declare function addMenuPage(pageTitle: string, menuTitle: string, capability: string, menuSlug: string, callback?: () => void, iconUrl?: string, position?: number): string;
declare function addSubmenuPage(parentSlug: string, pageTitle: string, menuTitle: string, capability: string, menuSlug: string, callback?: () => void, position?: number): string | false;
declare function addOptionsPage(pageTitle: string, menuTitle: string, capability: string, menuSlug: string, callback?: () => void, position?: number): string;

// ---------------------------------------------------------------------------
// Conditionals
// ---------------------------------------------------------------------------
declare function isSingle(post?: number | string | number[]): boolean;
declare function isPage(page?: number | string | number[]): boolean;
declare function isAdmin(): boolean;
declare function isFrontPage(): boolean;
declare function isHome(): boolean;
declare function isArchive(): boolean;
declare function isCategory(category?: number | string | number[]): boolean;
declare function isTag(tag?: number | string | number[]): boolean;
declare function isSingular(postTypes?: string | string[]): boolean;

// ---------------------------------------------------------------------------
// User
// ---------------------------------------------------------------------------
declare function currentUserCan(capability: string, ...args: any[]): boolean;
declare function getCurrentUserId(): number;
declare function isUserLoggedIn(): boolean;

// ---------------------------------------------------------------------------
// Nonces
// ---------------------------------------------------------------------------
declare function wpCreateNonce(action?: string): string;
declare function wpVerifyNonce(nonce: string, action?: string): number | false;
declare function wpNonceField(action?: string, name?: string, referer?: boolean, echo?: boolean): string;
declare function checkAdminReferer(action?: string, queryArg?: string): number | false;

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------
declare function addAction(hookName: string, callback: (...args: any[]) => void, priority?: number, acceptedArgs?: number): boolean;
declare function addFilter(hookName: string, callback: (...args: any[]) => any, priority?: number, acceptedArgs?: number): boolean;
declare function doAction(hookName: string, ...args: any[]): void;
declare function applyFilters(hookName: string, value: any, ...args: any[]): any;
declare function removeAction(hookName: string, callback: (...args: any[]) => void, priority?: number): boolean;
declare function removeFilter(hookName: string, callback: (...args: any[]) => any, priority?: number): boolean;
declare function addShortcode(tag: string, callback: (atts: Record<string, string>, content?: string) => string): void;

// ---------------------------------------------------------------------------
// Transients
// ---------------------------------------------------------------------------
declare function getTransient(key: string): any;
declare function setTransient(key: string, value: any, expiration?: number): boolean;
declare function deleteTransient(key: string): boolean;

// ---------------------------------------------------------------------------
// Posts
// ---------------------------------------------------------------------------
declare function getPost(postId?: number, output?: string, filter?: string): any;
declare function getPosts(args?: Record<string, any>): any[];
declare function getTheId(): number | false;
declare function getTheTitle(postId?: number): string;
declare function getTheContent(moreLinkText?: string, stripTeaser?: boolean): string;
declare function getPermalink(postId?: number, leavename?: boolean): string | false;

// ---------------------------------------------------------------------------
// Metadata — Post
// ---------------------------------------------------------------------------
declare function getPostMeta(postId: number, key?: string, single?: boolean): any;
declare function addPostMeta(postId: number, metaKey: string, metaValue: any, unique?: boolean): number | false;
declare function updatePostMeta(postId: number, metaKey: string, metaValue: any, prevValue?: any): number | boolean;
declare function deletePostMeta(postId: number, metaKey: string, metaValue?: any): boolean;

// ---------------------------------------------------------------------------
// Metadata — User
// ---------------------------------------------------------------------------
declare function getUserMeta(userId: number, key?: string, single?: boolean): any;
declare function addUserMeta(userId: number, metaKey: string, metaValue: any, unique?: boolean): number | false;
declare function updateUserMeta(userId: number, metaKey: string, metaValue: any, prevValue?: any): number | boolean;
declare function deleteUserMeta(userId: number, metaKey: string, metaValue?: any): boolean;

// ---------------------------------------------------------------------------
// Metadata — Term
// ---------------------------------------------------------------------------
declare function getTermMeta(termId: number, key?: string, single?: boolean): any;
declare function addTermMeta(termId: number, metaKey: string, metaValue: any, unique?: boolean): number | false;
declare function updateTermMeta(termId: number, metaKey: string, metaValue: any, prevValue?: any): number | boolean;
declare function deleteTermMeta(termId: number, metaKey: string, metaValue?: any): boolean;

// ---------------------------------------------------------------------------
// Metadata — Comment
// ---------------------------------------------------------------------------
declare function getCommentMeta(commentId: number, key?: string, single?: boolean): any;
declare function addCommentMeta(commentId: number, metaKey: string, metaValue: any, unique?: boolean): number | false;
declare function updateCommentMeta(commentId: number, metaKey: string, metaValue: any, prevValue?: any): number | boolean;
declare function deleteCommentMeta(commentId: number, metaKey: string, metaValue?: any): boolean;

// ---------------------------------------------------------------------------
// Metadata — Generic
// ---------------------------------------------------------------------------
declare function getMetadata(metaType: string, objectId: number, metaKey?: string, single?: boolean): any;
declare function addMetadata(metaType: string, objectId: number, metaKey: string, metaValue: any, unique?: boolean): number | false;
declare function updateMetadata(metaType: string, objectId: number, metaKey: string, metaValue: any, prevValue?: any): number | boolean;
declare function deleteMetadata(metaType: string, objectId: number, metaKey: string, metaValue?: any): boolean;

// ---------------------------------------------------------------------------
// HTTP API — Requests
// ---------------------------------------------------------------------------
declare function wpRemoteGet(url: string, args?: Record<string, any>): any;
declare function wpRemotePost(url: string, args?: Record<string, any>): any;
declare function wpRemoteHead(url: string, args?: Record<string, any>): any;
declare function wpRemoteRequest(url: string, args?: Record<string, any>): any;

// ---------------------------------------------------------------------------
// HTTP API — Safe Requests
// ---------------------------------------------------------------------------
declare function wpSafeRemoteGet(url: string, args?: Record<string, any>): any;
declare function wpSafeRemotePost(url: string, args?: Record<string, any>): any;
declare function wpSafeRemoteHead(url: string, args?: Record<string, any>): any;
declare function wpSafeRemoteRequest(url: string, args?: Record<string, any>): any;

// ---------------------------------------------------------------------------
// HTTP API — Response
// ---------------------------------------------------------------------------
declare function wpRemoteRetrieveBody(response: any): string;
declare function wpRemoteRetrieveResponseCode(response: any): number | string;
declare function wpRemoteRetrieveResponseMessage(response: any): string;
declare function wpRemoteRetrieveHeader(response: any, header: string): string | string[];
declare function wpRemoteRetrieveHeaders(response: any): any;
declare function wpRemoteRetrieveCookies(response: any): any[];

// ---------------------------------------------------------------------------
// HTTP API — Error
// ---------------------------------------------------------------------------
declare function isWpError(thing: any): boolean;

// ---------------------------------------------------------------------------
// URLs
// ---------------------------------------------------------------------------
declare function adminUrl(path?: string, scheme?: string): string;
declare function homeUrl(path?: string, scheme?: string): string;
declare function siteUrl(path?: string, scheme?: string): string;
declare function contentUrl(path?: string): string;

// ---------------------------------------------------------------------------
// WooCommerce — Conditionals
// ---------------------------------------------------------------------------
declare function isWoocommerce(): boolean;
declare function isShop(): boolean;
declare function isProduct(): boolean;
declare function isCart(): boolean;
declare function isCheckout(): boolean;
declare function isAccountPage(): boolean;
declare function isWcEndpointUrl(endpoint?: string): boolean;

// ---------------------------------------------------------------------------
// WooCommerce — Products
// ---------------------------------------------------------------------------
declare function wcGetProduct(productId: number | object): any;
declare function wcGetProducts(args?: Record<string, any>): any[];
declare function wcGetProductIdBySku(sku: string): number;

// ---------------------------------------------------------------------------
// WooCommerce — Orders
// ---------------------------------------------------------------------------
declare function wcGetOrder(orderId: number | object): any;
declare function wcGetOrders(args?: Record<string, any>): any[];
declare function wcCreateOrder(args?: Record<string, any>): any;

// ---------------------------------------------------------------------------
// WooCommerce — Formatting & Helpers
// ---------------------------------------------------------------------------
declare function wcPrice(price: number | string, args?: Record<string, any>): string;
declare function wcClean(value: string | string[]): string | string[];
declare function wcGetPageId(page: string): number;
declare function wcGetPagePermalink(page: string): string;
declare function wcGetEndpointUrl(endpoint: string, value?: string, permalink?: string): string;
declare function wcGetCheckoutUrl(): string;
declare function wcGetCartUrl(): string;

// ---------------------------------------------------------------------------
// WooCommerce — Customer
// ---------------------------------------------------------------------------
declare function wcCustomerBoughtProduct(customerEmail: string, userId: number, productId: number): boolean;
declare function wcGetCustomerOrderCount(userId: number): number;

// ---------------------------------------------------------------------------
// WooCommerce — Notices
// ---------------------------------------------------------------------------
declare function wcAddNotice(message: string, noticeType?: string, data?: Record<string, any>): void;
declare function wcPrintNotices(noticeType?: string): void;
declare function wcHasNotice(message: string, noticeType?: string): boolean;

// ---------------------------------------------------------------------------
// WooCommerce — Taxonomy/Attributes
// ---------------------------------------------------------------------------
declare function wcGetAttributeTaxonomies(): any[];
declare function wcGetProductTerms(productId: number, attribute: string, args?: Record<string, any>): any[];

// ---------------------------------------------------------------------------
// WooCommerce — Templates
// ---------------------------------------------------------------------------
declare function wcGetTemplatePart(slug: string, name?: string): void;
declare function wcGetTemplate(templateName: string, args?: Record<string, any>, templatePath?: string, defaultPath?: string): void;

// ---------------------------------------------------------------------------
// Misc
// ---------------------------------------------------------------------------
declare function wpDie(message?: string, title?: string, args?: Record<string, any>): never;
declare function wpRedirect(location: string, status?: number, xRedirectBy?: string): boolean;
declare function wpSafeRedirect(location: string, status?: number, xRedirectBy?: string): boolean;
declare function wpSendJson(response: any, statusCode?: number): never;
declare function wpSendJsonSuccess(data?: any, statusCode?: number): never;
declare function wpSendJsonError(data?: any, statusCode?: number): never;
declare function absint(value: any): number;
declare function wpUnslash(value: string | string[]): string | string[];

// ---------------------------------------------------------------------------
// Custom Post Types & Taxonomies
// ---------------------------------------------------------------------------
declare function registerPostType(postType: string, args?: Record<string, any>): any;
declare function registerTaxonomy(taxonomy: string, objectType: string | string[], args?: Record<string, any>): any;
declare function wpDeletePost(postId: number, forceDelete?: boolean): any;
declare function wpCountPosts(type?: string, perm?: string): Record<string, number>;

// ---------------------------------------------------------------------------
// AJAX
// ---------------------------------------------------------------------------
declare function checkAjaxReferer(action?: string, queryArg?: string, die?: boolean): number | false;
declare var $_POST: Record<string, any>;
declare var $_GET: Record<string, any>;
declare var $_REQUEST: Record<string, any>;
