---
name: wp-plugin-review
description: Review generated WordPress plugin PHP code for security, performance, WordPress.org compliance, WooCommerce best practices, and coding standards. Use after building a plugin to review the dist/ output.
argument-hint: [plugin-name]
---

Review the generated WordPress plugin `$ARGUMENTS` against WordPress industry standards.

## Context

This monorepo uses a custom TypeScript-to-PHP transpiler (`wpts`). Plugins are authored in TypeScript with decorators and transpiled to complete WordPress plugins. The generated PHP lives in `packages/<plugin>/dist/<plugin-slug>/`.

Every finding you report must be attributed to a **fix location**:
- **Template** — fix in `packages/wpts/src/templates/*.hbs` (Handlebars templates shared by ALL plugins)
- **Transpiler** — fix in `packages/wpts/src/transpiler/` (TS-to-PHP conversion logic)
- **Source** — fix in `packages/<plugin>/src/*.ts` (plugin-specific TypeScript)
- **Metadata** — fix in `@Plugin()` or `@Setting()` decorator arguments in the TypeScript source

## Input

`$ARGUMENTS` can be:
- A plugin name (e.g., `headless-umami`) — resolves to `packages/headless-umami/dist/headless-umami/`
- Empty — review all plugins in `packages/*/dist/`

## Workflow

1. **Resolve plugin path** from `$ARGUMENTS`. If empty, glob `packages/*/dist/*/` to find all plugins.
2. **Discover files** — glob for `*.php` and `readme.txt` in the plugin dist directory.
3. **Read all PHP files** — most are under 200 lines. For files over 300 lines, use offset/limit.
4. **Read TypeScript source** — read `packages/<plugin>/src/*.ts` for attribution context.
5. **Run pattern checks** per category using Grep across the dist files.
6. **Cross-reference with templates** — when a finding appears in boilerplate code, check if it originates from `packages/wpts/src/templates/*.hbs`.
7. **Produce structured report** with severity, attribution, and fix recommendations.

## Review Categories

### 1. Security (CRITICAL)

Check for these vulnerabilities in all PHP files:

**SQL Injection:**
- Flag any `$wpdb->query()`, `$wpdb->get_results()`, `$wpdb->get_var()`, `$wpdb->get_row()`, `$wpdb->get_col()` that does NOT use `$wpdb->prepare()`
- For LIKE clauses, verify `$wpdb->esc_like()` is used before `$wpdb->prepare()`

**Cross-Site Scripting (XSS):**
- Flag any `echo` or `print` of dynamic data without an escaping function
- Valid escaping functions: `esc_html()`, `esc_attr()`, `esc_url()`, `esc_js()`, `esc_textarea()`, `esc_xml()`, `wp_kses()`, `wp_kses_post()`
- Localized variants are also valid: `esc_html__()`, `esc_html_e()`, `esc_attr__()`, `esc_attr_e()`

**Authorization & CSRF:**
- REST routes that modify data (POST, PUT, DELETE) must have a `permission_callback` that checks `current_user_can()`
- Form submissions and AJAX handlers must verify nonces via `check_admin_referer()`, `check_ajax_referer()`, or `wp_verify_nonce()`
- `is_admin()` is NOT a security check — it only checks if the request is to an admin page, not the user's role

**Server-Side Request Forgery (SSRF):**
- If a URL used in `wp_remote_post()` or `wp_remote_get()` comes from user-configurable settings, it MUST use `wp_safe_remote_post()` / `wp_safe_remote_get()` instead

**Data Sanitization:**
- Direct access to `$_GET`, `$_POST`, `$_REQUEST`, `$_COOKIE`, `$_SERVER` must be immediately sanitized
- Settings that store URLs must use `esc_url_raw()` or `sanitize_url()`, NOT `sanitize_text_field()`
- Settings that store email must use `sanitize_email()`
- REST API route args should define `sanitize_callback` and `validate_callback`

