# TypeScript to PHP Transpilation

## Supported Constructs

| TypeScript | PHP |
|---|---|
| `let x = 1` / `const x = 1` | `$x = 1;` |
| `if / else if / else` | `if / elseif / else` |
| `for (let i = 0; ...)` | `for ($i = 0; ...)` |
| `for (const item of items)` | `foreach ($items as $item)` |
| `for (const key in obj)` | `foreach ($obj as $key => $value)` |
| `while (cond)` | `while ($cond)` |
| `switch / case` | `switch / case` |
| `try / catch` | `try / catch` |
| `a + b` (strings) | `$a . $b` |
| `a + b` (numbers) | `$a + $b` |
| `` `hello ${name}` `` | `'hello ' . $name` |
| `x \|\| y` | `$x \|\| $y` (boolean result — use `??` for default values) |
| `x ?? y` | `$x ?? $y` |
| `{ key: val }` | `array( 'key' => $val )` |
| `this.prop` | `$this->prop` |
| `arr.push(x)` | `array_push( $arr, $x )` |
| `arr.map(fn)` | `array_map( $fn, $arr )` |
| `arr.includes(x)` | `in_array( $x, $arr )` |
| `str.trim()` | `trim( $str )` |
| `str.split(',')` | `explode( ',', $str )` |
| `str.toLowerCase()` | `strtolower( $str )` |
| `arr.length` | `count( $arr )` |
| `getOption(...)` | `get_option(...)` |
| `const { a, b } = obj` | `$a = $obj['a']; $b = $obj['b'];` |
| `const [a, b] = arr` | `$a = $arr[0]; $b = $arr[1];` |
| `obj?.prop` | `($obj !== null ? $obj['prop'] : null)` |
| `[...arr, 4, 5]` | `array_merge( $arr, array( 4, 5 ) )` |
| `{ ...obj, key: val }` | `array_merge( $obj, array( 'key' => $val ) )` |
| `func(...args)` | `func( ...$args )` |
| `delete obj.prop` | `unset( $obj['prop'] )` |
| `typeof x === 'string'` | `is_string( $x )` |
| `obj['key'] !== undefined` | `isset( $obj['key'] )` |
| `obj['key'] === undefined` | `! isset( $obj['key'] )` |
| `enum Direction { Up }` | `class Direction { const UP = 0; }` |
| `Direction.Up` | `Direction::UP` |
| `for (const { id } of items)` | `foreach ( $items as $__item ) { $id = $__item['id']; }` |
| `arr.reduce(fn, init)` | `array_reduce( $arr, fn, init )` |
| `arr.some(fn)` | `count( array_filter( $arr, fn ) ) > 0` |
| `arr.every(fn)` | `count( array_filter( $arr, fn ) ) === count( $arr )` |
| `str.indexOf('x')` | `strpos( $str, 'x' )` |
| `str.includes('x')` | `str_contains( $str, 'x' )` |

WordPress API functions are automatically mapped from camelCase to snake_case PHP equivalents.

## Not Supported (MVP)

- `async/await`, Promises
- `class` declarations (use `@Plugin` class)
- Nested destructuring (`const { a: { b } } = obj`), rest elements (`const [first, ...rest] = arr`)
- Regular expressions
- Generics

Unsupported constructs emit helpful comments in the PHP output, e.g.:
```php
/* WPTS: async/await is not supported. Use synchronous WordPress API calls instead. */
```

## WordPress API Types

Importing from `wpts` automatically makes all WordPress functions available as global types in your TypeScript code — no manual `declare function` statements needed.

```typescript
import { Plugin, Action, Setting } from 'wpts';

// WordPress functions are available globally:
const val = getOption('my_key', 'default');
wpEnqueueStyle('my-style', pluginDirUrl(__FILE__) + 'style.css');
```

This works via TypeScript's `declare global` pattern in `src/runtime/wp-types.ts`. Over 200 WordPress, WooCommerce, and PHP built-in functions have full type signatures for IDE autocompletion and type checking.

## Available WordPress Functions

All functions are written in camelCase in TypeScript and transpiled to snake_case PHP.

