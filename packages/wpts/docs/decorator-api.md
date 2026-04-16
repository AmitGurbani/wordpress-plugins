# Decorator API

## `@Plugin(options)`

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
| `wooNotice` | `'recommended' \| 'required'` | No | Auto-generate a WooCommerce dependency admin notice. `'recommended'` shows a warning; `'required'` shows an error. |
| `githubRepo` | `string` | No | Opt into GitHub Releases auto-updates. Format `<owner>/<repo>` (case-sensitive). Emits the `Update URI` plugin header and a self-contained updater class that hooks `update_plugins_{hostname}` + `plugins_api` (WP 5.8+). |
| `updateUri` | `string` | No | Override the `Update URI` value. Derived from `githubRepo` + `slug` when omitted. Hostname must not be `wordpress.org` (WP core short-circuits). Requires `githubRepo`. |

## `@Setting(options)`

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
| `sensitive` | `boolean` | No | Mask value in GET /settings response (returns `'********'` when set, `''` when empty) |
| `exposeInConfig` | `boolean` | No | Include this setting in an auto-generated public `GET /config` endpoint |
| `wooCurrencyDefault` | `boolean` | No | Auto-generate a `default_option` filter that returns the WooCommerce currency when active |

Each `@Setting` generates:
- `register_setting()` call with sanitization
- REST API GET/POST at `/{text-domain}/v1/settings`
- If a sanitize callback returns null (invalid input), the REST API returns HTTP 400 with a `WP_Error`

## `@Action(hookName, options?)`

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

## `@Filter(hookName, options?)`

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

## `@AdminPage(options)`

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

## `@CustomPostType(slug, options)`

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

## `@CustomTaxonomy(slug, options)`

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

## `@RestRoute(route, options)`

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

## `@AjaxHandler(action, options?)`

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

## `@Shortcode(tag)`

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

## `@Activate()` / `@Deactivate()`

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

## `@DiagnosticsRoute(options?)`

Class decorator. Auto-generates a `GET /diagnostics/last-error` admin REST endpoint that returns the value of a stored error option.

```typescript
import { DiagnosticsRoute, RestRoute } from 'wpts';

@DiagnosticsRoute()
class MyPluginDiagnostics {
  // Additional diagnostic routes can be added manually:
  @RestRoute('/diagnostics/test', { method: 'POST', capability: 'manage_options' })
  testConnection(request: any): any {
    // ...
  }
}
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `errorOptionSuffix` | `string` | `'last_error'` | Suffix for the error option key (`{plugin_prefix}{suffix}`) |

The generated endpoint reads `get_option('{plugin_prefix}{errorOptionSuffix}', '')` and returns it wrapped in `rest_ensure_response()`. Override the suffix when the error option doesn't follow the default naming:

```typescript
@DiagnosticsRoute({ errorOptionSuffix: 'last_capi_error' })
class MyDiagnostics {}
```

## Helper Methods

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
