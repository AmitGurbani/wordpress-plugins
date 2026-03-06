# wpts

Write WordPress plugins in TypeScript. wpts transpiles your decorator-annotated TypeScript into a complete, installable WordPress plugin with PHP backend, React admin pages, auto-generated REST API, and full plugin boilerplate.

**Requires Node.js >= 20**

## Quick Start

```bash
# Scaffold a new plugin project
npx wpts init my-plugin --name "My Plugin" --slug my-plugin

# Build the plugin
cd my-plugin
npx wpts build

# Output is in dist/my-plugin/ — copy to wp-content/plugins/
```

The generated plugin includes:

```
my-plugin/
├── my-plugin.php              # Plugin entry with header
├── includes/
│   ├── class-my-plugin.php    # Main orchestrator
│   ├── class-my-plugin-loader.php
│   ├── class-my-plugin-activator.php
│   ├── class-my-plugin-deactivator.php
│   └── class-my-plugin-rest-api.php   # Auto-generated from @Setting / @RestRoute
├── admin/
│   ├── class-my-plugin-admin.php
│   └── js/                    # React admin UI
│       ├── src/               # Your admin/*.tsx files (copied)
│       └── package.json       # wp-scripts build config
├── public/
│   └── class-my-plugin-public.php
├── uninstall.php
└── readme.txt
```

The React admin UI is **auto-built** during `wpts build` when `@AdminPage` is used. For development mode with hot reload, run `pnpm run start` inside `admin/js/`.

## How It Works

You write two types of files:

1. **`src/plugin.ts`** — Plugin backend logic with decorators. Transpiled to PHP.
2. **`src/admin/index.tsx`** — Admin page UI in React. Bundled with `@wordpress/scripts`.

The `@Setting` decorators automatically generate a REST API endpoint (`/your-plugin/v1/settings`) so your React admin page can read and write settings without any manual REST API code.

## CLI Commands

### `wpts init [directory]`

Scaffold a new project with example `plugin.ts`, `admin/index.tsx`, and `tsconfig.json`.

```bash
wpts init my-plugin --name "My Plugin" --slug my-plugin --author "Jane Dev"
```

| Option | Description |
|--------|-------------|
| `--name <name>` | Plugin name |
| `--slug <slug>` | Plugin slug |
| `--author <author>` | Author name |

### `wpts build [file]`

Transpile TypeScript to a complete WordPress plugin.

```bash
wpts build                              # Uses src/plugin.ts
wpts build src/plugin.ts -o ./build     # Custom entry and output
wpts build --clean                      # Clean output directory first
```

| Option | Description | Default |
|--------|-------------|---------|
| `-o, --outDir <dir>` | Output directory | `./dist` |
| `--clean` | Clean output before build | `false` |

Admin React builds cache `node_modules` in `.wpts-cache/` to avoid reinstalling dependencies on every build. The cache invalidates automatically when `package.json` dependencies change. Delete `.wpts-cache/` to force a fresh install.

### `wpts validate [file]`

Check source for errors without generating output.

```bash
wpts validate                  # Check src/plugin.ts
wpts validate --strict         # Fail on warnings too
```

### `wpts watch [file]`

Watch source files and rebuild on changes.

```bash
wpts watch                              # Watch src/plugin.ts
wpts watch src/plugin.ts -o ./build     # Custom entry and output
```

## Configuration

Create `wpts.config.json` (or `wpts.config.js`) in your project root. CLI flags override config values.

```json
{
  "entry": "src/plugin.ts",
  "outDir": "./dist",
  "clean": true,
  "adminSrcDir": "src/admin"
}
```

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `entry` | `string` | Entry TypeScript file | `src/plugin.ts` |
| `outDir` | `string` | Output directory | `./dist` |
| `clean` | `boolean` | Clean output before build | `false` |
| `adminSrcDir` | `string` | Admin React source directory | `src/admin` |

## Multi-File Plugins

Split large plugins across multiple TypeScript files. Use standard `import` statements — the transpiler resolves all imported files and merges decorators from every file into a single plugin.

