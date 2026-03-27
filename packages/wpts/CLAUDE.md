# wpts — TypeScript to WordPress Plugin Transpiler

Transpiles decorator-annotated TypeScript into WordPress plugins with PHP backend, React admin UI, REST API, and boilerplate.

## Commands

- `pnpm build` — Compile TypeScript + copy Handlebars templates to dist/
- `pnpm test` — Run tests with Vitest
- `pnpm dev` — Watch mode compilation
- `pnpm test:watch` — Watch mode tests

## Architecture

Pipeline: Parse → Extract Decorators (all user source files) → Build IR → Generate PHP → Build Admin React (if @AdminPage)

Multi-file support: imports are resolved by `ts.Program`; `getUserSourceFiles()` filters to user files; `extractDecoratorsFromFiles()` merges decorators across all files. Exactly one `@Plugin` required across all files.

Key paths:
- `src/compiler/` — Parser, decorator extractor, pipeline, diagnostics
- `src/transpiler/` — Expression/statement/function transpilers, WP function map
- `src/generator/` — Plugin file generator using Handlebars templates
- `src/templates/` — Handlebars templates (.hbs) for PHP output
- `src/ir/` — PluginIR intermediate representation types
- `src/runtime/` — wp-types.ts ambient declarations for WordPress API

## Adding WordPress Functions

To add a new WordPress function mapping:
1. Add camelCase→snake_case entry to `src/transpiler/wp-function-map.ts`
2. Add `declare function` to `src/runtime/wp-types.ts`
3. Add test to `tests/unit/transpiler/expression-transpiler.test.ts`
4. Add to README.md functions table

## Testing

- TypeScript: `npx tsc --noEmit` (type checking)
- Tests: `pnpm test` (Vitest — unit + integration)
- Build: `pnpm build` (compile + copy templates)
- All three must pass before changes are complete

## Conventions

- WordPress functions use camelCase in TS, mapped to snake_case PHP
- Test pattern: `transpile('tsCode', 'declarations')` → expected PHP string
- Diagnostic codes: WPTS### (e.g., WPTS001 for missing @Plugin)
- Settings auto-sanitize: string→sanitize_text_field, number→absint, boolean→rest_sanitize_boolean
- REST API sanitize null guard: returns `WP_Error` with 400 when sanitize callback returns null
- Admin template: `get_current_screen()` null-guarded with ternary
- Admin auto-build: pipeline runs `pnpm exec wp-scripts build` from the plugin directory using workspace-level `@wordpress/scripts`
- Integration tests use `skipAdminBuild: true` to avoid timeouts
- Decorators: @Plugin, @Action, @Filter, @Setting, @AdminPage, @Shortcode, @Activate, @Deactivate, @CustomPostType, @CustomTaxonomy, @RestRoute, @AjaxHandler, @DiagnosticsRoute
- Helper methods: non-decorated class methods are auto-captured; placed in public class by default, or REST API class if the class has @RestRoute
- `global $wpdb;`: auto-injected by `injectGlobalWpdb()` in `function-transpiler.ts` when transpiled PHP contains `$wpdb`
- Action parameters: extracted same as filter parameters; `acceptedArgs` defaults to method parameter count
- `@Setting({ sensitive: true })`: masks value in auto-generated GET /settings response — returns `'********'` if set, `''` if empty. The raw value is still stored and used server-side; only the REST GET response is masked.
- `@Plugin({ wooNotice: 'recommended' | 'required' })`: auto-generates an `admin_notices` action with a WooCommerce dependency notice. `'recommended'` → `notice-warning`, `'required'` → `notice-error`.
- `@Setting({ exposeInConfig: true })`: includes the setting in an auto-generated public `GET /config` REST route. Skipped if a manual `@RestRoute('/config', ...)` exists.
- `@Setting({ wooCurrencyDefault: true })`: auto-generates a `default_option_{optionName}` filter that returns the WooCommerce currency when WooCommerce is active.
- `@DiagnosticsRoute({ errorOptionSuffix?: string })`: class decorator that auto-generates a `GET /diagnostics/last-error` admin REST route. Default suffix: `'last_error'`.
- Undefined array key checks: `obj['key'] !== undefined` transpiles to `isset( $obj['key'] )` (not `$obj['key'] !== null`) for PHP 8 compatibility. Only applies to element/property access, not plain variables.
