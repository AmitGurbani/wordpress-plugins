# E2E Tests

Playwright end-to-end tests for all plugins in this monorepo, running against a [wp-env](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-env/) WordPress instance.

## Prerequisites

- Docker (required by wp-env)
- Node.js >= 20
- All plugin `dist/` directories built (`turbo run build` from the repo root)

## Quick Start

```bash
# From repo root
pnpm install
turbo run build
pnpm test:e2e
```

Or run directly from this package:

```bash
pnpm --filter e2e test
```

## Scripts

| Script | Description |
|--------|-------------|
| `test` | Run all Playwright tests |
| `test:ui` | Open Playwright UI mode |
| `test:debug` | Run tests with Playwright inspector |
| `test:e2e` | Alias for `test` (used by turbo pipeline) |
| `wp-env:start` | Start the WordPress environment |
| `wp-env:stop` | Stop the WordPress environment |
| `wp-env:clean` | Destroy all wp-env data |

## Test Structure

```
tests/
  smoke.spec.ts              # Basic health checks
  shared/                    # Tests that run against every plugin
    admin-page-load.spec.ts
    diagnostics.spec.ts
    settings-crud.spec.ts
  headless-clarity/
  headless-fuzzy-find/
  headless-google-analytics/
  headless-meta-pixel/
  headless-auth/
  headless-umami/
fixtures/
  woocommerce.ts             # WooCommerce test helpers
  wordpress.ts               # WordPress test helpers
utils/
  settings.ts                # Settings API utilities
```

Plugin-specific tests live in `tests/<plugin-name>/`. Tests that apply across plugins (admin page loading, settings CRUD, diagnostics) live in `tests/shared/`.

## Global Setup

`global-setup.ts` runs once before the test suite and:

1. Authenticates as the WordPress admin and saves session state
2. Re-activates plugins that create DB tables on activation (e.g. headless-fuzzy-find)
3. Enables pretty permalinks (`/%postname%/`) for REST API routes
4. Bypasses WooCommerce onboarding and installs default pages
5. Configures WooCommerce store basics (address, currency)
6. Creates test products (Test Widget $25, Premium Gadget $99.50)
7. Enables OTP auth test mode
8. Flushes rewrite rules

## wp-env Configuration

`.wp-env.json` configures the local WordPress instance:

- **PHP 8.2**
- **WP_DEBUG** and **WP_DEBUG_LOG** enabled
- All six headless plugins loaded from their `dist/` directories
- WooCommerce installed from wordpress.org

## Adding Tests

- **Plugin-specific**: Create `tests/<plugin-name>/<feature>.spec.ts`
- **Cross-plugin**: Add to `tests/shared/`
- **Fixtures/utilities**: Add to `fixtures/` or `utils/`
