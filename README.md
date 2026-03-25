# WordPress Plugins

Turborepo monorepo for WordPress plugins and tooling, using pnpm workspaces.

## Packages

| Package | Description | Docs |
|---------|-------------|------|
| [wpts](packages/wpts/) | TypeScript-to-WordPress-Plugin transpiler | [README](packages/wpts/README.md) |
| [headless-otp-auth](packages/headless-otp-auth/) | Mobile OTP authentication with JWT for headless WordPress | [Integration](packages/headless-otp-auth/docs/integration-guide.md) · [Admin](packages/headless-otp-auth/docs/admin-guide.md) |
| [headless-fuzzyfind](packages/headless-fuzzyfind/) | Weighted, fuzzy WooCommerce product search with autocomplete (built with wpts) | [Integration](packages/headless-fuzzyfind/docs/integration-guide.md) · [Admin](packages/headless-fuzzyfind/docs/admin-guide.md) |
| [headless-meta-pixel](packages/headless-meta-pixel/) | Meta Pixel with WooCommerce CAPI integration for headless WordPress (built with wpts) | [Integration](packages/headless-meta-pixel/docs/integration-guide.md) · [Admin](packages/headless-meta-pixel/docs/admin-guide.md) |
| [headless-umami](packages/headless-umami/) | Umami Analytics with WooCommerce purchase tracking for headless WordPress (built with wpts) | [Integration](packages/headless-umami/docs/integration-guide.md) · [Admin](packages/headless-umami/docs/admin-guide.md) |
| [headless-google-analytics](packages/headless-google-analytics/) | Google Analytics (GA4) with WooCommerce Measurement Protocol for headless WordPress (built with wpts) | [Integration](packages/headless-google-analytics/docs/integration-guide.md) · [Admin](packages/headless-google-analytics/docs/admin-guide.md) |

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

## Requirements

- Node.js >= 20
- pnpm >= 9
