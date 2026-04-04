# e2e — Playwright End-to-End Tests

Playwright tests running against a wp-env Docker WordPress instance, covering all plugins.

## Commands

- `pnpm test` — Run all Playwright tests
- `pnpm test:ui` — Playwright UI mode
- `pnpm test:debug` — Debug mode
- `pnpm wp-env:start` — Start WordPress Docker (required before tests)
- `pnpm wp-env:stop` — Stop WordPress Docker

## Test Organization

- **Shared tests** (`tests/shared/`): iterate over the `PLUGINS` array from `utils/settings.ts` — add new plugin config there, not duplicate test files
- **Plugin-specific tests** (`tests/<plugin-slug>/`): use `const SLUG` and `const BASE` at top
- **Fixtures**: `fixtures/wordpress.ts` (RestApiClient, wpCli) and `fixtures/woocommerce.ts`

## Conventions

- Import `test` and `expect` from `../../fixtures/wordpress` — not from `@playwright/test` directly
- For unauthenticated requests (testing 401s, public endpoints): `playwrightRequest.newContext()`, dispose after use
- REST API base URL: `http://localhost:8889` (wp-env test instance, not 8888 dev)
- `wpCli` runs `wp-env run tests-cli wp <command>` with 60s timeout — use for setup/teardown of WP state
- Global setup (`global-setup.ts`) handles: admin auth, plugin activation cycling, permalink structure, WooCommerce config, test products — don't duplicate in individual tests
- WordPress returns numbers as strings via `get_option` — compare with `String(data[key])` in assertions
- Requires Docker for wp-env; config has `reuseExistingServer: true`