| Category | Functions |
|----------|-----------|
| **Options** | `addOption`, `getOption`, `updateOption`, `deleteOption` |
| **Escaping** | `escHtml`, `escAttr`, `escUrl`, `escUrlRaw`, `escJs`, `escTextarea`, `wpKses`, `wpKsesPost` |
| **Sanitization** | `sanitizeUser`, `sanitizeTextField`, `sanitizeTextareaField`, `sanitizeTitle`, `sanitizeEmail`, `sanitizeFileName`, `sanitizeKey` |
| **Enqueueing** | `wpEnqueueStyle`, `wpEnqueueScript`, `wpRegisterStyle`, `wpRegisterScript`, `wpLocalizeScript` |
| **Hooks** | `addAction`, `addFilter`, `doAction`, `applyFilters`, `removeAction`, `removeFilter`, `addShortcode` |
| **Settings API** | `registerSetting`, `addSettingsSection`, `addSettingsField`, `settingsFields`, `doSettingsSections`, `submitButton` |
| **Admin Pages** | `addMenuPage`, `addSubmenuPage`, `addOptionsPage` |
| **Conditionals** | `isSingle`, `isPage`, `isAdmin`, `isFrontPage`, `isHome`, `isArchive`, `isCategory`, `isTag`, `isSingular`, `isSearch`, `getSearchQuery`, `getQueriedObjectId` |
| **User** | `currentUserCan`, `getCurrentUserId`, `isUserLoggedIn`, `getUserBy`, `getUsers`, `usernameExists`, `emailExists`, `wpInsertUser`, `wpUpdateUser`, `wpGetCurrentUser`, `wpGeneratePassword`, `wpHashPassword`, `wpCheckPassword`, `wpSetCurrentUser`, `wpAuthenticate`, `getTheAuthorMeta` |
| **Nonces** | `wpCreateNonce`, `wpVerifyNonce`, `wpNonceField`, `checkAdminReferer` |
| **Transients** | `getTransient`, `setTransient`, `deleteTransient` |
| **Posts** | `getPost`, `getPostType`, `getPosts`, `wpInsertPost`, `wpUpdatePost`, `getTheId`, `getTheTitle`, `getTheContent`, `getPermalink`, `wpGetPostParentId` |
| **URLs** | `adminUrl`, `homeUrl`, `siteUrl`, `contentUrl`, `wpParseUrl` |
| **Plugin** | `pluginDirUrl`, `pluginDirPath`, `pluginBasename` |
| **i18n** | `__`, `_e`, `_x`, `_ex`, `_n`, `_nx`, `escHtml__`, `escHtmlE`, `escHtmlX`, `escAttr__`, `escAttrE`, `escAttrX`, `loadPluginTextdomain` |
| **HTTP API** | `wpRemoteGet`, `wpRemotePost`, `wpRemoteHead`, `wpRemoteRequest`, `wpSafeRemoteGet`, `wpSafeRemotePost`, `wpSafeRemoteHead`, `wpSafeRemoteRequest`, `wpRemoteRetrieveBody`, `wpRemoteRetrieveResponseCode`, `wpRemoteRetrieveResponseMessage`, `wpRemoteRetrieveHeader`, `wpRemoteRetrieveHeaders`, `wpRemoteRetrieveCookies`, `isWpError` |
| **Metadata** | `getPostMeta`, `addPostMeta`, `updatePostMeta`, `deletePostMeta`, `getUserMeta`, `addUserMeta`, `updateUserMeta`, `deleteUserMeta`, `getTermMeta`, `addTermMeta`, `updateTermMeta`, `deleteTermMeta`, `getCommentMeta`, `addCommentMeta`, `updateCommentMeta`, `deleteCommentMeta`, `getMetadata`, `addMetadata`, `updateMetadata`, `deleteMetadata` |
| **CPT / Taxonomy** | `registerPostType`, `registerTaxonomy`, `wpDeletePost`, `wpCountPosts` |
| **AJAX** | `checkAjaxReferer`, `$_POST`, `$_GET`, `$_REQUEST`, `$_SERVER` |
| **JSON Response** | `wpSendJson`, `wpSendJsonSuccess`, `wpSendJsonError` |
| **REST API** | `restEnsureResponse` |
| **Utility** | `wpRand` |
| **PHP Built-ins** | `classExists`, `functionExists`, `isArray`, `jsonEncode`, `jsonDecode`, `base64Encode`, `base64Decode`, `hashHmac`, `hashEquals`, `hash`, `md5`, `uniqid`, `numberFormat`, `intval`, `strval`, `strtolower`, `strtr`, `rtrim`, `time`, `gmdate`, `getallheaders`, `header`, `levenshtein`, `arrayUnique`, `arrayValues`, `requireOnce` · JS built-in `parseFloat()` → PHP `floatval()` |
| **Misc** | `wpDie`, `wpRedirect`, `wpSafeRedirect`, `absint`, `wpUnslash`, `echo`, `ABSPATH` |
| **Content** | `wpStripAllTags` |
| **Media** | `wpGetAttachmentImageSrc`, `wpGetAttachmentUrl` |
| **Cron** | `wpScheduleSingleEvent`, `wpScheduleEvent`, `wpNextScheduled`, `wpUnscheduleEvent`, `wpClearScheduledHook` |
| **Taxonomy** | `getTerms`, `getTheTerms`, `wpGetObjectTerms` |
| **WooCommerce Conditionals** | `isWoocommerce`, `isShop`, `isProduct`, `isCart`, `isCheckout`, `isAccountPage`, `isWcEndpointUrl` |
| **WooCommerce Products** | `wcGetProduct`, `wcGetProducts`, `wcGetProductIdBySku` |
| **WooCommerce Orders** | `wcGetOrder`, `wcGetOrders`, `wcCreateOrder` |
| **WooCommerce Helpers** | `wcPrice`, `wcClean`, `wcGetPageId`, `wcGetPagePermalink`, `wcGetEndpointUrl`, `wcGetCheckoutUrl`, `wcGetCartUrl` |
| **WooCommerce Customer** | `wcCustomerBoughtProduct`, `wcGetCustomerOrderCount` |
| **WooCommerce Notices** | `wcAddNotice`, `wcPrintNotices`, `wcHasNotice` |
| **WooCommerce Taxonomy** | `wcGetAttributeTaxonomies`, `wcGetProductTerms` |
| **WooCommerce Templates** | `wcGetTemplatePart`, `wcGetTemplate` |
| **Database** | `wpdb.prefix`, `wpdb.posts`, `wpdb.prepare()`, `wpdb.query()`, `wpdb.getVar()`, `wpdb.getRow()`, `wpdb.getResults()`, `wpdb.insert()`, `wpdb.update()`, `wpdb.delete()`, `wpdb.escLike()`, `dbDelta` |