```
src/
├── plugin.ts          # Entry file with @Plugin decorator
├── routes.ts          # REST routes (@RestRoute)
├── hooks.ts           # Actions and filters (@Action, @Filter)
└── admin/index.tsx    # React admin UI (not transpiled)
```

**Entry file** (`plugin.ts`): Must contain exactly one `@Plugin` decorator. Import other files:

```typescript
import './routes.js';
import './hooks.js';

@Plugin({ name: 'My Plugin', ... })
class MyPlugin {
  @Setting({ key: 'api_key', type: 'string', default: '', label: 'API Key' })
  apiKey: string = '';
}
```

**Other files** (`routes.ts`): Contain decorated classes — no `@Plugin` needed:

```typescript
@RestRoute('/items', { method: 'GET', capability: 'read' })
listItems(request: any): any {
  return getPosts({ post_type: 'item' });
}
```

All decorators (`@Action`, `@Filter`, `@Setting`, `@RestRoute`, `@AjaxHandler`, etc.) work in any file. The transpiler merges everything into the same generated plugin output.

> See [`headless-otp-auth`](../headless-otp-auth/) for a real-world example using multi-file structure.

## WordPress API Types

Importing from `wpts` automatically makes all WordPress functions available as global types in your TypeScript code — no manual `declare function` statements needed.

```typescript
import { Plugin, Action, Setting } from 'wpts';

// WordPress functions are available globally:
const val = getOption('my_key', 'default');
wpEnqueueStyle('my-style', pluginDirUrl(__FILE__) + 'style.css');
```

This works via TypeScript's `declare global` pattern in `src/runtime/wp-types.ts`. Over 200 WordPress, WooCommerce, and PHP built-in functions have full type signatures for IDE autocompletion and type checking.

## Decorator API

### `@Plugin(options)`

Class decorator. Defines plugin metadata for the WordPress plugin header.

```typescript
@Plugin({
  name: 'My Plugin',
  description: 'A WordPress plugin built with wpts.',
  version: '1.0.0',
  author: 'Jane Dev',
  license: 'GPL-2.0+',
  textDomain: 'my-plugin',
  requiresWP: '6.7',
  requiresPHP: '8.2',
})
class MyPlugin { ... }
```

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `name` | `string` | Yes | Plugin name |
| `description` | `string` | Yes | Plugin description |
| `version` | `string` | Yes | Plugin version |
| `author` | `string` | Yes | Author name |
| `license` | `string` | Yes | License identifier |
| `slug` | `string` | No | Plugin slug (derived from name) |
| `uri` | `string` | No | Plugin URI |
| `authorUri` | `string` | No | Author URI |
| `licenseUri` | `string` | No | License URI |
| `textDomain` | `string` | No | i18n text domain |
| `domainPath` | `string` | No | Path to translations |
| `requiresWP` | `string` | No | Minimum WordPress version (default: `6.7`) |
| `requiresPHP` | `string` | No | Minimum PHP version (default: `8.2`) |

### `@Setting(options)`

Property decorator. Registers a WordPress setting with automatic REST API support.

```typescript
@Setting({
  key: 'greeting',
  type: 'string',
  default: 'Hello!',
  label: 'Greeting Message',
  sanitize: 'sanitize_text_field',
})
greeting: string = 'Hello!';
```

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `key` | `string` | Yes | Setting key |
| `type` | `'string' \| 'number' \| 'boolean' \| 'array'` | Yes | Value type |
| `default` | `any` | Yes | Default value |
| `label` | `string` | Yes | Display label |
| `description` | `string` | No | Setting description |
| `sanitize` | `string` | No | PHP sanitization function |

Each `@Setting` generates:
- `register_setting()` call with sanitization
- REST API GET/POST at `/{text-domain}/v1/settings`
- If a sanitize callback returns null (invalid input), the REST API returns HTTP 400 with a `WP_Error`

### `@Action(hookName, options?)`

Method decorator. Registers a WordPress action hook.

