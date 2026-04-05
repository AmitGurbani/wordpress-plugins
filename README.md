# WordPress Plugins

[![CI](https://github.com/AmitGurbani/wordpress-plugins/actions/workflows/ci.yml/badge.svg)](https://github.com/AmitGurbani/wordpress-plugins/actions/workflows/ci.yml)
[![License: GPL-2.0-or-later](https://img.shields.io/badge/License-GPL--2.0--or--later-blue.svg)](LICENSE)

Turborepo monorepo for WordPress plugins and tooling, using pnpm workspaces.

## Packages

| Package | Description | Docs |
|---------|-------------|------|
| [admin-ui](packages/admin-ui/) | Shared React admin UI components (useSettings, SettingsShell, DiagnosticsPanel, FormSection, AlertBox, InfoPopover, SecretField) | [README](packages/admin-ui/README.md) |
| [wpts](packages/wpts/) | TypeScript-to-WordPress-Plugin transpiler | [README](packages/wpts/README.md) |
| [headless-otp-auth](packages/headless-otp-auth/) | Mobile OTP authentication with JWT for headless WordPress | [Integration](packages/headless-otp-auth/docs/integration-guide.md) · [Admin](packages/headless-otp-auth/docs/admin-guide.md) |
| [headless-fuzzyfind](packages/headless-fuzzyfind/) | Weighted, fuzzy WooCommerce product search with autocomplete (built with wpts) | [Integration](packages/headless-fuzzyfind/docs/integration-guide.md) · [Admin](packages/headless-fuzzyfind/docs/admin-guide.md) |
| [headless-meta-pixel](packages/headless-meta-pixel/) | Meta Pixel with WooCommerce CAPI integration for headless WordPress (built with wpts) | [Integration](packages/headless-meta-pixel/docs/integration-guide.md) · [Admin](packages/headless-meta-pixel/docs/admin-guide.md) |
| [headless-umami](packages/headless-umami/) | Umami Analytics with WooCommerce purchase tracking for headless WordPress (built with wpts) | [Integration](packages/headless-umami/docs/integration-guide.md) · [Admin](packages/headless-umami/docs/admin-guide.md) |
| [headless-google-analytics](packages/headless-google-analytics/) | Google Analytics (GA4) with WooCommerce Measurement Protocol for headless WordPress (built with wpts) | [Integration](packages/headless-google-analytics/docs/integration-guide.md) · [Admin](packages/headless-google-analytics/docs/admin-guide.md) |
| [headless-clarity](packages/headless-clarity/) | Microsoft Clarity session recordings and heatmaps for headless WordPress (built with wpts) | [Integration](packages/headless-clarity/docs/integration-guide.md) · [Admin](packages/headless-clarity/docs/admin-guide.md) |
| [headless-pos-sessions](packages/headless-pos-sessions/) | POS register session storage with REST API for headless WordPress (built with wpts) | [Integration](packages/headless-pos-sessions/docs/integration-guide.md) · [Admin](packages/headless-pos-sessions/docs/admin-guide.md) |
| [headless-wishlist](packages/headless-wishlist/) | REST API wishlist for headless WordPress/WooCommerce (built with wpts) | [README](packages/headless-wishlist/README.md) |
| [e2e](packages/e2e/) | Playwright end-to-end tests for all plugins (wp-env) | [README](packages/e2e/README.md) |

## Getting Started

```bash
pnpm install
turbo run build
turbo run test
```

Run a script in a specific package:

```bash
pnpm --filter wpts test
pnpm --filter headless-otp-auth build
```

### E2E Tests

Requires Docker for the [wp-env](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-env/) WordPress instance.

```bash
pnpm test:e2e                    # Run all e2e tests
pnpm --filter e2e test:ui        # Playwright UI mode
```

### Linting & Formatting

[Biome](https://biomejs.dev/) handles linting and formatting across the monorepo.

```bash
pnpm lint              # Lint all packages (via turbo)
pnpm check             # Lint + format check all packages (CI)
pnpm format            # Auto-format entire monorepo
pnpm biome check --write .   # Fix all auto-fixable lint + format issues
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, commit conventions, and PR guidelines.

## License

This project is licensed under [GPL-2.0-or-later](LICENSE), consistent with the WordPress ecosystem. The [`wpts`](packages/wpts/) transpiler is licensed under [MIT](packages/wpts/LICENSE).

## Requirements

- Node.js >= 20
- pnpm >= 9
