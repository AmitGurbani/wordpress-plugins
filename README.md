# WordPress Plugins

Turborepo monorepo for WordPress plugins and tooling, using pnpm workspaces.

## Packages

| Package | Description |
|---------|-------------|
| [wpts](packages/wpts/) | TypeScript-to-WordPress-Plugin transpiler |
| [headless-otp-auth](packages/headless-otp-auth/) | Mobile OTP authentication with JWT for headless WordPress |

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