```typescript
@Action('init')
initialize(): void {
  loadPluginTextdomain('my-plugin', false, 'my-plugin/languages');
}

@Action('wp_enqueue_scripts', { priority: 20 })
enqueueAssets(): void {
  wpEnqueueStyle('my-plugin-style');
}

@Action('woocommerce_update_product', { priority: 20 })
onProductUpdate(productId: number): void {
  this.indexProduct(productId);
}
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `priority` | `number` | `10` | Hook priority |
| `acceptedArgs` | `number` | method parameter count | Number of arguments |

### `@Filter(hookName, options?)`

Method decorator. Registers a WordPress filter hook. The method receives the value to filter and must return it.

```typescript
@Filter('the_content')
appendGreeting(content: string): string {
  if (isSingle()) {
    return content + '<p>' + escHtml(this.greeting) + '</p>';
  }
  return content;
}
```

Options are the same as `@Action`.

### `@AdminPage(options)`

Class or method decorator. Registers a WordPress admin menu page with a React UI.

```typescript
// Top-level menu page
@AdminPage({
  pageTitle: 'My Plugin Settings',
  menuTitle: 'My Plugin',
  capability: 'manage_options',
  menuSlug: 'my-plugin-settings',
  iconUrl: 'dashicons-admin-settings',
})

// Sub-page under another menu
@AdminPage({
  pageTitle: 'Advanced Settings',
  menuTitle: 'Advanced',
  capability: 'manage_options',
  menuSlug: 'my-plugin-advanced',
  parentSlug: 'my-plugin-settings',
})
```

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `pageTitle` | `string` | Yes | Browser page title |
| `menuTitle` | `string` | Yes | Admin menu label |
| `capability` | `string` | Yes | Required user capability |
| `menuSlug` | `string` | Yes | Unique menu slug |
| `iconUrl` | `string` | No | Dashicon class or icon URL |
| `position` | `number` | No | Menu position |
| `parentSlug` | `string` | No | Parent menu slug (creates sub-page) |

### `@CustomPostType(slug, options)`

Class decorator. Registers a custom post type on `init` with full label support and REST API integration.

```typescript
@CustomPostType('project', {
  singularName: 'Project',
  pluralName: 'Projects',
  supports: ['title', 'editor', 'thumbnail'],
  hasArchive: true,
  menuIcon: 'dashicons-portfolio',
})
class MyPlugin { ... }
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `singularName` | `string` | **required** | Singular label |
| `pluralName` | `string` | **required** | Plural label |
| `description` | `string` | `''` | Post type description |
| `public` | `boolean` | `true` | Public visibility |
| `showInRest` | `boolean` | `true` | Enable REST API + block editor |
| `hasArchive` | `boolean` | `true` | Enable archive pages |
| `supports` | `string[]` | `['title', 'editor', 'thumbnail']` | Supported features |
| `menuIcon` | `string` | `'dashicons-admin-post'` | Admin menu icon |
| `menuPosition` | `number` | `null` | Menu position |
| `rewriteSlug` | `string` | `null` | Custom URL slug |
| `capabilityType` | `string` | `'post'` | Capability type |

Taxonomies declared with `@CustomTaxonomy` that reference a CPT slug are automatically wired via the `taxonomies` argument in `register_post_type()`.

### `@CustomTaxonomy(slug, options)`

Class decorator. Registers a custom taxonomy on `init`.

```typescript
@CustomTaxonomy('project_type', {
  singularName: 'Project Type',
  pluralName: 'Project Types',
  postTypes: ['project'],
  hierarchical: true,
})
class MyPlugin { ... }
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `singularName` | `string` | **required** | Singular label |
| `pluralName` | `string` | **required** | Plural label |
| `postTypes` | `string \| string[]` | **required** | Associated post types |
| `description` | `string` | `''` | Taxonomy description |
| `public` | `boolean` | `true` | Public visibility |
| `showInRest` | `boolean` | `true` | Enable REST API + block editor |
| `hierarchical` | `boolean` | `false` | Category-like (`true`) or tag-like (`false`) |
| `showAdminColumn` | `boolean` | `true` | Show column in post list table |
| `rewriteSlug` | `string` | `null` | Custom URL slug |

### `@RestRoute(route, options)`

Method decorator. Registers a custom REST API endpoint under `/{text-domain}/v1`.

```typescript
@RestRoute('/products', { method: 'GET', capability: 'read' })
listProducts(request: any): any {
  const posts = getPosts({ post_type: 'product' });
  return posts;
}
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `method` | `'GET' \| 'POST' \| 'PUT' \| 'DELETE'` | **required** | HTTP method |
| `capability` | `string` | `'manage_options'` | Required user capability |

