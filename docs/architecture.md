# Architecture Guide

## Overview

This is a Turborepo monorepo using pnpm workspaces. All packages live in `packages/` and fall into four categories:

| Type | Packages | Purpose |
|------|----------|---------|
| **Transpiler** | [wpts](../packages/wpts/) | TypeScript-to-WordPress-Plugin transpiler (MIT licensed) |
| **Shared UI** | [admin-ui](../packages/admin-ui/) | React components and hooks for plugin admin pages |
| **Plugins** | 8 `headless-*` packages | WordPress plugins built with wpts |
| **Testing** | [e2e](../packages/e2e/) | Playwright end-to-end tests against wp-env |

## Package Map

```
┌──────────────────────────────────────────────────────────────────┐
│                        Monorepo                                  │
│                                                                  │
│  ┌─────────────┐     ┌──────────────┐                           │
│  │    wpts     │     │   admin-ui   │                           │
│  │ (transpiler)│     │ (React lib)  │                           │
│  └──────┬──────┘     └──────┬───────┘                           │
│         │                   │                                    │
│         │ transpiles TS→PHP │ imported by                        │
│         │                   │                                    │
│  ┌──────▼───────────────────▼────────────────────────────────┐  │
│  │                   8 Headless Plugins                       │  │
│  │                                                            │  │
│  │  headless-auth          headless-google-analytics          │  │
│  │  headless-fuzzy-find    headless-umami                     │  │
│  │  headless-meta-pixel    headless-pos-sessions              │  │
│  │  headless-clarity       headless-wishlist                  │  │
│  └────────────────────────────┬───────────────────────────────┘  │
│                               │                                  │
│                               │ tested by                        │
│                               │                                  │
│                    ┌──────────▼──────────┐                       │
│                    │     e2e (tests)     │                       │
│                    │ Playwright + wp-env │                       │
│                    └────────────────────-┘                       │
└──────────────────────────────────────────────────────────────────┘
```

- **wpts** transpiles TypeScript decorators into PHP plugin files
- **admin-ui** provides `useSettings`, `SettingsShell`, `DiagnosticsPanel`, and other React components used by plugin admin pages
- **headless-wishlist** is the exception — it uses `FormSection` from admin-ui but not `SettingsShell` or `useSettings`, because it has no configurable settings (analytics dashboard only)

## Build Pipeline

Turbo's `dependsOn: ["^build"]` ensures packages build in the correct order:

```
1. wpts         (TypeScript → dist/)
2. admin-ui     (TypeScript → dist/)
3. All 8 plugins build in parallel
   └── Each plugin: wpts build src/plugin.ts -o dist
```

### Plugin Build Steps

When `wpts build` runs for a plugin:

1. **Parse** — TypeScript compiler reads the entry file (`src/plugin.ts`) and all its imports
2. **Extract** — Decorator metadata is extracted and merged across all source files
3. **Build IR** — An intermediate representation of the plugin is constructed
4. **Generate PHP** — Handlebars templates (`.hbs`) render the IR into PHP classes and boilerplate
5. **Build Admin React** — If `@AdminPage` is detected, copies `src/admin/` into the output directory and runs `wp-scripts build` to bundle the React UI

Output is a complete WordPress plugin directory in `dist/<plugin-slug>/`, ready to install.

## How wpts Transpilation Works

wpts converts decorated TypeScript classes into a standard WordPress plugin with PHP backend code. The key concept is **decorators as declarations**:

```typescript
// Input: TypeScript with decorators
@Plugin({ name: 'My Plugin', version: '1.0.0', ... })
class MyPlugin {
  @Setting({ key: 'api_key', type: 'string', default: '', label: 'API Key' })
  apiKey: string = '';

  @Action('init')
  initialize(): void {
    loadPluginTextdomain('my-plugin', false, 'my-plugin/languages');
  }
}
```

This generates:
- Plugin header file with WordPress metadata
- `register_setting()` calls with sanitization
- REST API endpoints for settings CRUD
- `add_action()` hooks with transpiled PHP method bodies
- Activator, deactivator, and uninstall cleanup

Function bodies are transpiled from TypeScript to PHP (e.g., `getOption()` → `get_option()`, `arr.push(x)` → `array_push($arr, $x)`). See the [Transpilation Reference](../packages/wpts/docs/transpilation.md) for the full mapping.

Multi-file plugins split decorators across files. The transpiler resolves imports and merges all decorators into a single plugin output. See the [Decorator API](../packages/wpts/docs/decorator-api.md) for all 14 decorators.

## How admin-ui Is Consumed

admin-ui is a React component library compiled with plain `tsc` to `dist/`. It is **not** a WordPress plugin — it's consumed at build time:

1. Plugin's `package.json` declares `"admin-ui": "workspace:*"` as a dev dependency
2. Plugin's `src/admin/index.tsx` imports from `admin-ui`:
   ```tsx
   import { SettingsShell, useSettings } from 'admin-ui';
   ```
3. During `wpts build`, the admin source is copied into the plugin output directory
4. `wp-scripts build` bundles admin-ui components into the plugin's `admin/js/build/index.js`
5. At runtime, WordPress provides `@wordpress/components`, `@wordpress/element`, `@wordpress/i18n`, and `@wordpress/api-fetch` as peer dependencies

Breaking changes to admin-ui affect all 7 plugin admin UIs — test across plugins after changes.

## How e2e Tests Work

End-to-end tests use Playwright against a WordPress instance running in Docker via [wp-env](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-env/).

- **`.wp-env.json`** in `packages/e2e/` maps all plugin `dist/` directories as WordPress plugins
- **Global setup** (`global-setup.ts`) authenticates as admin, activates all plugins, configures WooCommerce, and creates test products
- **Shared tests** iterate a `PLUGINS` array from `utils/settings.ts` — these run the same assertions (activation, settings page, REST API health) across every plugin
- **Plugin-specific tests** live in `tests/<slug>/` for endpoint-specific behavior

```bash
pnpm test:e2e                    # Run all e2e tests
pnpm --filter e2e test:ui        # Playwright UI mode (interactive)
```

Requires Docker to be running.

## Creating a New Plugin

1. **Scaffold** the plugin:
   ```bash
   cd packages
   npx wpts init headless-<name> --name "Headless <Name>" --slug headless-<name>
   ```

2. **Add workspace dependencies** to `package.json`:
   ```json
   {
     "devDependencies": {
       "wpts": "workspace:*",
       "admin-ui": "workspace:*",
       "@wordpress/scripts": "^31.5.0",
       "@wordpress/components": "^32.2.0",
       "@wordpress/element": "^6.40.0",
       "@wordpress/env": "^10.0.0"
     }
   }
   ```

3. **Write source** — `src/plugin.ts` with decorators, `src/admin/index.tsx` with React UI

4. **Add build scripts** to `package.json`:
   ```json
   {
     "scripts": {
       "build": "wpts build src/plugin.ts -o dist",
       "dev": "wpts watch src/plugin.ts -o dist",
       "wp-env:start": "wp-env start",
       "wp-env:stop": "wp-env stop"
     }
   }
   ```

5. **Build and test**:
   ```bash
   pnpm --filter headless-<name> build
   pnpm --filter headless-<name> wp-env:start
   ```

6. **Add to e2e** — Update `packages/e2e/.wp-env.json` to map the new plugin's dist, and add the plugin to the `PLUGINS` array in `packages/e2e/utils/settings.ts`

7. **Add to root README** — Add a row to the Packages table in `README.md`

8. **Commit dist/** — Plugin packages track generated output in `dist/` so diffs are reviewable