**Sensitive Data:**
- API keys, secrets, and tokens must be masked (e.g., `'********'`) in REST GET responses
- Check `get_settings()` methods for unmasked sensitive values

**Dangerous Functions:**
- Flag: `extract()`, `unserialize()` (use `json_decode()` instead), `create_function()`, `preg_replace()` with `e` modifier
- Flag any PHP shell/process invocation functions

### 2. WordPress.org Plugin Review Guidelines (CRITICAL/WARNING)

**Guideline 1 — GPL License:**
- Plugin header must declare `License: GPL-2.0+` or `License: GPL-3.0+`
- `License URI` must point to the correct GPL URL

**Guideline 4 — Code Readability:**
- Generated PHP must be human-readable (no minified variable names, no obfuscation)
- readme.txt should link to a public repository with the original TypeScript source

**Guideline 7 — No Tracking Without Consent:**
- Any `wp_remote_post` / `wp_remote_get` to external services must be user-initiated or explicitly consented to
- Check for any "phoning home" behavior (analytics, telemetry) without opt-in

**Guideline 8 — No External Code Loading:**
- No loading JS/CSS from external CDNs
- All assets must be bundled locally within the plugin

**Guideline 13 — Use WordPress Default Libraries:**
- Must not bundle copies of jQuery, React, or other WP-bundled libraries
- The admin UI built via `wp-scripts` correctly handles this — do not flag it

**Guideline 17 — Trademark Compliance:**
- Plugin name/slug cannot start with "WordPress" or "WooCommerce"

**Direct File Access Guard:**
- EVERY `.php` file must have `defined('WPINC')` or `defined('ABSPATH')` guard near the top

**Plugin Header:**
- Must include: Plugin Name, Description, Version, Author, License, License URI, Text Domain, Domain Path, Requires at least, Requires PHP

**Uninstall Cleanup:**
- `uninstall.php` must exist and clean up ALL plugin options, transients, and custom tables

**Unique Prefixes:**
- All global functions, classes, and constants must have a unique prefix matching the plugin slug
- Must NOT use `wp_`, `wordpress_`, `__`, or `_` as prefixes

**Version Consistency:**
- Version in plugin header must match `Stable tag` in readme.txt and the defined `*_VERSION` constant

**HTTP API:**
- Must use `wp_remote_get()` / `wp_remote_post()` for HTTP requests, not raw cURL or `file_get_contents()`

### 3. WooCommerce Best Practices (WARNING/CRITICAL)

**HPOS Compatibility (CRITICAL):**
- Flag `get_post_meta( $order_id, ... )` — must use `$order->get_meta( 'key', true )`
- Flag `update_post_meta( $order_id, ... )` — must use `$order->update_meta_data( 'key', 'value' )` followed by `$order->save()`
- Flag `delete_post_meta( $order_id, ... )` — must use `$order->delete_meta_data( 'key' )` followed by `$order->save()`
- Flag `get_post( $order_id )` — must use `wc_get_order( $order_id )`
- No direct SQL queries against `wp_posts` or `wp_postmeta` for order data

**HPOS Compatibility Declaration:**
- Plugin that uses WooCommerce hooks must declare HPOS compatibility in the main plugin file:
  ```php
  add_action( 'before_woocommerce_init', function() {
      if ( class_exists( \Automattic\WooCommerce\Utilities\FeaturesUtil::class ) ) {
          \Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility( 'custom_order_tables', __FILE__, true );
      }
  } );
  ```

**WooCommerce Guards:**
- WooCommerce-specific code should be guarded with `class_exists('WooCommerce')` or similar checks

**Purchase Hook Deduplication:**
- `woocommerce_order_status_changed` can fire multiple times for the same order
- Must implement flag-based deduplication to prevent duplicate events

### 4. Performance (WARNING)