Full type declarations are in `src/runtime/wp-types.ts` for IDE autocompletion.

When you use `wpdb` in TypeScript, the transpiler automatically injects `global $wpdb;` at the start of the generated PHP method.

WooCommerce functions are only available at runtime when WooCommerce is active. Guard usage with `isWoocommerce()` or check `is_plugin_active('woocommerce/woocommerce.php')` in your activation hook.

## JavaScript Method Mappings

Built-in JavaScript array and string methods are automatically transpiled to their PHP equivalents. You can call them directly on variables without importing anything.

### Array Methods

| TypeScript | PHP | Notes |
|---|---|---|
| `arr.push(x)` | `array_push($arr, $x)` | |
| `arr.pop()` | `array_pop($arr)` | |
| `arr.shift()` | `array_shift($arr)` | |
| `arr.unshift(x)` | `array_unshift($arr, $x)` | |
| `arr.indexOf(x)` | `array_search($x, $arr)` | |
| `arr.includes(x)` | `in_array($x, $arr)` | |
| `arr.join(sep)` | `implode($sep, $arr)` | |
| `arr.reverse()` | `array_reverse($arr)` | |
| `arr.slice(start, end)` | `array_slice($arr, $start, $end)` | |
| `arr.splice(start, del)` | `array_splice($arr, $start, $del)` | |
| `arr.map(fn)` | `array_map($fn, $arr)` | |
| `arr.filter(fn)` | `array_filter($arr, $fn)` | |
| `arr.keys()` | `array_keys($arr)` | |
| `arr.values()` | `array_values($arr)` | |
| `arr.concat(b)` | `array_merge($arr, $b)` | |
| `arr.sort()` | `sort($arr)` | |
| `arr.forEach(fn)` | `array_walk($arr, $fn)` | |
| `arr.findIndex(fn)` | `array_search($fn, $arr)` | |
| `arr.fill(val, start, end)` | `array_fill($start, $end, $val)` | |
| `arr.length` | `count($arr)` | Property, not a method call |

### String Methods

| TypeScript | PHP | Notes |
|---|---|---|
| `str.trim()` | `trim($str)` | |
| `str.trimStart()` | `ltrim($str)` | |
| `str.trimEnd()` | `rtrim($str)` | |
| `str.toLowerCase()` | `strtolower($str)` | |
| `str.toUpperCase()` | `strtoupper($str)` | |
| `str.split(sep)` | `explode($sep, $str)` | Args are swapped |
| `str.replace(search, rep)` | `str_replace($search, $rep, $str)` | |
| `str.replaceAll(search, rep)` | `str_replace($search, $rep, $str)` | |
| `str.substring(start, end)` | `substr($str, $start, $end)` | |
| `str.substr(start, len)` | `substr($str, $start, $len)` | |
| `str.startsWith(prefix)` | `str_starts_with($str, $prefix)` | |
| `str.endsWith(suffix)` | `str_ends_with($str, $suffix)` | |
| `str.repeat(n)` | `str_repeat($str, $n)` | |
| `str.padStart(len, pad)` | `str_pad($str, $len, $pad)` | |
| `str.charAt(i)` | `substr($str, $i, 1)` | |
| `str.indexOf(x)` | `strpos($str, $x)` | (via Supported Constructs) |
| `str.includes(x)` | `str_contains($str, $x)` | (via Supported Constructs) |
| `str.length` | `strlen($str)` | Property, not a method call |