### `@AjaxHandler(action, options?)`

Method decorator. Registers a `wp_ajax_*` handler with automatic nonce verification and capability checks.

```typescript
@AjaxHandler('delete_item', { capability: 'delete_posts' })
handleDelete(): void {
  const id = absint($_POST['item_id']);
  wpSendJsonSuccess({ deleted: true });
}
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `public` | `boolean` | `false` | Also register `wp_ajax_nopriv_*` for logged-out users |
| `capability` | `string` | `'manage_options'` | Required user capability |
| `nonce` | `boolean` | `true` | Auto-inject `check_ajax_referer()` |

Global variables `$_POST`, `$_GET`, and `$_REQUEST` are available for accessing request data.

### `@Shortcode(tag)`

Method decorator. Registers a WordPress shortcode.

```typescript
@Shortcode('greeting')
greetingShortcode(atts: Record<string, string>): string {
  const name = atts['name'] || 'World';
  return '<span>Hello, ' + escHtml(name) + '!</span>';
}
```

Usage in posts: `[greeting name="Alice"]`

The generated PHP wraps attributes with `shortcode_atts()` and includes TODO guidance for defining attribute defaults.

### `@Activate()` / `@Deactivate()`

Method decorators. Run code on plugin activation or deactivation.

```typescript
@Activate()
onActivation(): void {
  addOption('my_plugin_version', '1.0.0');
}

@Deactivate()
onDeactivation(): void {
  deleteOption('my_plugin_installed_at');
}
```

Options created via `addOption()` or `updateOption()` in `@Activate()` methods are automatically detected and added to the generated `uninstall.php` cleanup. Options already covered by `@Setting` are excluded to avoid duplicates.

### Helper Methods

Methods without decorators are automatically included in the generated PHP as helper methods. By default they are placed in the public class. If the source class contains any `@RestRoute` decorator, helpers from that class are placed in the REST API class instead.

```typescript
import { Filter } from 'wpts';

class FfSearch {
  @Filter('posts_clauses', { priority: 20, acceptedArgs: 2 })
  modifySearchClauses(clauses: any, query: any): any {
    const boolQuery = this.buildBooleanQuery(searchTerm);
    // ...
    return clauses;
  }

  // No decorator — auto-included as helper method
  buildBooleanQuery(searchTerm: string): string {
    const words = searchTerm.trim().split(' ');
    let parts: string[] = [];
    for (const word of words) {
      if (word.length > 0) {
        parts.push('+' + word + '*');
      }
    }
    return parts.join(' ');
  }
}
```

Both `modifySearchClauses` and `buildBooleanQuery` end up in the same generated PHP class, so `$this->build_boolean_query()` calls work as expected.

## Admin Pages (React)

Admin page UI is written as React using `@wordpress/components`. It stays as TypeScript/JSX and is bundled by `@wordpress/scripts` — it is **not** transpiled to PHP.

Create `src/admin/index.tsx`:

```tsx
import { createRoot, useState, useEffect } from '@wordpress/element';
import { Panel, PanelBody, TextControl, Button, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';

function SettingsPage() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // REST endpoint auto-generated from @Setting decorators
    apiFetch({ path: '/my-plugin/v1/settings' }).then((data: any) => {
      setMessage(data.message);
      setLoading(false);
    });
  }, []);

  const save = async () => {
    setSaving(true);
    await apiFetch({
      path: '/my-plugin/v1/settings',
      method: 'POST',
      data: { message },
    });
    setSaving(false);
  };

  if (loading) return <Spinner />;

  return (
    <div className="wrap">
      <h1>{__('My Plugin Settings', 'my-plugin')}</h1>
      <Panel>
        <PanelBody title={__('General', 'my-plugin')}>
          <TextControl
            label={__('Message', 'my-plugin')}
            value={message}
            onChange={setMessage}
          />
        </PanelBody>
      </Panel>
      <Button variant="primary" onClick={save} isBusy={saving}>
        {__('Save', 'my-plugin')}
      </Button>
    </div>
  );
}

