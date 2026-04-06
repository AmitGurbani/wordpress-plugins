import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { parseSourceString } from '../../../src/compiler/parser.js';
import { transpileExpression } from '../../../src/transpiler/expression-transpiler.js';

/**
 * Helper: parse a TS expression and transpile it to PHP.
 */
function transpile(expr: string, context: string = ''): string {
  // Wrap expression in a function to make it parseable
  const source = `${context}\nconst __result = ${expr};`;
  const { sourceFile, typeChecker } = parseSourceString(source);

  // Find the variable declaration initializer
  let result = '';
  ts.forEachChild(sourceFile, (node) => {
    if (ts.isVariableStatement(node)) {
      const decl = node.declarationList.declarations[0];
      if (decl.initializer) {
        result = transpileExpression(decl.initializer, typeChecker);
      }
    }
  });
  return result;
}

describe('transpileExpression', () => {
  describe('literals', () => {
    it('transpiles string literals', () => {
      expect(transpile('"hello"')).toBe("'hello'");
    });

    it('transpiles number literals', () => {
      expect(transpile('42')).toBe('42');
    });

    it('transpiles boolean true', () => {
      expect(transpile('true')).toBe('true');
    });

    it('transpiles boolean false', () => {
      expect(transpile('false')).toBe('false');
    });

    it('transpiles null', () => {
      expect(transpile('null')).toBe('null');
    });
  });

  describe('identifiers', () => {
    it('adds $ prefix to variables', () => {
      expect(transpile('x', 'const x = 1;')).toBe('$x');
    });

    it('maps undefined to null', () => {
      expect(transpile('undefined')).toBe('null');
    });

    it('emits ABSPATH as PHP constant (not $abspath)', () => {
      expect(transpile('ABSPATH')).toBe('ABSPATH');
    });
  });

  describe('binary expressions', () => {
    it('transpiles numeric addition', () => {
      const result = transpile('1 + 2');
      expect(result).toBe('1 + 2');
    });

    it('transpiles string concatenation with +', () => {
      expect(transpile('"hello" + " world"')).toBe("'hello' . ' world'");
    });

    it('transpiles strict equality', () => {
      expect(transpile('1 === 2')).toBe('1 === 2');
    });

    it('transpiles strict inequality', () => {
      expect(transpile('1 !== 2')).toBe('1 !== 2');
    });

    it('transpiles logical AND', () => {
      expect(transpile('true && false')).toBe('true && false');
    });

    it('transpiles logical OR', () => {
      expect(transpile('true || false')).toBe('true || false');
    });

    it('transpiles nullish coalescing', () => {
      expect(transpile('null ?? "default"')).toBe("null ?? 'default'");
    });

    it('transpiles comparison operators', () => {
      expect(transpile('1 < 2')).toBe('1 < 2');
      expect(transpile('1 > 2')).toBe('1 > 2');
      expect(transpile('1 <= 2')).toBe('1 <= 2');
      expect(transpile('1 >= 2')).toBe('1 >= 2');
    });
  });

  describe('unary expressions', () => {
    it('transpiles negation with WP spacing', () => {
      expect(transpile('!true')).toBe('! true');
    });

    it('transpiles numeric negation', () => {
      expect(transpile('-1')).toBe('-1');
    });
  });

  describe('call expressions', () => {
    it('maps WordPress API calls', () => {
      expect(
        transpile(
          'getOption("key", "default")',
          'declare function getOption(k: string, d?: any): any;',
        ),
      ).toBe("get_option( 'key', 'default' )");
    });

    it('maps post management functions', () => {
      expect(
        transpile(
          'wpInsertPost({ post_type: "pos_session", post_status: "publish" })',
          'declare function wpInsertPost(p: Record<string, any>, e?: boolean): number | any;',
        ),
      ).toBe("wp_insert_post( array( 'post_type' => 'pos_session', 'post_status' => 'publish' ) )");
      expect(
        transpile(
          'wpUpdatePost({ ID: 1, post_title: "Updated" })',
          'declare function wpUpdatePost(p: Record<string, any>, e?: boolean): number | any;',
        ),
      ).toBe("wp_update_post( array( 'ID' => 1, 'post_title' => 'Updated' ) )");
    });

    it('maps cron scheduling functions', () => {
      expect(
        transpile(
          'wpScheduleEvent(time(), "daily", "my_hook")',
          'declare function wpScheduleEvent(t: number, r: string, h: string, a?: any[]): boolean; declare function time(): number;',
        ),
      ).toBe("wp_schedule_event( time(), 'daily', 'my_hook' )");
      expect(
        transpile(
          'wpClearScheduledHook("my_hook")',
          'declare function wpClearScheduledHook(h: string, a?: any[]): number | false;',
        ),
      ).toBe("wp_clear_scheduled_hook( 'my_hook' )");
    });

    it('maps gmdate function', () => {
      expect(
        transpile(
          'gmdate("c", time())',
          'declare function gmdate(f: string, t?: number): string; declare function time(): number;',
        ),
      ).toBe("gmdate( 'c', time() )");
    });

    it('maps PHP built-in isArray', () => {
      expect(
        transpile(
          'isArray(value)',
          'declare function isArray(v: any): boolean; declare const value: any;',
        ),
      ).toBe('is_array( $value )');
    });

    it('maps i18n translation functions', () => {
      expect(
        transpile('__("Hello", "my-plugin")', 'declare function __(t: string, d: string): string;'),
      ).toBe("__( 'Hello', 'my-plugin' )");
      expect(
        transpile('_e("Hello", "my-plugin")', 'declare function _e(t: string, d: string): void;'),
      ).toBe("_e( 'Hello', 'my-plugin' )");
      expect(
        transpile(
          '_x("Post", "noun", "my-plugin")',
          'declare function _x(t: string, c: string, d: string): string;',
        ),
      ).toBe("_x( 'Post', 'noun', 'my-plugin' )");
      expect(
        transpile(
          '_ex("Post", "noun", "my-plugin")',
          'declare function _ex(t: string, c: string, d: string): void;',
        ),
      ).toBe("_ex( 'Post', 'noun', 'my-plugin' )");
      expect(
        transpile(
          '_n("item", "items", count, "my-plugin")',
          'declare function _n(s: string, p: string, n: number, d: string): string; const count = 5;',
        ),
      ).toBe("_n( 'item', 'items', $count, 'my-plugin' )");
      expect(
        transpile(
          '_nx("item", "items", count, "context", "my-plugin")',
          'declare function _nx(s: string, p: string, n: number, c: string, d: string): string; const count = 5;',
        ),
      ).toBe("_nx( 'item', 'items', $count, 'context', 'my-plugin' )");
    });

    it('maps escaped i18n functions', () => {
      expect(
        transpile(
          'escHtml__("Hello", "my-plugin")',
          'declare function escHtml__(t: string, d: string): string;',
        ),
      ).toBe("esc_html__( 'Hello', 'my-plugin' )");
      expect(
        transpile(
          'escHtmlE("Hello", "my-plugin")',
          'declare function escHtmlE(t: string, d: string): void;',
        ),
      ).toBe("esc_html_e( 'Hello', 'my-plugin' )");
      expect(
        transpile(
          'escHtmlX("Post", "noun", "my-plugin")',
          'declare function escHtmlX(t: string, c: string, d: string): string;',
        ),
      ).toBe("esc_html_x( 'Post', 'noun', 'my-plugin' )");
      expect(
        transpile(
          'escAttr__("Hello", "my-plugin")',
          'declare function escAttr__(t: string, d: string): string;',
        ),
      ).toBe("esc_attr__( 'Hello', 'my-plugin' )");
      expect(
        transpile(
          'escAttrE("Hello", "my-plugin")',
          'declare function escAttrE(t: string, d: string): void;',
        ),
      ).toBe("esc_attr_e( 'Hello', 'my-plugin' )");
      expect(
        transpile(
          'escAttrX("Post", "noun", "my-plugin")',
          'declare function escAttrX(t: string, c: string, d: string): string;',
        ),
      ).toBe("esc_attr_x( 'Post', 'noun', 'my-plugin' )");
    });

    it('maps post and user metadata functions', () => {
      expect(
        transpile(
          'getPostMeta(1, "color", true)',
          'declare function getPostMeta(p: number, k?: string, s?: boolean): any;',
        ),
      ).toBe("get_post_meta( 1, 'color', true )");
      expect(
        transpile(
          'addPostMeta(1, "color", "red")',
          'declare function addPostMeta(p: number, k: string, v: any): any;',
        ),
      ).toBe("add_post_meta( 1, 'color', 'red' )");
      expect(
        transpile(
          'updatePostMeta(1, "color", "blue")',
          'declare function updatePostMeta(p: number, k: string, v: any): any;',
        ),
      ).toBe("update_post_meta( 1, 'color', 'blue' )");
      expect(
        transpile(
          'deletePostMeta(1, "color")',
          'declare function deletePostMeta(p: number, k: string): boolean;',
        ),
      ).toBe("delete_post_meta( 1, 'color' )");
      expect(
        transpile(
          'getUserMeta(5, "nickname", true)',
          'declare function getUserMeta(u: number, k?: string, s?: boolean): any;',
        ),
      ).toBe("get_user_meta( 5, 'nickname', true )");
      expect(
        transpile(
          'addUserMeta(5, "nickname", "joe")',
          'declare function addUserMeta(u: number, k: string, v: any): any;',
        ),
      ).toBe("add_user_meta( 5, 'nickname', 'joe' )");
      expect(
        transpile(
          'updateUserMeta(5, "nickname", "jane")',
          'declare function updateUserMeta(u: number, k: string, v: any): any;',
        ),
      ).toBe("update_user_meta( 5, 'nickname', 'jane' )");
      expect(
        transpile(
          'deleteUserMeta(5, "nickname")',
          'declare function deleteUserMeta(u: number, k: string): boolean;',
        ),
      ).toBe("delete_user_meta( 5, 'nickname' )");
    });

    it('maps post parent function', () => {
      expect(
        transpile(
          'wpGetPostParentId(42)',
          'declare function wpGetPostParentId(p?: number): number | false;',
        ),
      ).toBe('wp_get_post_parent_id( 42 )');
    });

    it('maps term, comment, and generic metadata functions', () => {
      expect(
        transpile(
          'getTermMeta(3, "icon", true)',
          'declare function getTermMeta(t: number, k?: string, s?: boolean): any;',
        ),
      ).toBe("get_term_meta( 3, 'icon', true )");
      expect(
        transpile(
          'addTermMeta(3, "icon", "star")',
          'declare function addTermMeta(t: number, k: string, v: any): any;',
        ),
      ).toBe("add_term_meta( 3, 'icon', 'star' )");
      expect(
        transpile(
          'updateTermMeta(3, "icon", "heart")',
          'declare function updateTermMeta(t: number, k: string, v: any): any;',
        ),
      ).toBe("update_term_meta( 3, 'icon', 'heart' )");
      expect(
        transpile(
          'deleteTermMeta(3, "icon")',
          'declare function deleteTermMeta(t: number, k: string): boolean;',
        ),
      ).toBe("delete_term_meta( 3, 'icon' )");
      expect(
        transpile(
          'getCommentMeta(7, "rating", true)',
          'declare function getCommentMeta(c: number, k?: string, s?: boolean): any;',
        ),
      ).toBe("get_comment_meta( 7, 'rating', true )");
      expect(
        transpile(
          'addCommentMeta(7, "rating", 5)',
          'declare function addCommentMeta(c: number, k: string, v: any): any;',
        ),
      ).toBe("add_comment_meta( 7, 'rating', 5 )");
      expect(
        transpile(
          'updateCommentMeta(7, "rating", 4)',
          'declare function updateCommentMeta(c: number, k: string, v: any): any;',
        ),
      ).toBe("update_comment_meta( 7, 'rating', 4 )");
      expect(
        transpile(
          'deleteCommentMeta(7, "rating")',
          'declare function deleteCommentMeta(c: number, k: string): boolean;',
        ),
      ).toBe("delete_comment_meta( 7, 'rating' )");
      expect(
        transpile(
          'getMetadata("post", 1, "key", true)',
          'declare function getMetadata(t: string, o: number, k?: string, s?: boolean): any;',
        ),
      ).toBe("get_metadata( 'post', 1, 'key', true )");
      expect(
        transpile(
          'addMetadata("post", 1, "key", "val")',
          'declare function addMetadata(t: string, o: number, k: string, v: any): any;',
        ),
      ).toBe("add_metadata( 'post', 1, 'key', 'val' )");
      expect(
        transpile(
          'updateMetadata("post", 1, "key", "val")',
          'declare function updateMetadata(t: string, o: number, k: string, v: any): any;',
        ),
      ).toBe("update_metadata( 'post', 1, 'key', 'val' )");
      expect(
        transpile(
          'deleteMetadata("post", 1, "key")',
          'declare function deleteMetadata(t: string, o: number, k: string): boolean;',
        ),
      ).toBe("delete_metadata( 'post', 1, 'key' )");
    });

    it('maps URL parsing functions', () => {
      expect(
        transpile(
          'wpParseUrl("https://example.com/path")',
          'declare function wpParseUrl(u: string, c?: number): any;',
        ),
      ).toBe("wp_parse_url( 'https://example.com/path' )");
    });

    it('maps HTTP API request functions', () => {
      expect(
        transpile(
          'wpRemoteGet("https://api.example.com")',
          'declare function wpRemoteGet(u: string, a?: any): any;',
        ),
      ).toBe("wp_remote_get( 'https://api.example.com' )");
      expect(
        transpile(
          'wpRemotePost("https://api.example.com")',
          'declare function wpRemotePost(u: string, a?: any): any;',
        ),
      ).toBe("wp_remote_post( 'https://api.example.com' )");
      expect(
        transpile(
          'wpRemoteHead("https://api.example.com")',
          'declare function wpRemoteHead(u: string, a?: any): any;',
        ),
      ).toBe("wp_remote_head( 'https://api.example.com' )");
      expect(
        transpile(
          'wpRemoteRequest("https://api.example.com")',
          'declare function wpRemoteRequest(u: string, a?: any): any;',
        ),
      ).toBe("wp_remote_request( 'https://api.example.com' )");
      expect(
        transpile(
          'wpSafeRemoteGet("https://api.example.com")',
          'declare function wpSafeRemoteGet(u: string, a?: any): any;',
        ),
      ).toBe("wp_safe_remote_get( 'https://api.example.com' )");
      expect(
        transpile(
          'wpSafeRemotePost("https://api.example.com")',
          'declare function wpSafeRemotePost(u: string, a?: any): any;',
        ),
      ).toBe("wp_safe_remote_post( 'https://api.example.com' )");
      expect(
        transpile(
          'wpSafeRemoteHead("https://api.example.com")',
          'declare function wpSafeRemoteHead(u: string, a?: any): any;',
        ),
      ).toBe("wp_safe_remote_head( 'https://api.example.com' )");
      expect(
        transpile(
          'wpSafeRemoteRequest("https://api.example.com")',
          'declare function wpSafeRemoteRequest(u: string, a?: any): any;',
        ),
      ).toBe("wp_safe_remote_request( 'https://api.example.com' )");
    });

    it('maps HTTP API response and error functions', () => {
      expect(
        transpile(
          'wpRemoteRetrieveBody(response)',
          'declare function wpRemoteRetrieveBody(r: any): string; const response: any = null;',
        ),
      ).toBe('wp_remote_retrieve_body( $response )');
      expect(
        transpile(
          'wpRemoteRetrieveResponseCode(response)',
          'declare function wpRemoteRetrieveResponseCode(r: any): any; const response: any = null;',
        ),
      ).toBe('wp_remote_retrieve_response_code( $response )');
      expect(
        transpile(
          'wpRemoteRetrieveResponseMessage(response)',
          'declare function wpRemoteRetrieveResponseMessage(r: any): string; const response: any = null;',
        ),
      ).toBe('wp_remote_retrieve_response_message( $response )');
      expect(
        transpile(
          'wpRemoteRetrieveHeader(response, "content-type")',
          'declare function wpRemoteRetrieveHeader(r: any, h: string): any; const response: any = null;',
        ),
      ).toBe("wp_remote_retrieve_header( $response, 'content-type' )");
      expect(
        transpile(
          'wpRemoteRetrieveHeaders(response)',
          'declare function wpRemoteRetrieveHeaders(r: any): any; const response: any = null;',
        ),
      ).toBe('wp_remote_retrieve_headers( $response )');
      expect(
        transpile(
          'wpRemoteRetrieveCookies(response)',
          'declare function wpRemoteRetrieveCookies(r: any): any[]; const response: any = null;',
        ),
      ).toBe('wp_remote_retrieve_cookies( $response )');
      expect(
        transpile(
          'isWpError(result)',
          'declare function isWpError(t: any): boolean; const result: any = null;',
        ),
      ).toBe('is_wp_error( $result )');
    });

    it('maps user management and auth functions', () => {
      expect(
        transpile(
          'getUserBy("email", "test@example.com")',
          'declare function getUserBy(f: string, v: any): any;',
        ),
      ).toBe("get_user_by( 'email', 'test@example.com' )");
      expect(
        transpile('getUsers({ meta_key: "phone" })', 'declare function getUsers(a?: any): any[];'),
      ).toBe("get_users( array( 'meta_key' => 'phone' ) )");
      expect(
        transpile(
          'wpInsertUser({ user_login: "john" })',
          'declare function wpInsertUser(d: any): any;',
        ),
      ).toBe("wp_insert_user( array( 'user_login' => 'john' ) )");
      expect(transpile('wpGetCurrentUser()', 'declare function wpGetCurrentUser(): any;')).toBe(
        'wp_get_current_user()',
      );
      expect(
        transpile(
          'wpGeneratePassword(12, true)',
          'declare function wpGeneratePassword(l?: number, s?: boolean): string;',
        ),
      ).toBe('wp_generate_password( 12, true )');
      expect(
        transpile(
          'wpHashPassword("secret")',
          'declare function wpHashPassword(p: string): string;',
        ),
      ).toBe("wp_hash_password( 'secret' )");
      expect(
        transpile(
          'wpCheckPassword("secret", hash)',
          'declare function wpCheckPassword(p: string, h: string): boolean; const hash: string = "";',
        ),
      ).toBe("wp_check_password( 'secret', $hash )");
      expect(
        transpile('wpSetCurrentUser(1)', 'declare function wpSetCurrentUser(id: number): any;'),
      ).toBe('wp_set_current_user( 1 )');
      expect(
        transpile(
          'wpAuthenticate(user, pass)',
          'declare function wpAuthenticate(u: string, p: string): any; const user: string = ""; const pass: string = "";',
        ),
      ).toBe('wp_authenticate( $user, $pass )');
      expect(
        transpile(
          'emailExists(email)',
          'declare function emailExists(e: string): any; const email: string = "";',
        ),
      ).toBe('email_exists( $email )');
    });

    it('maps JWT and encoding built-in functions', () => {
      expect(
        transpile('jsonEncode({ key: "value" })', 'declare function jsonEncode(v: any): string;'),
      ).toBe("wp_json_encode( array( 'key' => 'value' ) )");
      expect(
        transpile(
          'jsonDecode(data, true)',
          'declare function jsonDecode(j: string, a?: boolean): any; const data: string = "";',
        ),
      ).toBe('json_decode( $data, true )');
      expect(
        transpile('base64Encode("hello")', 'declare function base64Encode(d: string): string;'),
      ).toBe("base64_encode( 'hello' )");
      expect(
        transpile('base64Decode("aGVsbG8=")', 'declare function base64Decode(d: string): string;'),
      ).toBe("base64_decode( 'aGVsbG8=' )");
      expect(
        transpile(
          'hashHmac("sha256", data, key, true)',
          'declare function hashHmac(a: string, d: string, k: string, r?: boolean): string; const data: string = ""; const key: string = "";',
        ),
      ).toBe("hash_hmac( 'sha256', $data, $key, true )");
      expect(
        transpile(
          'hashEquals(expected, actual)',
          'declare function hashEquals(k: string, u: string): boolean; const expected: string = ""; const actual: string = "";',
        ),
      ).toBe('hash_equals( $expected, $actual )');
    });

    it('maps general PHP built-in functions', () => {
      expect(transpile('md5("test")', 'declare function md5(s: string): string;')).toBe(
        "md5( 'test' )",
      );
      expect(
        transpile('intval(val)', 'declare function intval(v: any): number; const val: any = "42";'),
      ).toBe('intval( $val )');
      expect(
        transpile('strval(num)', 'declare function strval(v: any): string; const num: number = 1;'),
      ).toBe('strval( $num )');
      expect(
        transpile(
          'strtr(str, "+/", "-_")',
          'declare function strtr(s: string, f: string, t: string): string; const str: string = "";',
        ),
      ).toBe("strtr( $str, '+/', '-_' )");
      expect(
        transpile(
          'rtrim(str, "=")',
          'declare function rtrim(s: string, c?: string): string; const str: string = "";',
        ),
      ).toBe("rtrim( $str, '=' )");
      expect(transpile('time()', 'declare function time(): number;')).toBe('time()');
      expect(
        transpile('getallheaders()', 'declare function getallheaders(): Record<string, string>;'),
      ).toBe("function_exists( 'getallheaders' ) ? getallheaders() : array()");
      expect(
        transpile(
          'header("Content-Type: application/json")',
          'declare function header(h: string): void;',
        ),
      ).toBe("header( 'Content-Type: application/json' )");
    });

    it('maps escUrlRaw for non-display URL contexts', () => {
      expect(
        transpile(
          'escUrlRaw(url)',
          'declare function escUrlRaw(url: string, protocols?: string[]): string; const url: string = "";',
        ),
      ).toBe('esc_url_raw( $url )');
    });

    it('maps hash and uniqid built-in functions', () => {
      expect(
        transpile(
          'hash("sha256", data)',
          'declare function hash(a: string, d: string, r?: boolean): string; const data: string = "";',
        ),
      ).toBe("hash( 'sha256', $data )");
      expect(
        transpile('uniqid("mp_")', 'declare function uniqid(p?: string, m?: boolean): string;'),
      ).toBe("uniqid( 'mp_' )");
      expect(
        transpile(
          'numberFormat(price, 2, ".", "")',
          'declare function numberFormat(n: number, d?: number, dp?: string, ts?: string): string; const price: number = 0;',
        ),
      ).toBe("number_format( $price, 2, '.', '' )");
    });

    it('maps search and query conditionals', () => {
      expect(transpile('isSearch()', 'declare function isSearch(): boolean;')).toBe('is_search()');
      expect(transpile('getSearchQuery()', 'declare function getSearchQuery(): string;')).toBe(
        'get_search_query()',
      );
      expect(
        transpile('getQueriedObjectId()', 'declare function getQueriedObjectId(): number;'),
      ).toBe('get_queried_object_id()');
    });

    it('maps utility and REST functions', () => {
      expect(
        transpile('wpRand(0, 9)', 'declare function wpRand(min?: number, max?: number): number;'),
      ).toBe('wp_rand( 0, 9 )');
      expect(
        transpile(
          'restEnsureResponse(data)',
          'declare function restEnsureResponse(r: any): any; const data: any = null;',
        ),
      ).toBe('rest_ensure_response( $data )');
    });

    it('maps console.log to error_log', () => {
      expect(transpile('console.log("test")')).toBe("error_log( 'test' )");
    });

    it('maps Date.now() to time()', () => {
      expect(transpile('Date.now()')).toBe('time()');
    });

    it('maps Date.parse() to strtotime()', () => {
      expect(transpile('Date.parse("2024-01-01")')).toBe("strtotime( '2024-01-01' )");
    });

    it('maps JSON.stringify', () => {
      expect(transpile('JSON.stringify(null)')).toBe('wp_json_encode( null )');
    });

    it('maps JSON.parse', () => {
      expect(transpile('JSON.parse("test")', 'const test = "";')).toBe(
        "json_decode( 'test', true )",
      );
    });

    it('maps parseInt', () => {
      expect(transpile('parseInt("42")')).toBe("intval( '42' )");
    });

    it('maps Math methods', () => {
      expect(transpile('Math.floor(3.14)')).toBe('floor( 3.14 )');
      expect(transpile('Math.ceil(3.14)')).toBe('ceil( 3.14 )');
      expect(transpile('Math.round(3.14)')).toBe('round( 3.14 )');
      expect(transpile('Math.abs(-5)')).toBe('abs( -5 )');
    });

    it('maps Object.keys', () => {
      expect(transpile('Object.keys({})')).toBe('array_keys( array() )');
    });
  });

  describe('method calls (JS built-in)', () => {
    it('maps arr.push', () => {
      const result = transpile('arr.push(1)', 'const arr: number[] = [];');
      expect(result).toBe('array_push( $arr, 1 )');
    });

    it('maps arr.includes', () => {
      const result = transpile('arr.includes(1)', 'const arr: number[] = [];');
      expect(result).toBe('in_array( 1, $arr )');
    });

    it('maps arr.map', () => {
      const result = transpile('arr.map((x: number) => x)', 'const arr: number[] = [];');
      expect(result).toContain('array_map(');
    });

    it('maps str.trim', () => {
      const result = transpile('str.trim()', 'const str: string = "";');
      expect(result).toBe('trim( $str )');
    });

    it('maps str.split', () => {
      const result = transpile('str.split(",")', 'const str: string = "";');
      expect(result).toBe("explode( ',', $str )");
    });

    it('maps str.toLowerCase', () => {
      const result = transpile('str.toLowerCase()', 'const str: string = "";');
      expect(result).toBe('strtolower( $str )');
    });

    it('maps str.toUpperCase', () => {
      const result = transpile('str.toUpperCase()', 'const str: string = "";');
      expect(result).toBe('strtoupper( $str )');
    });

    it('maps arr.join', () => {
      const result = transpile('arr.join(",")', 'const arr: string[] = [];');
      expect(result).toBe("implode( ',', $arr )");
    });
  });

  describe('property access', () => {
    it('maps .length on array to count()', () => {
      const result = transpile('arr.length', 'const arr: number[] = [];');
      expect(result).toBe('count( $arr )');
    });

    it('maps .length on string to strlen()', () => {
      const result = transpile('str.length', 'const str: string = "";');
      expect(result).toBe('strlen( $str )');
    });

    it('maps Math.PI', () => {
      expect(transpile('Math.PI')).toBe('M_PI');
    });
  });

  describe('template literals', () => {
    it('transpiles template literals to concatenation', () => {
      const result = transpile('`hello ${name}`', 'const name = "world";');
      expect(result).toBe("'hello ' . $name");
    });
  });

  describe('ternary', () => {
    it('transpiles conditional expression', () => {
      expect(transpile('true ? 1 : 2')).toBe('true ? 1 : 2');
    });
  });

  describe('array literals', () => {
    it('transpiles empty array', () => {
      expect(transpile('[]')).toBe('array()');
    });

    it('transpiles array with elements', () => {
      expect(transpile('[1, 2, 3]')).toBe('array( 1, 2, 3 )');
    });
  });

  describe('object literals', () => {
    it('transpiles empty object', () => {
      // Parenthesized expression wraps the result
      expect(transpile('({})')).toBe('(array())');
    });

    it('transpiles object to associative array', () => {
      const result = transpile('({ key: "value" })');
      expect(result).toBe("(array( 'key' => 'value' ))");
    });
  });

  describe('element access', () => {
    it('transpiles bracket notation', () => {
      const result = transpile('obj["key"]', 'const obj: Record<string, string> = {};');
      expect(result).toBe("$obj['key']");
    });
  });

  describe('arrow functions', () => {
    it('transpiles simple arrow function', () => {
      const result = transpile('(x: number) => x * 2');
      expect(result).toContain('function( $x )');
      expect(result).toContain('return');
    });

    it('transpiles multi-statement arrow function body', () => {
      const result = transpile('(x: number) => { const y = x + 1; return y; }');
      expect(result).toContain('function( $x )');
      expect(result).toContain('$y = $x + 1;');
      expect(result).toContain('return $y;');
    });
  });

  describe('optional chaining', () => {
    it('transpiles obj?.prop to null check', () => {
      const result = transpile('obj?.name', 'const obj: any = {};');
      expect(result).toBe("($obj !== null ? $obj['name'] : null)");
    });

    it('transpiles obj?.method() to null check', () => {
      const result = transpile('obj?.toString()', 'const obj: any = {};');
      expect(result).toBe('($obj !== null ? $obj->to_string() : null)');
    });

    it('transpiles arr?.[0] to null check', () => {
      const result = transpile('arr?.[0]', 'const arr: any = [];');
      expect(result).toBe('($arr !== null ? $arr[0] : null)');
    });
  });

  describe('spread operator', () => {
    it('transpiles array spread', () => {
      const result = transpile('[...arr, 4, 5]', 'const arr: number[] = [1, 2, 3];');
      expect(result).toBe('array_merge( $arr, array( 4, 5 ) )');
    });

    it('transpiles spread-only array', () => {
      const result = transpile('[...arr]', 'const arr: number[] = [1, 2, 3];');
      expect(result).toBe('$arr');
    });

    it('transpiles object spread', () => {
      const result = transpile('({ ...obj, key: "val" })', 'const obj: any = {};');
      expect(result).toContain('array_merge(');
      expect(result).toContain("'key' => 'val'");
    });

    it('transpiles function call spread', () => {
      const result = transpile(
        'fn(...args)',
        'const args: any[] = []; declare function fn(...a: any[]): void;',
      );
      expect(result).toContain('...$args');
    });
  });

  describe('delete operator', () => {
    it('transpiles delete to unset', () => {
      const result = transpile('delete obj["key"]', 'const obj: any = {};');
      expect(result).toBe("unset( $obj['key'] )");
    });
  });

  describe('type-ambiguous method calls', () => {
    it('maps str.indexOf to strpos', () => {
      const result = transpile('str.indexOf("x")', 'const str: string = "hello";');
      expect(result).toBe("strpos( $str, 'x' )");
    });

    it('maps arr.indexOf to array_search (fallthrough)', () => {
      const result = transpile('arr.indexOf(1)', 'const arr: number[] = [];');
      expect(result).toBe('array_search( 1, $arr )');
    });

    it('maps str.includes to str_contains', () => {
      const result = transpile('str.includes("x")', 'const str: string = "hello";');
      expect(result).toBe("str_contains( $str, 'x' )");
    });

    it('maps arr.includes to in_array (fallthrough)', () => {
      const result = transpile('arr.includes(1)', 'const arr: number[] = [];');
      expect(result).toBe('in_array( 1, $arr )');
    });

    it('maps str.lastIndexOf to strrpos', () => {
      const result = transpile('str.lastIndexOf("x")', 'const str: string = "hello";');
      expect(result).toBe("strrpos( $str, 'x' )");
    });

    it('maps str.slice to substr', () => {
      const result = transpile('str.slice(1)', 'const str: string = "hello";');
      expect(result).toBe('substr( $str, 1 )');
    });

    it('maps str.substr to substr', () => {
      const result = transpile('str.substr(1, 3)', 'const str: string = "hello";');
      expect(result).toBe('substr( $str, 1, 3 )');
    });

    it('maps str.concat to dot operator', () => {
      const result = transpile('str.concat("world")', 'const str: string = "hello";');
      expect(result).toBe("$str . 'world'");
    });

    it('maps str.padEnd to str_pad with STR_PAD_RIGHT', () => {
      const result = transpile('str.padEnd(10, " ")', 'const str: string = "hello";');
      expect(result).toBe("str_pad( $str, 10, ' ', STR_PAD_RIGHT )");
    });
  });

  describe('custom array methods', () => {
    it('maps arr.find to array_filter + reset', () => {
      const result = transpile(
        'arr.find((x: number) => x > 2)',
        'const arr: number[] = [1, 2, 3];',
      );
      expect(result).toContain('array_filter(');
      expect(result).toContain('reset(');
    });

    it('maps arr.reduce with initial value', () => {
      const result = transpile(
        'arr.reduce((acc: number, cur: number) => acc + cur, 0)',
        'const arr: number[] = [1, 2, 3];',
      );
      expect(result).toContain('array_reduce(');
      expect(result).toContain('$arr');
    });

    it('maps arr.some to count + array_filter > 0', () => {
      const result = transpile(
        'arr.some((x: number) => x > 2)',
        'const arr: number[] = [1, 2, 3];',
      );
      expect(result).toContain('array_filter(');
      expect(result).toContain('> 0');
    });

    it('maps arr.every to count comparison', () => {
      const result = transpile(
        'arr.every((x: number) => x > 0)',
        'const arr: number[] = [1, 2, 3];',
      );
      expect(result).toContain('array_filter(');
      expect(result).toContain('=== count(');
    });

    it('maps arr.flat to array_merge spread', () => {
      const result = transpile('arr.flat()', 'const arr: number[][] = [[1], [2]];');
      expect(result).toContain('array_merge( ...$arr )');
    });

    it('maps arr.forEach to array_walk', () => {
      const result = transpile('arr.forEach((x: number) => x)', 'const arr: number[] = [];');
      expect(result).toBe('array_walk( $arr, function( $x ) { return $x; } )');
    });

    it('maps str.replaceAll to str_replace', () => {
      const result = transpile('str.replaceAll("a", "b")', 'const str: string = "";');
      expect(result).toBe("str_replace( 'a', 'b', $str )");
    });
  });

  describe('enum member access', () => {
    it('transpiles enum member to class constant', () => {
      const result = transpile('Direction.Up', 'enum Direction { Up, Down, Left, Right }');
      expect(result).toBe('Direction::UP');
    });

    it('transpiles string enum member', () => {
      const result = transpile(
        'Status.Active',
        'enum Status { Active = "active", Inactive = "inactive" }',
      );
      expect(result).toBe('Status::ACTIVE');
    });
  });

  describe('typeof pattern detection', () => {
    it('transpiles typeof x === "string" to is_string', () => {
      const result = transpile('typeof x === "string"', 'const x: any = "";');
      expect(result).toBe('is_string( $x )');
    });

    it('transpiles typeof x === "number" to is_numeric', () => {
      const result = transpile('typeof x === "number"', 'const x: any = 0;');
      expect(result).toBe('is_numeric( $x )');
    });

    it('transpiles typeof x === "boolean" to is_bool', () => {
      const result = transpile('typeof x === "boolean"', 'const x: any = true;');
      expect(result).toBe('is_bool( $x )');
    });

    it('transpiles typeof x !== "string" to ! is_string', () => {
      const result = transpile('typeof x !== "string"', 'const x: any = "";');
      expect(result).toBe('! is_string( $x )');
    });

    it('transpiles reversed "string" === typeof x', () => {
      const result = transpile('"string" === typeof x', 'const x: any = "";');
      expect(result).toBe('is_string( $x )');
    });

    it('transpiles typeof x === "undefined" to is_null', () => {
      const result = transpile('typeof x === "undefined"', 'const x: any = null;');
      expect(result).toBe('is_null( $x )');
    });

    it('transpiles typeof x === "function" to is_callable', () => {
      const result = transpile('typeof x === "function"', 'const x: any = null;');
      expect(result).toBe('is_callable( $x )');
    });
  });

  describe('undefined comparison with array key access', () => {
    it('transpiles obj["key"] !== undefined to isset()', () => {
      const result = transpile('obj["key"] !== undefined', 'const obj: any = {};');
      expect(result).toBe("isset( $obj['key'] )");
    });

    it('transpiles obj["key"] === undefined to ! isset()', () => {
      const result = transpile('obj["key"] === undefined', 'const obj: any = {};');
      expect(result).toBe("! isset( $obj['key'] )");
    });

    it('transpiles obj.prop !== undefined to isset()', () => {
      const result = transpile('obj.prop !== undefined', 'const obj: any = {};');
      expect(result).toBe("isset( $obj['prop'] )");
    });

    it('keeps plain variable !== undefined as !== null', () => {
      const result = transpile('x !== undefined', 'const x: any = null;');
      expect(result).toBe('$x !== null');
    });
  });

  describe('new expressions', () => {
    it('transpiles new ClassName without $ prefix', () => {
      const result = transpile(
        'new WP_Error("code", "message")',
        'declare class WP_Error { constructor(code: string, msg: string); }',
      );
      expect(result).toBe("new WP_Error( 'code', 'message' )");
    });

    it('preserves class name casing verbatim', () => {
      const result = transpile(
        'new MyCustomClass()',
        'declare class MyCustomClass { constructor(); }',
      );
      expect(result).toBe('new MyCustomClass()');
    });
  });
});
