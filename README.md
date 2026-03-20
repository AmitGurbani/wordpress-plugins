# WordPress Plugins

Turborepo monorepo for WordPress plugins and tooling, using pnpm workspaces.

## Packages

| Package | Description | Docs |
|---------|-------------|------|
| [wpts](packages/wpts/) | TypeScript-to-WordPress-Plugin transpiler | [README](packages/wpts/README.md) |
| [headless-otp-auth](packages/headless-otp-auth/) | Mobile OTP authentication with JWT for headless WordPress | [Integration](packages/headless-otp-auth/docs/integration-guide.md) · [Admin](packages/headless-otp-auth/docs/admin-guide.md) |
| [fuzzyfind](packages/fuzzyfind/) | Weighted, fuzzy WooCommerce product search with autocomplete (built with wpts) | [Integration](packages/fuzzyfind/docs/integration-guide.md) · [Admin](packages/fuzzyfind/docs/admin-guide.md) |
| [meta-pixel](packages/meta-pixel/) | Meta Pixel with WooCommerce CAPI integration for headless WordPress (built with wpts) | [Integration](packages/meta-pixel/docs/integration-guide.md) · [Admin](packages/meta-pixel/docs/admin-guide.md) |

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