- `wp_remote_post()` / `wp_remote_get()` must include explicit `'timeout'` parameter
- `json_encode()` should be `wp_json_encode()` — it handles UTF-8 edge cases and returns `false` on encoding errors instead of corrupted output
- Avoid heavy operations (DB queries, HTTP requests) in frequently-fired hooks like `init`, `wp_loaded`, `plugins_loaded`
- Check for repeated `get_option()` calls for the same key within a single method — cache in a local variable
- Options that are only needed on specific pages should consider `autoload => false`

### 5. WordPress Coding Standards (INFO)

- Class naming: `Plugin_Name_Component` PascalCase with underscores
- Method naming: `snake_case`
- File naming: `class-plugin-name-component.php`
- Text domain must be consistent across all `__()`, `_e()`, `esc_html__()` calls and match the plugin slug
- PHPDoc blocks on classes and public methods
- Yoda conditions: `null === $value` not `$value === null`
- Indentation: tabs (WordPress standard), not spaces

### 6. Metadata & readme.txt (WARNING/INFO)

- **Version consistency**: plugin header Version, readme.txt `Stable tag`, and defined `*_VERSION` constant must all match
- **Empty fields**: flag empty `Plugin URI` and `Author URI`
- **Generic author**: flag `Author: wpts` — should be the actual plugin author
- **Generic tags**: flag `Tags: wordpress, plugin` — should be specific to the plugin's functionality
- **Tested up to**: should reference a recent WordPress version (6.x)
- **Required readme.txt sections**: Description, Installation, Changelog
- **Contributors**: should be real WordPress.org usernames, not `wpts`

## Known-Correct Patterns — Do NOT Flag

These patterns are intentional and correct. Suppress findings for:

- `'permission_callback' => '__return_true'` on **read-only GET** routes (e.g., GET `/config`) — these are public data endpoints
- `if ( null === $value )` after `sanitize_text_field()` — this is a defensive guard generated by the template; `sanitize_text_field` never returns null in practice
- The Loader pattern with deferred hook registration (`add_action`/`add_filter` stored in arrays, fired in `run()`) — this is the WordPress Plugin Boilerplate architecture
- `rest_ensure_response()` wrapping on REST callbacks — correct pattern
- `esc_attr( $page )` in `render_admin_page()` — correct escaping for the admin page slug
- `wp_safe_remote_post()` / `wp_safe_remote_get()` — these are already the correct SSRF-safe functions; do not suggest further changes
- React admin UI loaded via `wp-scripts` with `wp_enqueue_script()` and asset file — this correctly uses WP-bundled React/ReactDOM dependencies
- Empty `index.php` files in subdirectories — these are directory listing prevention files (correct practice)

## Output Format

Produce your report in this exact format:

```markdown
## Plugin Review: <plugin-name>

### Summary
- **Files reviewed:** N
- **Findings:** X critical, Y warnings, Z info
- **Overall:** PASS | NEEDS ATTENTION | FAIL

### Critical Findings

#### [CRITICAL] <Category>: <Title>
- **File:** `<relative-path>:<line>`
- **Issue:** <Clear description of what's wrong>
- **Fix location:** template | transpiler | source | metadata (`<specific file to modify>`)
- **Recommendation:** <Specific fix with code example if applicable>

### Warnings

#### [WARNING] <Category>: <Title>
- **File:** `<relative-path>:<line>`
- **Issue:** <description>
- **Fix location:** <location> (`<specific file>`)
- **Recommendation:** <what to change>

### Informational

#### [INFO] <Category>: <Title>
- **File:** `<relative-path>:<line>`
- **Issue:** <description>
- **Recommendation:** <suggestion>

### Validated Patterns
- [PASS] <pattern description>
- [PASS] <pattern description>
```

**Severity guidelines:**
- **CRITICAL** — security vulnerabilities, HPOS incompatibility, WordPress.org rejection blockers
- **WARNING** — best practice violations, performance issues, metadata problems
- **INFO** — coding standard suggestions, minor improvements

**Overall rating:**
- **PASS** — 0 critical, 0-2 warnings
- **NEEDS ATTENTION** — 0 critical, 3+ warnings OR 1 critical
- **FAIL** — 2+ critical findings