const rootElement = document.getElementById('wpts-admin-app');
if (rootElement) {
  createRoot(rootElement).render(<SettingsPage />);
}
```

The generated PHP admin class automatically:
- Registers the page with a `<div id="wpts-admin-app">` container
- Enqueues the React bundle from `admin/js/build/index.js`
- Loads `wp-components` styles

## TypeScript to PHP Transpilation

### Supported Constructs

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
| `enum Direction { Up }` | `class Direction { const UP = 0; }` |
| `Direction.Up` | `Direction::UP` |
| `for (const { id } of items)` | `foreach ( $items as $__item ) { $id = $__item['id']; }` |
| `arr.reduce(fn, init)` | `array_reduce( $arr, fn, init )` |
| `arr.some(fn)` | `count( array_filter( $arr, fn ) ) > 0` |
| `arr.every(fn)` | `count( array_filter( $arr, fn ) ) === count( $arr )` |
| `str.indexOf('x')` | `strpos( $str, 'x' )` |
| `str.includes('x')` | `str_contains( $str, 'x' )` |

WordPress API functions are automatically mapped from camelCase to snake_case PHP equivalents.

### Not Supported (MVP)

- `async/await`, Promises
- `class` declarations (use `@Plugin` class)
- Nested destructuring (`const { a: { b } } = obj`), rest elements (`const [first, ...rest] = arr`)
- Regular expressions
- Generics

Unsupported constructs emit helpful comments in the PHP output, e.g.:
```php
/* WPTS: async/await is not supported. Use synchronous WordPress API calls instead. */
```

## Available WordPress Functions

All functions are written in camelCase in TypeScript and transpiled to snake_case PHP.

| Category | Functions |
|----------|-----------|
| **Options** | `addOption`, `getOption`, `updateOption`, `deleteOption` |
| **Escaping** | `escHtml`, `escAttr`, `escUrl`, `escJs`, `escTextarea`, `wpKses`, `wpKsesPost` |
| **Sanitization** | `sanitizeUser`, `sanitizeTextField`, `sanitizeTextareaField`, `sanitizeTitle`, `sanitizeEmail`, `sanitizeFileName`, `sanitizeKey` |
| **Enqueueing** | `wpEnqueueStyle`, `wpEnqueueScript`, `wpRegisterStyle`, `wpRegisterScript`, `wpLocalizeScript` |
| **Hooks** | `addAction`, `addFilter`, `doAction`, `applyFilters`, `removeAction`, `removeFilter`, `addShortcode` |
| **Settings API** | `registerSetting`, `addSettingsSection`, `addSettingsField`, `settingsFields`, `doSettingsSections`, `submitButton` |
| **Admin Pages** | `addMenuPage`, `addSubmenuPage`, `addOptionsPage` |
| **Conditionals** | `isSingle`, `isPage`, `isAdmin`, `isFrontPage`, `isHome`, `isArchive`, `isCategory`, `isTag`, `isSingular` |
| **User** | `currentUserCan`, `getCurrentUserId`, `isUserLoggedIn`, `getUserBy`, `getUsers`, `usernameExists`, `wpInsertUser`, `wpGetCurrentUser`, `wpGeneratePassword`, `wpHashPassword`, `wpCheckPassword`, `wpSetCurrentUser`, `getTheAuthorMeta` |
| **Nonces** | `wpCreateNonce`, `wpVerifyNonce`, `wpNonceField`, `checkAdminReferer` |
| **Transients** | `getTransient`, `setTransient`, `deleteTransient` |
| **Posts** | `getPost`, `getPosts`, `getTheId`, `getTheTitle`, `getTheContent`, `getPermalink`, `wpGetPostParentId` |
| **URLs** | `adminUrl`, `homeUrl`, `siteUrl`, `contentUrl` |
| **Plugin** | `pluginDirUrl`, `pluginDirPath`, `pluginBasename` |
| **i18n** | `__`, `_e`, `_x`, `_ex`, `_n`, `_nx`, `escHtml__`, `escHtmlE`, `escHtmlX`, `escAttr__`, `escAttrE`, `escAttrX`, `loadPluginTextdomain` |
| **HTTP API** | `wpRemoteGet`, `wpRemotePost`, `wpRemoteHead`, `wpRemoteRequest`, `wpSafeRemoteGet`, `wpSafeRemotePost`, `wpSafeRemoteHead`, `wpSafeRemoteRequest`, `wpRemoteRetrieveBody`, `wpRemoteRetrieveResponseCode`, `wpRemoteRetrieveResponseMessage`, `wpRemoteRetrieveHeader`, `wpRemoteRetrieveHeaders`, `wpRemoteRetrieveCookies`, `isWpError` |
| **Metadata** | `getPostMeta`, `addPostMeta`, `updatePostMeta`, `deletePostMeta`, `getUserMeta`, `addUserMeta`, `updateUserMeta`, `deleteUserMeta`, `getTermMeta`, `addTermMeta`, `updateTermMeta`, `deleteTermMeta`, `getCommentMeta`, `addCommentMeta`, `updateCommentMeta`, `deleteCommentMeta`, `getMetadata`, `addMetadata`, `updateMetadata`, `deleteMetadata` |
| **CPT / Taxonomy** | `registerPostType`, `registerTaxonomy`, `wpDeletePost`, `wpCountPosts` |
| **AJAX** | `checkAjaxReferer`, `$_POST`, `$_GET`, `$_REQUEST` |
| **JSON Response** | `wpSendJson`, `wpSendJsonSuccess`, `wpSendJsonError` |
| **REST API** | `restEnsureResponse` |
| **Utility** | `wpRand` |
| **PHP Built-ins** | `classExists`, `functionExists`, `isArray`, `jsonEncode`, `jsonDecode`, `base64Encode`, `base64Decode`, `hashHmac`, `hashEquals`, `md5`, `intval`, `strval`, `strtolower`, `strtr`, `rtrim`, `time`, `getallheaders`, `header` |
| **Misc** | `wpDie`, `wpRedirect`, `wpSafeRedirect`, `absint`, `wpUnslash`, `echo` |
| **WooCommerce Conditionals** | `isWoocommerce`, `isShop`, `isProduct`, `isCart`, `isCheckout`, `isAccountPage`, `isWcEndpointUrl` |
| **WooCommerce Products** | `wcGetProduct`, `wcGetProducts`, `wcGetProductIdBySku` |
| **WooCommerce Orders** | `wcGetOrder`, `wcGetOrders`, `wcCreateOrder` |
| **WooCommerce Helpers** | `wcPrice`, `wcClean`, `wcGetPageId`, `wcGetPagePermalink`, `wcGetEndpointUrl`, `wcGetCheckoutUrl`, `wcGetCartUrl` |
| **WooCommerce Customer** | `wcCustomerBoughtProduct`, `wcGetCustomerOrderCount` |
| **WooCommerce Notices** | `wcAddNotice`, `wcPrintNotices`, `wcHasNotice` |
| **WooCommerce Taxonomy** | `wcGetAttributeTaxonomies`, `wcGetProductTerms` |
| **WooCommerce Templates** | `wcGetTemplatePart`, `wcGetTemplate` |
| **Database** | `wpdb.prefix`, `wpdb.posts`, `wpdb.prepare()`, `wpdb.query()`, `wpdb.getVar()`, `wpdb.getRow()`, `wpdb.getResults()`, `wpdb.insert()`, `wpdb.update()`, `wpdb.delete()`, `wpdb.escLike()` |

Full type declarations are in `src/runtime/wp-types.ts` for IDE autocompletion.

When you use `wpdb` in TypeScript, the transpiler automatically injects `global $wpdb;` at the start of the generated PHP method.

WooCommerce functions are only available at runtime when WooCommerce is active. Guard usage with `isWoocommerce()` or check `is_plugin_active('woocommerce/woocommerce.php')` in your activation hook.

## Examples

See the `examples/` directory:

- **`hello-world/`** — Simple plugin with one admin page, two settings, action, filter, and shortcode.
- **`settings-demo/`** — Advanced example with 5 setting types, multiple admin pages (main page + sub-page), tabbed React UI.

Build an example:

```bash
npx wpts build examples/hello-world/src/plugin.ts -o /tmp/hello-world --clean
```

## License

MIT
