---
globs: packages/headless-*/src/**
---

# Headless Plugin Authoring

These guardrails apply to all wpts-based headless plugins.

## Multi-File Architecture

- `plugin.ts` is always the entry file — exactly one `@Plugin` decorator across all files
- Route/feature files are imported via side-effect: `import './feature-name.js'` (filenames vary per plugin: config-routes, diagnostics-routes, track-routes, etc.)
- Import extensions must be `.js` (not `.ts`) — ESM resolution in transpiled output
- Check each plugin's own CLAUDE.md for its specific option key prefix, data model, and API flow
- Shared helpers between `@RestRoute` and `@Action`/`@Filter` methods must live in **separate TS classes** (one per generated PHP class). wpts places a class's non-decorated helpers into a single PHP class — REST API class if the TS class has any `@RestRoute`, otherwise Public. Mixing decorator types in one class leaves `@Action` handlers unable to call `this.helper()`. When the helper is genuinely needed on both sides, duplicate it into each TS class (see `headless-storefront/src/config-routes.ts` + `revalidate-hooks.ts`).

## Decorator Patterns

- `@Setting({ sensitive: true })` — masks value in GET /settings (returns `'********'`)
- `@Setting({ exposeInConfig: true })` — auto-generates public GET /config route (skipped if manual @RestRoute('/config') exists)
- `@Setting({ wooCurrencyDefault: true })` — auto-detects WooCommerce currency as default
- `@Plugin({ wooNotice: 'recommended' | 'required' })` — auto-generates WooCommerce dependency admin notice
- `@Plugin({ githubRepo: '<owner>/<repo>' })` — opts into GitHub Releases auto-updates via WP 5.8+ `Update URI` header; emits a dedicated `class-<slug>-updater.php` that hooks `update_plugins_{hostname}` + `plugins_api`

## WooCommerce Integration

- Hook: `woocommerce_order_status_changed` with post-meta flag for deduplication
- Only set dedup flag on successful delivery — allows retry on next status change if external API was unreachable

## HTTP Requests

- User-configurable URLs: use `wpSafeRemotePost` / `wpSafeRemoteGet` (SSRF protection)
- Hardcoded vendor URLs (Google, Meta, Umami): `wpRemotePost` / `wpRemoteGet` is acceptable

## Admin UI

- `admin/index.tsx` creates React root on `#<text-domain>-admin-app` (e.g. `#headless-auth-admin-app`)
- `admin/SettingsPage.tsx` composes `useSettings` + `SettingsShell` from `admin-ui` package
- Tab definitions in `admin/types.ts`

## Build Workflow

- After any source change: `pnpm --filter <plugin> build`
- Commit the updated `dist/` directory alongside source changes — dist is tracked in git
